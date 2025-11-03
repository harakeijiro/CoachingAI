"use client";

import { useRef, useState, useEffect } from "react";
import { getOrCreateSessionId } from "@/lib/utils/session";
import { useWebSpeech } from "@/lib/hooks/useWebSpeech";
import {
  VOICE_THRESHOLD,
  SILENCE_MS,
  POLL_MS,
  MAX_RECORDING_TIME,
  RECORD_COOLDOWN,
  WEB_SPEECH_RESTART_DELAY,
  TTS_END_DELAY,
  ERROR_RETRY_DELAY,
  ERROR_NORMAL_DELAY,
  FFT_SIZE,
  SMOOTHING_TIME_CONSTANT,
} from "@/lib/utils/audio-constants";
import type { UseWhisperProps, UseWhisperReturn } from "@/lib/types/whisper";
import {
  createVoiceLevelMonitor,
  type VoiceLevelMonitor,
} from "@/lib/utils/voice-level-monitor";
import { createAudioProcessingPipeline } from "@/lib/utils/audio-pipeline";
import {
  createRecordingManager,
  type RecordingManager,
} from "@/lib/utils/recording-manager";

/**
 * Whisper音声認識カスタムフック
 * - MediaRecorderで音声を録音
 * - 音声レベル監視による自動停止（静寂検知）
 * - Web Speech APIによる仮テキスト表示
 * - Whisper APIで文字起こし + LLM返答 + TTS再生
 * - TTS終了後の自動録音再開（話し始め検知）
 */

export const useWhisper = ({
  onResult,
  onError,
  onTtsEnd,
  isVoiceEnabled = () => true, // デフォルトは有効（後方互換性のため）
  memories = [], // セッション開始時に取得したメモリ（ステップ1: 追加）
  onMemoryUpdated, // メモリが更新された可能性がある場合のコールバック
}: UseWhisperProps): UseWhisperReturn => {
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [canRecord, setCanRecord] = useState(true); // 録音可能フラグ
  const [sessionId] = useState(() => getOrCreateSessionId());
  const [userText, setUserText] = useState<string>("");
  const [replyText, setReplyText] = useState<string>("");
  
  // メモリをrefで保持（常に最新の値を参照するため）
  const memoriesRef = useRef<UseWhisperProps["memories"]>(memories);
  
  // メモリプロップが変更されたらrefを更新
  useEffect(() => {
    memoriesRef.current = memories;
  }, [memories]);
  
  // Web Speech APIを使用してリアルタイム音声認識を取得
  // isSpeakingの状態を渡して、TTS再生中は認識を停止するようにする
  const { getLatestTranscript, clearTranscript, restartRecognition: restartWebSpeech } = useWebSpeech(() => isSpeaking);
  
  const recordingManagerRef = useRef<RecordingManager | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const isRecordingRef = useRef(false); // isRecording状態をrefで管理
  const currentMessageIdRef = useRef<string | null>(null); // 現在のメッセージIDを保持
  const isProcessingRef = useRef(false); // onstopの多重発火防止
  
  // 音声レベル監視用
  const voiceLevelMonitorRef = useRef<VoiceLevelMonitor | null>(null);
  // 録音加工用AudioContext
  const recordingAudioContextRef = useRef<AudioContext | null>(null);
  const waitingForVoiceRef = useRef(false); // TTS終了後、ユーザーの話し始めを待っているフラグ
  const voiceDetectionIntervalRef = useRef<NodeJS.Timeout | null>(null); // 話し始め検知用のインターバル
  const waitingForVoiceStreamRef = useRef<MediaStream | null>(null); // 話し始め検知用のストリーム
  const waitingForVoiceAudioContextRef = useRef<AudioContext | null>(null); // 話し始め検知用のAudioContext

  // 音声レベル監視を開始
  const startVoiceLevelMonitoring = (stream: MediaStream) => {
    // 既存の監視があれば停止
    stopVoiceLevelMonitoring();

    try {
      const monitor = createVoiceLevelMonitor(
        stream,
        {
          isRecording: () => isRecordingRef.current,
            onSilenceDetected: () => {
            stopVoiceLevelMonitoring();
            if (recordingManagerRef.current?.isRecording()) {
              recordingManagerRef.current.stop();
            }
          },
          onError: (error) => {
            console.error("音声レベル監視エラー:", error);
          },
        },
        {
          threshold: VOICE_THRESHOLD,
          silenceMs: SILENCE_MS,
          pollMs: POLL_MS,
        }
      );

      voiceLevelMonitorRef.current = monitor;
    } catch (error) {
      console.error("音声レベル監視の開始に失敗:", error);
    }
  };
  
  // 音声レベル監視を停止
  const stopVoiceLevelMonitoring = () => {
    // 話し始め検知のインターバルもクリア
    if (voiceDetectionIntervalRef.current) {
      clearInterval(voiceDetectionIntervalRef.current);
      voiceDetectionIntervalRef.current = null;
    }
    
    // 話し始め検知用のストリームとAudioContextもクリーンアップ
    if (waitingForVoiceStreamRef.current) {
      waitingForVoiceStreamRef.current.getTracks().forEach((track) => track.stop());
      waitingForVoiceStreamRef.current = null;
    }
    if (waitingForVoiceAudioContextRef.current) {
      waitingForVoiceAudioContextRef.current.close().catch(console.error);
      waitingForVoiceAudioContextRef.current = null;
    }
    
    // 音声レベル監視を停止
    if (voiceLevelMonitorRef.current) {
      voiceLevelMonitorRef.current.stop();
      voiceLevelMonitorRef.current = null;
    }
  };

  // TTS終了後、ユーザーの話し始めを検知して録音を自動開始
  const startWaitingForVoice = async () => {
    // マイクが無効の場合は何もしない
    if (!isVoiceEnabled()) {
      return;
    }
    
    // 既に待機中なら何もしない
    if (waitingForVoiceRef.current) {
      return;
    }
    
    // 録音禁止タイミングをチェック
    if (!canRecord) {
      return;
    }
    
    // キャラが話している間は何もしない
    if (isSpeaking) {
      return;
    }
    
    // 既に録音中なら何もしない
    if (isRecording) {
      return;
    }
    
    waitingForVoiceRef.current = true;

    try {
      // マイクへのアクセスを取得（録音はまだ開始しない）
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 16000,
        }
      });

      // ストリームへの参照を保持（stopRecording時に停止できるようにする）
      waitingForVoiceStreamRef.current = stream;

      // 音声レベル監視用のAudioContextを作成
      const audioContext = new AudioContext();
      waitingForVoiceAudioContextRef.current = audioContext; // AudioContextへの参照も保持
      const analyser = audioContext.createAnalyser();
      const microphone = audioContext.createMediaStreamSource(stream);
      
      analyser.fftSize = FFT_SIZE;
      analyser.smoothingTimeConstant = SMOOTHING_TIME_CONSTANT;
      microphone.connect(analyser);
      
      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      
      // ユーザーが話し始めたら録音を開始
      // ④ チェックの再スケジュールを 60ms に
      voiceDetectionIntervalRef.current = setInterval(() => {
        if (!waitingForVoiceRef.current) {
          // 待機が解除された（既に録音開始済み）
          clearInterval(voiceDetectionIntervalRef.current!);
          voiceDetectionIntervalRef.current = null;
          if (waitingForVoiceStreamRef.current) {
            waitingForVoiceStreamRef.current.getTracks().forEach((track) => track.stop());
            waitingForVoiceStreamRef.current = null;
          }
          if (waitingForVoiceAudioContextRef.current) {
            waitingForVoiceAudioContextRef.current.close().catch(console.error);
            waitingForVoiceAudioContextRef.current = null;
          }
          return;
        }

        analyser.getByteFrequencyData(dataArray);
        const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
        
        if (average >= VOICE_THRESHOLD) {
          // ユーザーが話し始めた
          waitingForVoiceRef.current = false;
          
          // クリーンアップ
          clearInterval(voiceDetectionIntervalRef.current!);
          voiceDetectionIntervalRef.current = null;
          if (waitingForVoiceStreamRef.current) {
            waitingForVoiceStreamRef.current.getTracks().forEach((track) => track.stop());
            waitingForVoiceStreamRef.current = null;
          }
          if (waitingForVoiceAudioContextRef.current) {
            waitingForVoiceAudioContextRef.current.close().catch(console.error);
            waitingForVoiceAudioContextRef.current = null;
          }
          
          // 録音を開始
          startRecording();
        }
      }, POLL_MS);
      
    } catch (error) {
      console.error("話し始め検知の開始に失敗:", error);
      waitingForVoiceRef.current = false;
      if (waitingForVoiceStreamRef.current) {
        waitingForVoiceStreamRef.current.getTracks().forEach((track) => track.stop());
        waitingForVoiceStreamRef.current = null;
      }
      if (waitingForVoiceAudioContextRef.current) {
        waitingForVoiceAudioContextRef.current.close().catch(console.error);
        waitingForVoiceAudioContextRef.current = null;
      }
    }
  };

  const startRecording = async (forceStart: boolean = false) => {
    // マイクが無効の場合は何もしない（forceStartの場合はスキップ - 手動でONにした場合は強制的に開始）
    if (!forceStart && !isVoiceEnabled()) {
      return;
    }
    
    // 話し始め待機中なら解除
    if (waitingForVoiceRef.current) {
      waitingForVoiceRef.current = false;
      if (voiceDetectionIntervalRef.current) {
        clearInterval(voiceDetectionIntervalRef.current);
        voiceDetectionIntervalRef.current = null;
      }
    }
    
    // 録音禁止タイミングをチェック（forceStartの場合はスキップ）
    if (!forceStart && !canRecord) {
      return;
    }
    
    // キャラが話している間は録音しない
    if (isSpeaking) {
      return;
    }
    
    // 既に録音中なら何もしない
    if (isRecording) {
      return;
    }

    try {
      
      // マイクへのアクセスを取得
      const rawStream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true, // 音量自動調整を追加（音量差を補正）
          // sampleRate: 16000, // ← 推奨: 外す（コメントアウト）
        }
      });

      // 録音開始時にWeb Speech APIの結果をクリア（前回の認識結果をリセット）
      clearTranscript();

      // 音声処理パイプラインを作成（処理を最小限にして音質向上）
      // skipProcessing: true で DynamicsCompressor + GainNode をスキップ
      const pipeline = createAudioProcessingPipeline(rawStream, {}, true);
      streamRef.current = pipeline.rawStream; // 物理ストップ用に元も保持
      recordingAudioContextRef.current = pipeline.audioContext; // クリーンアップ用に保持

      // 録音管理を作成
      const recordingManager = createRecordingManager(pipeline.processedStream, {
        onRecordingComplete: async (audioBlob: Blob) => {
          // 多重発火防止
          if (isProcessingRef.current) {
            return;
          }
          isProcessingRef.current = true;

          try {
            // STEP3-1: 録音停止直後に messageId を作成
            const tempMessageId = crypto.randomUUID();
            currentMessageIdRef.current = tempMessageId;

            // STEP3-2: Web Speech APIの結果を仮テキストとして表示
            // もしWeb Speech APIで認識されたテキストがあればそれを使い、なければ"…"を表示
            const heardText = getLatestTranscript().trim() || "…";
            onResult(tempMessageId, heardText);

            // 次の録音の前に、Web Speech APIの結果をクリア
            clearTranscript();
            // onstop からは削除：restartWebSpeech();（競合回避のため）

            // 録音を停止（既にonstopが呼ばれているので、追加の停止処理は不要）
            setCanRecord(false);
            streamRef.current?.getTracks().forEach((t) => t.stop());
            streamRef.current = null;
            // AudioContextのクリーンアップ（リーク防止）
            // skipProcessing=trueの場合はaudioContextがnullなので、チェックしてからclose
            if (recordingAudioContextRef.current) {
              recordingAudioContextRef.current.close().catch(() => {});
              recordingAudioContextRef.current = null;
            }

            // 録音データのサイズは既にrecording-managerでチェック済み

            // STEP3-3: Whisper API を呼び出す
            const formData = new FormData();
            formData.append("audio", audioBlob, "audio.webm");
            formData.append("sessionId", sessionId);
            // Web Speech APIの結果をinitial_promptとしてWhisper APIに送信
            // "…"の場合は空文字として扱う
            const webSpeechText = heardText !== "…" ? heardText : "";
            formData.append("webSpeechText", webSpeechText);
            // メモリをFormDataに含める（refから最新のメモリを取得）
            const currentMemories = memoriesRef.current || [];
            if (currentMemories && Array.isArray(currentMemories) && currentMemories.length > 0) {
              formData.append("memories", JSON.stringify(currentMemories));
            }

            const response = await fetch("/api/asr", {
              method: "POST",
              body: formData,
            });

            if (!response.ok) {
              const errorText = await response.text().catch(() => "");
              let errorMessage = `ASR API error: ${response.status}`;
              
              // 503エラーの場合、より詳細なメッセージを表示
              if (response.status === 503) {
                errorMessage = "サーバーが一時的に利用できません。しばらく待ってから再度お試しください。";
                console.error("ASR API 503 error:", errorText);
              } else {
                console.error("ASR API error:", response.status, errorText);
              }
              
              throw new Error(errorMessage);
            }

            const data = await response.json();

            // メモリが更新された可能性がある場合、少し待ってからコールバックを呼ぶ
            if (data.memoryMayBeUpdated && onMemoryUpdated) {
              // メモリ保存は非同期で実行されているため、少し待ってから通知する
              setTimeout(() => {
                onMemoryUpdated();
              }, 1000); // 1秒待機（メモリ保存が完了する時間を考慮）
            }

            // サーバ側で棄却された場合（drop: true）の処理
            if (data.drop) {
              console.log("[useWhisper] Server rejected audio (too short or no speech)");
              setIsSpeaking(false);
              setCanRecord(true);
              // 仮テキスト（"…"）を削除
              if (currentMessageIdRef.current) {
                onResult(currentMessageIdRef.current, "");
                currentMessageIdRef.current = null;
              }
              isProcessingRef.current = false;
              
              // unclearの場合は、返答があれば再生（「聞こえませんでした」などのメッセージ）
              if (data.unclear && data.replyText && data.audioData) {
                setIsSpeaking(true);
                
                try {
                  const audioBytes = Uint8Array.from(atob(data.audioData), c => c.charCodeAt(0));
                  const blob = new Blob([audioBytes], { type: "audio/wav" });
                  const url = URL.createObjectURL(blob);
                  const audio = new Audio(url);

                  audio.onended = () => {
                    URL.revokeObjectURL(url);
                    setIsSpeaking(false);
                    
                    onTtsEnd?.();
                    
                    // TTS終了後、少し待機してから録音可能にする
                    setTimeout(() => {
                      setCanRecord(true);
                      // さらに少し待機してから、ユーザーの話し始めを検知して録音を自動開始
                      setTimeout(() => {
                        startWaitingForVoice();
                      }, 100);
                    }, TTS_END_DELAY);
                  };

                  audio.onerror = (err) => {
                    console.error("Step 5: 音声再生エラー:", err);
                    URL.revokeObjectURL(url);
                    setIsSpeaking(false);
                    
                    setTimeout(() => {
                      setCanRecord(true);
                      setTimeout(() => {
                        startWaitingForVoice();
                      }, 100);
                    }, TTS_END_DELAY);
                  };

                  audio.play().catch((error) => {
                    console.error("Step 5: 音声再生失敗:", error);
                    setIsSpeaking(false);
                    
                    setTimeout(() => {
                      setCanRecord(true);
                      setTimeout(() => {
                        startWaitingForVoice();
                      }, 100);
                    }, TTS_END_DELAY);
                  });
                } catch (error) {
                  console.error("Step 5: 音声再生失敗:", error);
                  setIsSpeaking(false);
                  setCanRecord(true);
                  
                  setTimeout(() => {
                    startWaitingForVoice();
                  }, 100);
                }
              } else {
                // unclearでない場合は録音を再開（ユーザーの話し始めを検知）
                setTimeout(() => {
                  startWaitingForVoice();
                }, 100);
              }
              return;
            }

            // STEP3-4: Whisper APIの結果は内部stateに保存するが、UI表示は更新しない
            // （仮テキスト（Web Speech API）の表示を維持）
            if (data.userText && data.userText.trim().length > 0) {
              setUserText(data.userText); // 内部stateに保存（互換性のため）
              // onResultは呼ばない（仮テキストの表示を維持）
            }

            // STEP5: 返答テキストは後でしゃべらせる（これは今まで通り）
            if (data.replyText) {
              setReplyText(data.replyText);
            }

            // STEP3-5: キャラ音声(TTS)は、ユーザー発話の表示を待たない
            // 注: onResult は呼ばない（犬の文字はUIに出さない、音声のみ再生）
            if (data.audioData && data.replyText) {
              setIsSpeaking(true);

              try {
                const audioBytes = Uint8Array.from(atob(data.audioData), c => c.charCodeAt(0));
                const blob = new Blob([audioBytes], { type: "audio/wav" });
                const url = URL.createObjectURL(blob);
                const audio = new Audio(url);

                audio.onended = () => {
                  URL.revokeObjectURL(url);
                  // まずisSpeakingをfalseにしてから少し待機（キャラ音声の回り込みを防ぐ）
                  setIsSpeaking(false);
                  
                  onTtsEnd?.();
                  
                  // TTS終了後、少し待機してから録音可能にする（キャラ音声の回り込みを防ぐ）
                  setTimeout(() => {
                    setCanRecord(true);
                    // さらに少し待機してから、ユーザーの話し始めを検知して録音を自動開始
                    setTimeout(() => {
                      startWaitingForVoice();
                    }, 100);
                  }, TTS_END_DELAY);
                };

                audio.onerror = (err) => {
                  console.error("Step 5: 音声再生エラー:", err);
                  URL.revokeObjectURL(url);
                  setIsSpeaking(false);
                  
                  // エラー時も、少し待機してから録音可能にする
                  setTimeout(() => {
                    setCanRecord(true);
                    setTimeout(() => {
                      startWaitingForVoice();
                    }, 100);
                  }, TTS_END_DELAY);
                };

                audio.play().catch((error) => {
                  console.error("Step 5: 音声再生失敗:", error);
                  setIsSpeaking(false);
                  
                  // エラー時も、少し待機してから録音可能にする
                  setTimeout(() => {
                    setCanRecord(true);
                    setTimeout(() => {
                      startWaitingForVoice();
                    }, 100);
                  }, TTS_END_DELAY);
                });

              } catch (error) {
                console.error("Step 5: 音声再生失敗:", error);
                setIsSpeaking(false);
                setCanRecord(true);
                
                // エラー時も、ユーザーの話し始めを検知して録音を自動開始
                setTimeout(() => {
                  startWaitingForVoice();
                }, 100);
              }
            } else if (data.replyText) {
              // 返答テキストはあるが、音声データがない場合
              // （TTS生成に失敗したが、返答は生成されている）
              console.warn("[useWhisper] Reply text received but no audio data");
              setIsSpeaking(false);
              setCanRecord(true);
              
              // 少し待機してからユーザーの話し始めを検知して録音を自動開始
              setTimeout(() => {
                startWaitingForVoice();
              }, 100);
            } else {
              // 返答がない場合（エラーまたは空の返答）
              console.warn("[useWhisper] No reply text or audio data received");
              setIsSpeaking(false);
              setCanRecord(true);
              
              // 少し待機してからユーザーの話し始めを検知して録音を自動開始
              setTimeout(() => {
                startWaitingForVoice();
              }, 100);
            }

          } catch (error) {
            console.error("Step 3: 送信エラー:", error);
            
            // エラー時は一時メッセージ（"…"）を削除
            if (currentMessageIdRef.current) {
              const errorMessageId = currentMessageIdRef.current;
              onResult(errorMessageId, ""); // 空文字でメッセージを削除
              currentMessageIdRef.current = null;
            }
            
            setIsSpeaking(false);
            setCanRecord(true); // エラー時も録音OKに戻す
            
            // エラーメッセージを表示
            const errorMessage = error instanceof Error ? error.message : "Unknown error";
            onError(errorMessage);
            
            // エラー時も、ユーザーの話し始めを検知して録音を自動開始
            // ただし、503エラーの場合は少し長めに待機する
            const delay = errorMessage.includes("503") || errorMessage.includes("サーバーが一時的に") ? ERROR_RETRY_DELAY : ERROR_NORMAL_DELAY;
            setTimeout(() => {
              startWaitingForVoice();
            }, delay);
          } finally {
            // 多重発火防止フラグをリセット
            isProcessingRef.current = false;
          }
        },
        onError: (error) => {
          console.error("[useWhisper] Recording error:", error);
          if (error.message.includes("Audio too short")) {
            console.log("[useWhisper] Audio too short, rejecting");
            setIsSpeaking(false);
            setCanRecord(true);
          } else {
            onError(error.message);
          }
        },
      });

      recordingManagerRef.current = recordingManager;

      // 録音開始
      recordingManager.start();

      // Web Speech APIを遅延再起動（録音開始後、競合回避のため）
      setTimeout(() => {
        try { 
          restartWebSpeech(); 
        } catch (e) {
          console.error("[useWhisper] Web Speech再起動エラー:", e);
        }
      }, WEB_SPEECH_RESTART_DELAY);
      setIsRecording(true);
      isRecordingRef.current = true;
      currentMessageIdRef.current = null; // 録音開始時にメッセージIDをクリア

      // 音声レベル監視を開始（rawStreamを使用）
      startVoiceLevelMonitoring(rawStream);

      // 30秒後に自動停止（誤って録音し続けるのを防ぐ）
      setTimeout(() => {
        if (isRecordingRef.current && recordingManagerRef.current?.isRecording()) {
          stopVoiceLevelMonitoring();
          recordingManagerRef.current.stop();
          setIsRecording(false);
          isRecordingRef.current = false;
        }
      }, MAX_RECORDING_TIME);
    } catch (error) {
      console.error("Step 3: 録音失敗:", error);
      onError(error instanceof Error ? error.message : "マイクのアクセスに失敗しました");
    }
  };

  const stopRecording = () => {
    if (!isRecording) return;
    
    // 話し始め待機中なら解除（マイクオフ時に自動録音が開始されないようにする）
    if (waitingForVoiceRef.current) {
      waitingForVoiceRef.current = false;
      if (voiceDetectionIntervalRef.current) {
        clearInterval(voiceDetectionIntervalRef.current);
        voiceDetectionIntervalRef.current = null;
      }
    }
    
    // 音声レベル監視を停止
    stopVoiceLevelMonitoring();
    
    // これ以上は録音させない
    setCanRecord(false);
    
    // 録音停止
    if (recordingManagerRef.current?.isRecording()) {
      recordingManagerRef.current.stop();
    }
    setIsRecording(false);
    isRecordingRef.current = false;
    
    // マイクストリーム物理的に切る
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    // AudioContextのクリーンアップ（リーク防止）
    // skipProcessing=trueの場合はaudioContextがnullなので、チェックしてからclose
    if (recordingAudioContextRef.current) {
      recordingAudioContextRef.current.close().catch(() => {});
      recordingAudioContextRef.current = null;
    }
    
    // クールダウン期間中は再録音禁止
    setTimeout(() => setCanRecord(true), RECORD_COOLDOWN);
  };

  const cancelRecording = () => {
    if (!isRecording) return;

    // 話し始め待機中なら解除（マイクオフ時に自動録音が開始されないようにする）
    if (waitingForVoiceRef.current) {
      waitingForVoiceRef.current = false;
      if (voiceDetectionIntervalRef.current) {
        clearInterval(voiceDetectionIntervalRef.current);
        voiceDetectionIntervalRef.current = null;
      }
    }

    // 音声レベル監視を停止
    stopVoiceLevelMonitoring();

    // 録音をキャンセル
    if (recordingManagerRef.current?.isRecording()) {
      recordingManagerRef.current.cancel();
    }
    setIsRecording(false);
    isRecordingRef.current = false;

    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    // AudioContextのクリーンアップ（リーク防止）
    // skipProcessing=trueの場合はaudioContextがnullなので、チェックしてからclose
    if (recordingAudioContextRef.current) {
      recordingAudioContextRef.current.close().catch(() => {});
      recordingAudioContextRef.current = null;
    }

    setCanRecord(true);
  };

  return {
    isRecording,
    isSpeaking,
    startRecording,
    stopRecording,
    cancelRecording,
    sessionId,
    userText,
    replyText,
  };
};


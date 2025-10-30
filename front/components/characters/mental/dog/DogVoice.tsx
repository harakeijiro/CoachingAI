/**
 * 犬キャラクターの音声機能コンポーネント
 * - 会話中（isSpeaking）にsin波で口パクアニメーションを実行
 * - 口のモーフターゲットを制御して自然な動きを実現
 */

import React from "react";
import { useFrame } from "@react-three/fiber";
import { DogVoiceState, DogModelRefs } from "./DogTypes";

interface DogVoiceProps {
  voiceState: DogVoiceState;
  refs: DogModelRefs;
}

export function DogVoice({ voiceState, refs }: DogVoiceProps) {
  // 口パクアニメーション
  useFrame((state) => {
    if (
      voiceState.isSpeaking &&
      refs.mouseRef.current &&
      refs.mouseRef.current.morphTargetInfluences
    ) {
      // sin波を使って0から1の値を滑らかに生成し、口の動きを表現
      const influence = (Math.sin(state.clock.elapsedTime * 10) + 1) / 2;
      refs.mouseRef.current.morphTargetInfluences[0] = influence;

      // 口の内側も同期させる
      if (
        refs.mouseInsideRef.current &&
        refs.mouseInsideRef.current.morphTargetInfluences
      ) {
        refs.mouseInsideRef.current.morphTargetInfluences[0] = influence;
      }
    } else if (refs.mouseRef.current && refs.mouseRef.current.morphTargetInfluences) {
      // 話していない時は口を閉じる
      refs.mouseRef.current.morphTargetInfluences[0] = 0;
      if (
        refs.mouseInsideRef.current &&
        refs.mouseInsideRef.current.morphTargetInfluences
      ) {
        refs.mouseInsideRef.current.morphTargetInfluences[0] = 0;
      }
    }
  });

  return null; // 音声機能はrefsを通じて制御
}

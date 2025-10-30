Whisper導入

## ディレクトリ構造

```
front/
├── app/
│   ├── api/
│   │   ├── asr/           # 新規: Whisper + LLM + TTS統合エンドポイント
│   │   │   └── route.ts
│   │   ├── chat/          # 既存: テキストチャット用（残す）
│   │   │   └── route.ts
│   │   └── tts/           # 既存: TTS専用（残す）
│   │       └── route.ts
│   └── chat/
│       └── page.tsx       # 既存: チャットページ（Whisper版に更新）
├── lib/
│   ├── hooks/
│   │   ├── useWhisper.ts           # 新規: MediaRecorder録音機能
│   │   ├── useWhisperChat.ts       # 新規: Whisper版チャット制御
│   │   ├── useSpeechRecognition.ts # 既存: 削除予定（Web Speech API版）
│   │   ├── useTTS.ts               # 既存: TTS再生制御（残す）
│   │   └── useChat.ts              # 既存: テキストチャット用（残す）
│   └── utils/
│       └── session.ts     # 新規: セッション管理
└── components/
    └── chat/
        ├── WhisperChatInput.tsx    # 新規: Whisper版チャット入力UI
        ├── ChatInput.tsx           # 既存: テキスト入力用（残す）
        └── MicrophonePermissionPopup.tsx  # 既存: 残す
```

## 新規作成ファイル一覧

1. **front/app/api/asr/route.ts** - Whisper + LLM + TTS統合API
2. **front/lib/hooks/useWhisper.ts** - MediaRecorderベースの録音フック
3. **front/lib/hooks/useWhisperChat.ts** - Whisper版チャット制御フック
4. **front/lib/utils/session.ts** - セッション管理ユーティリティ
5. **front/components/chat/WhisperChatInput.tsx** - Whisper版チャット入力UI

## 削除予定ファイル

1. **front/lib/hooks/useSpeechRecognition.ts** - Web Speech API版（削除）

## 環境変数の追加

`.env.local`に以下を追加：

```env
OPENAI_API_KEY=your_openai_api_key_here
```

（既存の環境変数は維持）
- `GOOGLE_GENERATIVE_AI_API_KEY`
- `CARTESIA_API_KEY`
- `CARTESIA_VERSION`
- `GEMINI_MODEL`

---

ユーザーが話す → 自動で文字起こし（Whisper）

その文字をLLMに投げる → 返答が返ってくる

返答を音声（TTS）にしてキャラが話す

キャラが話している間はマイク停止

キャラが話し終わったら、また自動でマイクON

つまり「押して話す」じゃなくて「交互に会話できる（ハンズフリー）」状態。

ステップ2の全体アーキテクチャ
[ブラウザ]
  ├─ マイクで音声を録音 (MediaRecorder)
  ├─ サーバーに音声データを送信 (POST /api/asr)
  ├─ サーバーから返ってきたLLM返答テキスト/音声を受信
  ├─ キャラの音声を再生
  └─ キャラの発話が終わったら、また録音開始

[サーバー]
  ├─ /api/asr
  │    1. 音声をWhisperに渡して文字起こし
  │    2. 出たテキストをLLMに投げて返事を生成
  │    3. 返事をTTSで音声に変換
  │    4. {replyText, replyAudioUrl(or replyAudioBytes)} を返す
  └─ ストレージ(S3等) or バイト返却で音声をフロントに渡す


ポイント

Web Speech API（ブラウザの SpeechRecognition）はもう使わない。

useSpeechRecognition は「録音して送る」に作り替える。

useTTS はブラウザの speechSynthesis に依存せず、サーバー側TTS音声を <audio> で再生するだけにしていく。

実装ステップ（フロント側）
1. マイクから音声を取って、短いクリップとしてサーバーに送る

MediaRecorder を使って、例えば 2〜3秒ぶんとか、もしくは「ユーザーが黙った」と判断したタイミングで録音を止めて送る。

まずは「録音ボタン→喋る→止める→送る」でOK。あとで自動サイレント検知に拡張できる。

ざっくり流れ：

録音開始: navigator.mediaDevices.getUserMedia({ audio: true })

new MediaRecorder(stream, { mimeType: "audio/webm" })

録音停止時に ondataavailable で Blob が取れる

そのBlobを FormData に詰めて fetch('/api/asr', { method: 'POST', body: formData })

このfetchレスポンスで「テキスト／TTS音声のURL or base64」を受け取る。

重要なのは、“ブラウザ内で文字起こししない”。音声そのものをサーバーに渡してしまうこと。

2. キャラが話している間は録音しない

今のロジックでは「isSpeaking」があるよね？
この考え方は使い回せる。

isSpeaking === true の間は録音をスタートしない（録音ボタンを無効化／自動録音フラグを下げる）

キャラの音声再生が onended したら、isSpeaking = false に戻す

そのタイミングでまた録音スタンバイ状態に戻る

つまり：

ユーザー喋る→録音ファイル送信→TTSが返ってきて再生開始→isSpeaking=true→
   ←この間はユーザーの声を聞かない（ループ防止）
再生終了→isSpeaking=false→また録音OK


これで「AIの声をまたAIに聞かせちゃう」問題はかなり抑えられる。
音量ベース検知とかFFTとかは一旦外していい。
まずはロール（誰のターンか）で制御する。

3. 返ってきたTTS音声を再生する

サーバーから返すデータは2パターン考えられる：

パターンA: サーバー側で音声ファイルを一時URLにして返す
→ replyAudioUrl: "https://.../tmp12345.wav"
→ <audio src={replyAudioUrl} onended={...} /> で再生するだけ

パターンB: バイト列(Blob)を返す
→ フロントで URL.createObjectURL() して <audio> に食わせる
→ 再生後 URL.revokeObjectURL() でクリーンアップ

どっちもOK。最初はB（バイト列をそのまま返す）でもいい。S3とかCDNがまだ無いならBが楽。

実装ステップ（サーバー側）

ここがステップ2で一番の“新規領域”になる。

4. /api/asr エンドポイントを作る

サーバー側でやることはこの順番：

フロントから音声Blobを受け取る（FormDataで audio とか）

Whisperに投げてテキストを得る

LLMに「ユーザー発話」を投げて返答テキストをもらう

返答テキストをTTSにかけて音声バイトを得る

{ replyText, audioBytes } をResponseに返す

これがコアループ。

4-1. Whisper

OpenAIのWhisper APIを使うか、自前でWhisperを動かすかを選べる。

最初はOpenAIのWhisper APIでいい（サーバーからOpenAIに投げるだけ）。

Whisper APIにaudio/webmやaudio/oggを渡して文字起こし結果(JSON)を受け取る。

4-2. LLM

いまchatで使ってるバックエンド(= /api/chat 的なもの)と同じロジックを再利用すればいい。
つまり「過去のメッセージ履歴＋今回のユーザー発話」をLLMに渡して、返事テキストをもらう。

※ 会話の履歴管理はサーバー側でセッションIDやuserIDで持つ必要あり。
（今はフロントだけでstateを持ってるけど、音声経路に入るとサーバー側も履歴を知ってないと会話が続かない）

4-3. TTS

返答テキストを音声にする。

ここは選択肢いろいろ（例：OpenAIのTTS / ほかのクラウドTTS /自前TTS）。

まずは“すぐ使える安定API”を選んでOK。

出てきた音声バイト列をそのままレスポンスボディにのせて返す。

5. セッション/ターン管理

一番事故りやすいのがここ。
テキストだけのチャットと違って、音声の場合は「いつの会話の続きなの？」がサーバーから見えにくい。

最低限ほしいもの：

クライアントは sessionId を保持する（例: localStorageにUUID）

/api/asr に投げる時にその sessionId も一緒に送る

サーバー側は sessionId ごとに過去の会話を保持し、LLMに渡すコンテキストを組む

イメージ：

POST /api/asr
  formData:
    - audio: <音声バイト>
    - sessionId: "abc123"

サーバー側メモリ or DB:
  sessions["abc123"].history.push({ role: "user", text: "..." })
  ↓ LLM呼ぶ
  sessions["abc123"].history.push({ role: "assistant", text: "..." })


この仕組みがないと、毎回「はじめまして、どうしました？」になっちゃう。

---

## 実装の優先順位

ステップ2を組むうえでの優先順位

ここから始めるのが現実的な順です👇

録音→アップロード→文字起こし（Whisper）→テキスト返すだけ

まず /api/asr で返すのは {userText: "～です"} だけでいい

フロント側はそのテキストを画面に表示する
→ この時点でブラウザSpeechRecognitionを完全リタイアできる。でかい。

Whisperから出たテキストをLLMに投げて返答テキストを返す

/api/asr が { replyText: "〜だよ" } を返すようにする

フロントはそれをチャットログに追加する
→ もうほぼ「音声→会話アシスタント」になってる

TTSをサーバーで回して、音声バイナリを返す

フロントで <audio> で喋らせる

喋ってる間は録音オフ、喋り終えたら録音オン
→ これで「ハンズフリーの交互会話」完成

サイレント検知で“黙ったら自動送信”にする

今は「録音ボタン→止める→送る」でもいいけど

将来的に音量RMS/無音区間で自動停止＆送信できるようにする
※ これは後でOK。いきなりやらなくていい。
# Whisper onResult インターフェース変更ガイド

## 概要

`useWhisper` フックの `onResult` コールバックのインターフェースを変更しました。

**変更前:**
```typescript
onResult: (interim: string, finalText: string) => void;
```

**変更後:**
```typescript
onResult: (messageId: string, text: string) => void;
```

## 目的

- ユーザーが話し終えたら1秒後に自動送信
- すぐに「ユーザーの吹き出し」を画面に出す（仮テキスト "…" を表示）
- Whisperの最終テキストが返ってきたらその吹き出しの中身を書き換える
- キャラクター（犬）の返答テキストは表示しないで音声だけ再生する

## 変更内容

### ✅ STEP1: useWhisper.ts の onResult 引数を変更

`front/lib/hooks/useWhisper.ts` の `UseWhisperProps` インターフェースを更新済み。

### ✅ STEP2: 親コンポーネント側の onResult 実装案

実装例は `front/app/chat/page_whisper_onResult_implementation.tsx.example` を参照してください。

#### 実装手順:

1. **メッセージ型の定義を追加**:
```typescript
type VoiceMessage = {
  id: string;
  role: "user";
  text: string;
  pending: boolean;
};
```

2. **state の追加**:
```typescript
const [voiceMessages, setVoiceMessages] = useState<VoiceMessage[]>([]);
```

3. **onResult 関数の実装**:
```typescript
const handleWhisperResult = useCallback((messageId: string, text: string) => {
  setVoiceMessages((prev) => {
    const existingIndex = prev.findIndex((msg) => msg.id === messageId);
    
    if (existingIndex === -1) {
      // 新規作成
      return [
        ...prev,
        {
          id: messageId,
          role: "user" as const,
          text: text,
          pending: true,
        },
      ];
    } else {
      // 既存メッセージを更新
      const newMessages = [...prev];
      newMessages[existingIndex] = {
        ...newMessages[existingIndex],
        text: text,
        pending: text === "…",
      };
      return newMessages;
    }
  });
}, []);
```

4. **useWhisper の呼び出しを更新**:
```typescript
const { ... } = useWhisper({
  onResult: (messageId, text) => {
    handleWhisperResult(messageId, text);
  },
  // ...
});
```

### ✅ STEP3: useWhisper 内の mediaRecorder.onstop でやること

以下の実装が完了しています:

1. 録音停止直後に `messageId` を作成: `const tempMessageId = crypto.randomUUID();`
2. まず `onResult(tempMessageId, "…")` を呼んで、仮の吹き出しを即表示
3. Whisper API (`/api/asr`) を呼び、JSONを受け取る
4. `data.userText` があれば、`onResult(tempMessageId, data.userText)` を呼んで、仮メッセージを本物の文字に差し替える
5. `data.replyText` と `data.audioData` があれば、TTSは今まで通り再生する（ただし `onResult` は呼ばない）

### ✅ STEP4: 「処理中...」の表示を削除

既に削除済みです。録音停止時点では何も表示せず、Whisper APIの結果が返ってきた時点で表示します。

### ✅ STEP5: 既存の setUserText / setReplyText の維持

`setUserText` と `setReplyText` は state として残してありますが、UI表示のソースは基本 `messages[]` 側になるようコメントを追加しました。

### ✅ STEP6: 完全版の useWhisper.ts

`front/lib/hooks/useWhisper.ts` の修正が完了しています。

## 動作フロー

```
ユーザーが話し終える
   ↓
1秒間の静寂を検知
   ↓
録音停止
   ↓
messageId を作成（crypto.randomUUID()）
   ↓
onResult(messageId, "…") を呼ぶ（仮メッセージを即表示）
   ↓
Whisper APIに送信
   ↓
レスポンス受信
   ↓
onResult(messageId, data.userText) を呼ぶ（仮メッセージを本物の文字に差し替え）
   ↓
キャラクターの返答を再生（TTS・音声のみ、文字表示なし）
```

## 注意点

- ✅ Silence検知による自動停止など、録音まわりの挙動は壊していません
- ✅ 既存の TTS 再生ロジック（audio.play() など）は維持しています
- ✅ TypeScriptエラーにならないように型も整えました

## 次のステップ

1. `chat/page.tsx` に `handleWhisperResult` 関数を実装
2. `voiceMessages` state を追加
3. `useWhisper` の呼び出しを新しい形式に更新
4. UI で `voiceMessages` を表示するように変更

実装例は `front/app/chat/page_whisper_onResult_implementation.tsx.example` を参照してください。


# API 設計書 (Supabase 利用版)

## 1. はじめに

本ドキュメントは、AI コンパニオン開発プロジェクトにおける API および機能実装の仕様を定義するものです。
`documents/要件定義書.md` および `documents/DB設計書.md` に記載された要件に基づき設計されています。

本システムはバックエンドとして Supabase を利用します。複雑な処理は Supabase Edge Functions で実装し、単純なデータの読み書きはクライアントから Supabase Client SDK を通じて直接行うことを想定しています。

## 2. 認証

- **認証方式**: Supabase Auth を利用した JWT (JSON Web Token) ベースの認証を想定します。
- **認証フロー**:
  1. クライアントは Supabase Auth SDK を利用してユーザー登録・ログインを行います。
  2. 認証に成功すると、クライアントは JWT を取得します。
  3. クライアントは、認証が必要な API エンドポイントへのリクエスト時に、HTTP ヘッダーに JWT を含めて送信します。
- **ヘッダー形式**:
  ```
  Authorization: Bearer <your-jwt-token>
  ```

## 3. 機能実装設計

### 3.1. 対話機能 (Supabase Edge Function)

AI との対話や関連する複雑な処理は、`chat`という名前の Edge Function で実装します。

#### `POST /functions/v1/chat`

ユーザーからのメッセージを受け取り、AI による応答とキャラクターのリアクション情報を返します。また、対話履歴や記憶をデータベースに保存します。

- **機能要件**: 1.1, 1.2, 1.3, 1.4, 1.5, 2.2, 2.3, 2.4, 3.1, 3.2

- **リクエストボディ**:

  ```json
  {
    "character_id": "キャラクターの一意のID",
    "message_type": "text" | "audio",
    "text_message": "こんにちは、今日の天気は？", // message_typeが"text"の場合
    "audio_message": "BASE64_ENCODED_AUDIO_DATA", // message_typeが"audio"の場合
    "conversation_context": {
      "history": [
        { "role": "user", "content": "はじめまして" },
        { "role": "assistant", "content": "はじめまして！何かお話ししましょう。" }
      ]
    }
  }
  ```

- **レスポンス (200 OK)**:

  ```json
  {
    "response_text": "こんにちは！今日の天気は晴れですよ。",
    "response_audio": "BASE64_ENCODED_AUDIO_DATA", // 合成された音声データ
    "character_action": {
      "emotion": "joy", // 感情 (喜び、怒り、悲しみなど)
      "animation": "nod", // 再生するアニメーション (相槌、ジェスチャーなど)
      "expression": "smile", // 表情 (目、口、眉の変化)
      "lip_sync_data": { "frames": [...] } // リップシンク用のデータ
    }
  }
  ```

- **処理フロー**:
  1. リクエストから JWT を検証し、ユーザー ID を取得します。
  2. リクエストボディの`character_id`とユーザー ID を基に、`characters`テーブルからキャラクターの性格設定などを取得します。
  3. `conversations`テーブルと`memories`テーブルから長期的な文脈情報を取得します。
  4. 取得した情報とユーザーからのメッセージを統合し、AI (OpenAI API など) へのプロンプトを生成します。
  5. AI からの応答を受け取ります。
  6. 応答テキスト、ユーザーの入力、感情分析結果などを`conversations`テーブルに保存します。
  7. 応答から抽出した重要な情報があれば`memories`テーブルに保存・更新します。
  8. 応答テキストと AI の分析結果から、キャラクターのアニメーション、表情などの`character_action`を決定します。
  9. 必要に応じて音声合成 API を呼び出し、`response_audio`を生成します。
  10. クライアントにレスポンスを返します。

### 3.2. 設定機能 (Supabase Client SDK)

キャラクターの表示設定やパーソナリティ設定など、`characters`テーブルに保存されている情報の読み書きは、クライアントサイドの Supabase Client SDK から直接行います。
データベース操作の認可は、Supabase の RLS (Row Level Security) ポリシーによって安全性を確保します。

- **機能要件**: 1.5, 3.3

#### 設定の取得

- **操作**: `select`
- **対象テーブル**: `characters`
- **説明**: ログインしているユーザーに紐づくキャラクターの設定情報を`characters`テーブルから取得します。
- **クライアント側コード (例)**:
  ```javascript
  const { data, error } = await supabase
    .from("characters")
    .select("*")
    .eq("user_id", user.id); // ログインユーザーのIDで絞り込み
  ```
- **RLS ポリシー (例)**:
  - `select`操作は、`auth.uid()`が`characters.user_id`と一致する行に対してのみ許可する。

#### 設定の更新

- **操作**: `update`
- **対象テーブル**: `characters`
- **説明**: ユーザーが設定画面で行った変更を`characters`テーブルに反映します。対象となるカラムは`DB設計書.md`の`characters`テーブル定義を参照してください。(例: `display_size`, `volume`, `response_speed`, `personality_type`)
- **クライアント側コード (例)**:
  ```javascript
  const { data, error } = await supabase
    .from("characters")
    .update({ display_size: 1.2, volume: 0.5, personality_type: "冷静" })
    .eq("character_id", selectedCharacterId)
    .eq("user_id", user.id);
  ```
- **RLS ポリシー (例)**:
  - `update`操作は、`auth.uid()`が`characters.user_id`と一致する行に対してのみ許可する。

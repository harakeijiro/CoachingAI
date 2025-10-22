# CoachingAI セットアップガイド

このドキュメントは、CoachingAIプロジェクトの環境構築手順を説明します。

## 📋 目次

1. [必要な環境変数](#必要な環境変数)
2. [環境変数の設定手順](#環境変数の設定手順)
3. [Supabaseのセットアップ](#supabaseのセットアップ)
4. [Google Gemini APIキーの取得](#google-gemini-apiキーの取得)
5. [Cartesia TTS APIキーの取得](#cartesia-tts-apiキーの取得)
6. [アプリケーションの起動](#アプリケーションの起動)
7. [Supabaseの使い方](#supabaseの使い方)
8. [トラブルシューティング](#トラブルシューティング)

---

## 必要な環境変数

### 必須の環境変数（4つ）

| 変数名 | 説明 | 取得先 |
|--------|------|--------|
| `SUPABASE_URL` | Supabaseプロジェクトのエンドポイント | [Supabase Dashboard](https://supabase.com/) |
| `SUPABASE_ANON_KEY` | Supabaseの公開APIキー | [Supabase Dashboard](https://supabase.com/) |
| `GOOGLE_GENERATIVE_AI_API_KEY` | Google Gemini APIキー | [Google AI Studio](https://ai.google.dev/) |
| `CARTESIA_API_KEY` | Cartesia TTS（音声合成）APIキー | [Cartesia](https://cartesia.ai/) |

### オプションの環境変数

| 変数名 | デフォルト値 | 説明 |
|--------|-------------|------|
| `GEMINI_MODEL` | `gemini-2.5-flash` | 使用するGeminiモデル |
| `CARTESIA_VERSION` | `2025-04-16` | Cartesia APIバージョン |
| `NEXT_PUBLIC_APP_URL` | `http://localhost:3000` | アプリケーションURL |

---

## 環境変数の設定手順

### ステップ1: `.env.local` ファイルの作成

```bash
cp .env.example .env.local
```

### ステップ2: エディタで `.env.local` を開く

```bash
# VS Code の場合
code .env.local

# vim の場合
vim .env.local

# nano の場合
nano .env.local
```

### ステップ3: 各APIキーを設定

以下のセクションを参考に、実際のAPIキーを設定してください。

---

## Supabaseのセットアップ

### 1. Supabaseプロジェクトの作成

1. **Supabase** にアクセス: https://supabase.com/
2. **Sign in / Sign up** をクリック（GitHubアカウントでログイン可能）
3. **New Project** をクリック
4. プロジェクト情報を入力：
   - **Name**: `CoachingAI`（任意）
   - **Database Password**: 強力なパスワードを設定（**必ず保存**）
   - **Region**: `Northeast Asia (Tokyo)`（日本の場合）
5. **Create new project** をクリック（数分かかります）

### 2. 認証情報の取得

プロジェクトが作成されたら：

1. 左サイドバー → **Settings（⚙️）** → **API** をクリック
2. 以下の情報をコピー：
   - **Project URL** → `SUPABASE_URL`
   - **Project API keys** の **anon public** → `SUPABASE_ANON_KEY`
3. `.env.local` に貼り付け：

```env
SUPABASE_URL=https://zvwvumtnwzzfiedfijjv.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp2d3Z1bXRud3p6ZmllZGZpamp2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg3NjYxMjgsImV4cCI6MjA3NDM0MjEyOH0.X4HxHnpaZHUmXONVC-QmBAUImQAflg2QbtBies_gD6Q
```

### 3. データベースのマイグレーション

データベースのテーブルを作成します：

1. **Supabaseダッシュボード** → 左サイドバー **SQL Editor** をクリック
2. **New query** をクリック
3. 以下の順番でSQLファイルの内容を実行：

#### ① `001_create_users_table.sql` を実行

`../supabase/migrations/001_create_users_table.sql` の内容をコピー＆ペーストして **Run** をクリック

#### ② `002_create_characters_table.sql` を実行

`../supabase/migrations/002_create_characters_table.sql` の内容をコピー＆ペーストして **Run** をクリック

#### ③ `003_create_conversations_table.sql` を実行

`../supabase/migrations/003_create_conversations_table.sql` の内容をコピー＆ペーストして **Run** をクリック

#### ④ `004_create_memories_table.sql` を実行

`../supabase/migrations/004_create_memories_table.sql` の内容をコピー＆ペーストして **Run** をクリック

### 4. 認証設定（パスワードリセット機能用）

1. 左サイドバー → **Authentication** → **URL Configuration** をクリック
2. **Site URL** を設定：
   - 開発環境: `http://localhost:3000`
   - 本番環境: 実際のドメイン
3. **Redirect URLs** に以下を追加：
   - `http://localhost:3000/reset-password/confirm`

---

## Google Gemini APIキーの取得

### 1. Google AI Studioにアクセス

https://ai.google.dev/ にアクセス

### 2. APIキーの作成

1. **Get API key** をクリック
2. Googleアカウントでサインイン
3. **Create API key** をクリック
4. プロジェクトを選択（または **Create API key in new project**）
5. 生成されたAPIキーをコピー

### 3. `.env.local` に設定

```env
GOOGLE_GENERATIVE_AI_API_KEY=AIzaSyCptXJXYigc1RNPtWScjv-1sfeAhQpALAs
```

### 注意事項

- **無料枠**: Gemini APIには無料枠がありますが、リクエスト数に制限があります
- **料金**: [Pricing](https://ai.google.dev/pricing) を確認してください
- **利用規約**: APIの利用規約を確認してください

---

## Cartesia TTS APIキーの取得

### 1. Cartesiaにアクセス

https://cartesia.ai/ にアクセス

### 2. アカウント作成

1. **Sign Up** をクリック
2. メールアドレスとパスワードを登録
3. メール認証を完了

### 3. APIキーの作成

1. ダッシュボードで **API Keys** セクションに移動
2. **Create new API key** をクリック
3. キーの名前を入力（例: `CoachingAI`）
4. 生成されたAPIキーをコピー（**一度しか表示されないため注意**）

### 4. `.env.local` に設定

```env
CARTESIA_API_KEY=sk_car_UfoJsoUQeGdb2Cebn7mAZA
```

### 注意事項

- **料金**: Cartesiaは有料サービスです。[Pricing](https://cartesia.ai/pricing) を確認してください
- **無料トライアル**: 初回登録時にクレジットが付与される場合があります

---

## アプリケーションの起動

### 1. 依存関係のインストール

```bash
yarn install
```

### 2. 開発サーバーの起動

```bash
yarn dev
```

### 3. ブラウザで確認

http://localhost:3000 にアクセス

### 4. 動作確認

1. **新規登録**: トップページで新規ユーザー登録
2. **ログイン**: `/signin` でログイン
3. **チャット**: `/chat` でAIとの対話を試す

---

## Supabaseの使い方

### 基本的なCRUD操作

#### データの取得（SELECT）

```typescript
import { createServerClient } from "@/lib/supabase/server";

// ユーザー情報の取得
const supabase = await createServerClient();
const { data: user, error } = await supabase
  .from('users')
  .select('*')
  .eq('user_id', userId)
  .single();

if (error) {
  console.error('エラー:', error);
} else {
  console.log('ユーザー:', user);
}
```

#### データの挿入（INSERT）

```typescript
const { data, error } = await supabase
  .from('characters')
  .insert({
    user_id: userId,
    character_name: 'みずき',
    personality_type: '明るい',
    model_path: '/models/mizuki.glb'
  })
  .select()
  .single();
```

#### データの更新（UPDATE）

```typescript
const { data, error } = await supabase
  .from('characters')
  .update({ 
    volume: 75,
    display_size: 120 
  })
  .eq('character_id', characterId)
  .select()
  .single();
```

#### データの削除（DELETE）

```typescript
const { error } = await supabase
  .from('conversations')
  .delete()
  .eq('conversation_id', conversationId);
```

### 認証関連

#### 現在のユーザーを取得

```typescript
const supabase = await createServerClient();
const { data: { user }, error } = await supabase.auth.getUser();

if (user) {
  console.log('ログイン中:', user.email);
} else {
  console.log('未ログイン');
}
```

#### サインアウト

```typescript
const { error } = await supabase.auth.signOut();
```

### リアルタイム機能

Supabaseはデータベースの変更をリアルタイムで監視できます：

```typescript
// クライアントコンポーネントで使用
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// 新しい会話メッセージをリアルタイムで受信
const channel = supabase
  .channel('conversations')
  .on(
    'postgres_changes',
    {
      event: 'INSERT',
      schema: 'public',
      table: 'conversations',
      filter: `character_id=eq.${characterId}`
    },
    (payload) => {
      console.log('新しいメッセージ:', payload.new);
    }
  )
  .subscribe();

// クリーンアップ（コンポーネントのアンマウント時）
return () => {
  channel.unsubscribe();
};
```

### Row Level Security (RLS)

このプロジェクトでは、すべてのテーブルにRLSが設定されています：

- ユーザーは**自分のデータのみ**にアクセス可能
- 他のユーザーのデータは自動的に除外される
- サーバーサイドでの追加の権限チェックは不要

```typescript
// 自動的に現在のユーザーのデータのみ取得される
const { data: characters } = await supabase
  .from('characters')
  .select('*');
// → auth.uid() と一致する user_id のみ返される
```

---

## トラブルシューティング

### エラー: "Supabase URL and Anon Key must be defined"

**原因**: 環境変数が正しく設定されていない

**解決策**:
1. `.env.local` ファイルが現在のディレクトリに存在するか確認
2. ファイル名が正確に `.env.local` であることを確認（`.env` ではない）
3. 開発サーバーを再起動: `Ctrl+C` → `yarn dev`

### エラー: "API key not configured"

**原因**: Gemini または Cartesia の APIキーが設定されていない

**解決策**:
1. `.env.local` に `GOOGLE_GENERATIVE_AI_API_KEY` が設定されているか確認
2. `.env.local` に `CARTESIA_API_KEY` が設定されているか確認
3. 開発サーバーを再起動

### Supabaseに接続できない

**原因**: Supabaseの認証情報が間違っている

**解決策**:
1. `SUPABASE_URL` が正しいか確認（https://で始まる）
2. `SUPABASE_ANON_KEY` が正しいか確認（長い文字列）
3. Supabaseダッシュボードで再度コピー

### データベースエラー

**原因**: マイグレーションが実行されていない

**解決策**:
1. Supabase SQL Editorでマイグレーションを再実行
2. `Table Editor` でテーブルが作成されているか確認
3. エラーメッセージを確認して対処

### 開発サーバーが起動しない

**原因**: ポート3000が既に使用されている

**解決策**:
```bash
# ポートを変更して起動
yarn dev -- -p 3001
```

または、使用中のプロセスを終了：
```bash
# macOS/Linux
lsof -ti:3000 | xargs kill -9

# Windows (PowerShell)
Get-Process -Id (Get-NetTCPConnection -LocalPort 3000).OwningProcess | Stop-Process
```

---

## セキュリティのベストプラクティス

### 環境変数の管理

- ✅ `.env.local` は `.gitignore` で除外されている
- ✅ 絶対にGitHubなどに公開しない
- ✅ APIキーを定期的にローテーション
- ✅ 本番環境ではVercelの環境変数機能を使用

### APIキーのバックアップ

`.env.local` の内容を安全な場所にバックアップ：
- パスワードマネージャー（1Password、Bitwarden など）
- 暗号化されたファイル
- チーム内の安全な共有場所

### 本番環境へのデプロイ

Vercelにデプロイする場合：

1. Vercelダッシュボード → プロジェクト → **Settings** → **Environment Variables**
2. 各環境変数を追加：
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
   - `GOOGLE_GENERATIVE_AI_API_KEY`
   - `CARTESIA_API_KEY`
   - `NEXT_PUBLIC_APP_URL`（本番ドメイン）
3. **Save** をクリック
4. 再デプロイ

---

## サポート

問題が解決しない場合：

1. **ドキュメントを確認**:
   - [Supabase Documentation](https://supabase.com/docs)
   - [Next.js Documentation](https://nextjs.org/docs)
   - [Gemini API Documentation](https://ai.google.dev/docs)

2. **エラーメッセージを確認**:
   - ブラウザのコンソール（F12）
   - ターミナルのログ

3. **既存のissueを検索**:
   - プロジェクトのGitHub Issues
   - Stack Overflow

---

## まとめ

セットアップが完了すれば、以下のことができるようになります：

- ✅ ユーザー認証（サインアップ、ログイン、パスワードリセット）
- ✅ Supabaseデータベースへのアクセス
- ✅ AI（Gemini）との対話
- ✅ 音声合成（Cartesia TTS）

Happy Coding! 🎉

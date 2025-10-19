# 🚀 クイックスタートガイド

このガイドでは、最短でCoachingAIを起動する手順を説明します。

## ⚡ 5分でセットアップ

### ステップ1: 環境変数ファイルの作成（30秒）

```bash
cd front
cp .env.example .env.local
```

エディタで `.env.local` を開き、以下の4つのAPIキーを設定してください：

```env
SUPABASE_URL=（あなたのSupabase URL）
SUPABASE_ANON_KEY=（あなたのSupabase Anon Key）
GOOGLE_GENERATIVE_AI_API_KEY=（あなたのGemini APIキー）
CARTESIA_API_KEY=（あなたのCartesia APIキー）
```

### ステップ2: 依存関係のインストール（1-2分）

```bash
yarn install
```

### ステップ3: 環境変数の確認（10秒）

```bash
yarn check-env
```

✅ が表示されればOK！

### ステップ4: 開発サーバーの起動（10秒）

```bash
yarn dev
```

ブラウザで http://localhost:3000 を開く

---

## 📝 APIキーの取得先

### 1. Supabase（無料枠あり）

1. https://supabase.com/ にアクセス
2. プロジェクトを作成
3. Settings > API から URL と Anon Key を取得

**重要**: データベースマイグレーションの実行が必要です（後述）

### 2. Google Gemini API（無料枠あり）

1. https://ai.google.dev/ にアクセス
2. "Get API key" をクリック
3. APIキーを生成

### 3. Cartesia TTS API（有料）

1. https://cartesia.ai/ にアクセス
2. アカウント作成
3. ダッシュボードでAPIキーを生成

---

## 🗄️ Supabaseデータベースのセットアップ

### マイグレーションの実行

Supabaseダッシュボード > SQL Editor で以下のファイルを順番に実行：

1. `supabase/migrations/001_create_users_table.sql`
2. `supabase/migrations/002_create_characters_table.sql`
3. `supabase/migrations/003_create_conversations_table.sql`
4. `supabase/migrations/004_create_memories_table.sql`

**実行方法**:
1. SQL Editorを開く
2. "New query" をクリック
3. ファイルの内容をコピー＆ペースト
4. "Run" をクリック

---

## ✅ 動作確認

### 1. トップページにアクセス

http://localhost:3000

### 2. 新規ユーザー登録

トップページで新規登録を試す

### 3. チャット機能を試す

http://localhost:3000/chat でAIと対話

---

## 🆘 トラブルシューティング

### エラー: "Supabase URL and Anon Key must be defined"

→ `.env.local` ファイルが正しく設定されているか確認
→ 開発サーバーを再起動（`Ctrl+C` → `yarn dev`）

### エラー: "API key not configured"

→ `.env.local` の `GOOGLE_GENERATIVE_AI_API_KEY` を確認
→ 開発サーバーを再起動

### データベースエラー

→ Supabaseのマイグレーションを実行したか確認
→ SupabaseダッシュボードでTable Editorを開き、テーブルが作成されているか確認

### ポート3000が使用中

```bash
# ポートを変更して起動
yarn dev -- -p 3001
```

---

## 📚 さらに詳しく

- **詳細なセットアップガイド**: [SETUP_GUIDE.md](./SETUP_GUIDE.md)
- **プロジェクトの構造**: [front/README.md](./front/README.md)
- **要件定義**: [documents/要件定義書.md](./documents/要件定義書.md)
- **DB設計**: [documents/DB設計書.md](./documents/DB設計書.md)

---

## 🎯 便利なコマンド

```bash
# セットアップウィザード（対話式）
yarn setup

# 環境変数のチェック
yarn check-env

# 開発サーバーの起動
yarn dev

# ビルド（本番用）
yarn build

# Linter実行
yarn lint
```

---

## 🎉 セットアップ完了！

これで開発を始められます。

質問があれば [SETUP_GUIDE.md](./SETUP_GUIDE.md) を参照するか、プロジェクトの管理者に問い合わせてください。

Happy Coding! 🚀


# AI コンパニオン フロントエンド

このプロジェクトは AI コンパニオン開発プロジェクトのフロントエンドです。

## 技術スタック

- **フレームワーク**: Next.js 15.5.4
- **言語**: TypeScript
- **認証・データベース**: Supabase
- **スタイリング**: Tailwind CSS
- **AI 連携**: Vercel AI SDK

## セットアップ

### 1. 依存関係のインストール

```bash
yarn install
```

### 2. 環境変数の設定

`.env.example` をコピーして `.env.local` を作成し、Supabase の情報を設定してください。

```bash
cp .env.example .env.local
```

`.env.local` を編集：

```
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

### 3. Supabase のセットアップ

1. [Supabase](https://supabase.com/) でプロジェクトを作成
2. SQL Editor で `supabase/migrations/001_create_users_table.sql` を実行
3. Project Settings から URL と Anon Key を取得して `.env.local` に設定

### 4. 開発サーバーの起動

```bash
yarn dev
```

ブラウザで [http://localhost:3000](http://localhost:3000) を開いて確認できます。

## 実装済み機能

### 認証機能

- ✅ 新規登録（`/signup`）
- ⏳ ログイン（未実装）
- ⏳ パスワードリセット（未実装）

### その他の機能

- ⏳ AI コンパニオンとの対話（未実装）
- ⏳ キャラクター設定（未実装）

## プロジェクト構造

```
front/
├── app/                    # Next.js App Router
│   ├── (auth)/            # 認証関連ページ
│   │   └── signup/        # 新規登録ページ
│   └── chat/              # 対話ページ（未実装）
├── components/            # React コンポーネント
│   └── auth/             # 認証関連コンポーネント
├── lib/                   # ユーティリティとロジック
│   ├── actions/          # Server Actions
│   ├── supabase/         # Supabase クライアント
│   └── types/            # 型定義
└── supabase/             # Supabase 関連
    └── migrations/       # データベースマイグレーション
```

## Server Actions について

このプロジェクトでは、環境変数の保護とセキュリティのため、認証処理に Next.js の Server Actions を使用しています。

- `lib/actions/auth.ts`: 認証関連の Server Actions
- `lib/supabase/server.ts`: サーバー専用 Supabase クライアント

これにより、Supabase の API キーがクライアントに公開されることを防いでいます。

## 開発ルール

プロジェクトの開発ルールは以下のファイルを参照してください：

- `.cursor/rules/coding-rules.mdc`
- `.cursor/rules/dev-rules/nextjs.mdc`
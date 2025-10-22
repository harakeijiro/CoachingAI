# CoachingAI - AIコンパニオンシステム

ユーザーが作成した3Dキャラクターと対話できる、パーソナライズされたAIコンパニオンアプリケーションです。

## 🚀 クイックスタート

**最短5分でセットアップ！**

```bash
# 1. フロントエンドディレクトリに移動
cd front

# 2. 環境変数ファイルをコピー
cp .env.example .env.local

# 3. .env.local を編集してAPIキーを設定
# （詳細は下記のドキュメントを参照）

# 4. 依存関係をインストール
yarn install

# 5. 環境変数をチェック
yarn check-env

# 6. 開発サーバーを起動
yarn dev
```

ブラウザで http://localhost:3000 を開いてください。

📖 詳細は **[front/QUICK_START.md](./front/QUICK_START.md)** を参照

---

## 📚 ドキュメント

### セットアップ関連

- **[🚀 QUICK_START.md](./front/QUICK_START.md)** - 最短でセットアップする手順
- **[📖 SETUP_GUIDE.md](./front/SETUP_GUIDE.md)** - 詳細なセットアップガイド
- **[🗄️ MIGRATION_GUIDE.md](./supabase/MIGRATION_GUIDE.md)** - Supabaseマイグレーション手順

### プロジェクト設計

- **[📋 要件定義書](./documents/要件定義書.md)** - プロジェクトの目的と機能要件
- **[🎨 画面設計書](./documents/画面設計書.md)** - UI/UX設計
- **[🗄️ DB設計書](./documents/DB設計書.md)** - データベース構造
- **[🔌 API設計書](./documents/API設計書.md)** - APIエンドポイント仕様

---

## 🛠️ 技術スタック

| カテゴリ | 技術 | バージョン |
|---------|------|-----------|
| フレームワーク | Next.js | 15.5.4 |
| 言語 | TypeScript | ^5 |
| UI | React | 19.1.0 |
| スタイリング | Tailwind CSS | ^4 |
| 3D | Three.js, React Three Fiber | ^0.180.0, ^9.3.0 |
| データベース | Supabase PostgreSQL | - |
| 認証 | Supabase Auth | ^2.58.0 |
| AI/LLM | Google Gemini API | - |
| 音声合成 | Cartesia TTS | - |
| AI連携 | Vercel AI SDK | - |
| デプロイ | Vercel | - |

---

## 📋 必要な環境変数

以下のAPIキーが必要です：

| 変数名 | 説明 | 取得先 |
|--------|------|--------|
| `SUPABASE_URL` | SupabaseプロジェクトURL | [Supabase](https://supabase.com/) |
| `SUPABASE_ANON_KEY` | Supabase公開APIキー | [Supabase](https://supabase.com/) |
| `GOOGLE_GENERATIVE_AI_API_KEY` | Gemini APIキー | [Google AI Studio](https://ai.google.dev/) |
| `CARTESIA_API_KEY` | Cartesia TTS APIキー | [Cartesia](https://cartesia.ai/) |

詳細は **[front/SETUP_GUIDE.md](./front/SETUP_GUIDE.md)** を参照してください。

---

## 🎯 主な機能

### 実装済み機能

- ✅ **ユーザー認証**: サインアップ、ログイン、パスワードリセット
- ✅ **AI対話**: Google Gemini APIを使用した自然な会話
- ✅ **音声合成**: Cartesia TTSによる音声応答
- ✅ **3Dキャラクター**: Three.jsによる3Dモデル表示

### 開発中・予定機能

- 🚧 **キャラクター設定**: パーソナリティや外見のカスタマイズ
- 🚧 **会話履歴**: 過去の対話の保存と参照
- 🚧 **記憶機能**: ユーザー情報の学習と記憶

---

## 📁 プロジェクト構造

```
CoachingAI/
├── front/                    # Next.jsフロントエンド
│   ├── app/                  # App Router
│   │   ├── auth/            # 認証関連ページ
│   │   │   ├── signin/      # ログインページ
│   │   │   ├── signup/      # 新規登録ページ
│   │   │   └── reset-password/ # パスワードリセット
│   │   ├── chat/            # チャットページ
│   │   └── api/             # API Routes
│   ├── components/          # Reactコンポーネント
│   │   ├── auth/           # 認証関連コンポーネント
│   │   └── chat/           # チャット関連コンポーネント
│   ├── lib/                 # ユーティリティとロジック
│   │   ├── actions/        # Server Actions
│   │   ├── supabase/       # Supabaseクライアント
│   │   └── types/          # 型定義
│   ├── scripts/             # セットアップスクリプト
│   ├── QUICK_START.md      # クイックスタートガイド
│   ├── SETUP_GUIDE.md      # 詳細セットアップガイド
│   └── package.json
├── supabase/                # Supabase設定
│   ├── EXECUTE_THIS_SQL.md  # SQL実行ガイド
│   ├── MIGRATION_GUIDE.md  # マイグレーションガイド
│   └── migrations/          # DBマイグレーション
├── documents/               # プロジェクト設計書
└── README.md               # このファイル
```

---

## 🔧 便利なコマンド

```bash
# セットアップウィザード（対話式）
yarn setup

# 環境変数のチェック
yarn check-env

# 開発サーバーの起動
yarn dev

# 本番ビルド
yarn build

# 本番サーバーの起動
yarn start

# Linter実行
yarn lint
```

---

## 🔐 セキュリティ

- **Row Level Security (RLS)**: すべてのテーブルでRLSが有効
- **環境変数**: APIキーは`.env.local`で管理（`.gitignore`で除外）
- **認証**: Supabase Authによる安全な認証フロー
- **Server Actions**: Next.js Server Actionsを使用してAPIキーをクライアントに公開しない
- **CORS**: 適切なCORS設定

### Server Actionsについて

このプロジェクトでは、環境変数の保護とセキュリティのため、認証処理に Next.js の Server Actions を使用しています：

- `lib/actions/auth.ts`: 認証関連の Server Actions
- `lib/supabase/server.ts`: サーバー専用 Supabase クライアント

これにより、Supabase の API キーがクライアントに公開されることを防いでいます。

---

## 🤝 開発ワークフロー

### ローカル開発

1. ブランチを作成
2. コードを変更
3. `yarn lint` で確認
4. コミット
5. プルリクエスト作成

### デプロイ

- **本番環境**: Vercelに自動デプロイ（mainブランチ）
- **ステージング**: プレビューデプロイ（プルリクエスト）

---

## 📝 今後の開発予定

- [ ] キャラクター設定画面の実装
- [ ] 会話履歴の表示機能
- [ ] 記憶機能の実装
- [ ] 音声入力機能（Whisper API）
- [ ] リアルタイムアニメーション
- [ ] モバイル対応の最適化

---

## 🆘 トラブルシューティング

### よくある問題

**エラー: "Supabase URL and Anon Key must be defined"**
- → `.env.local`ファイルを確認
- → 開発サーバーを再起動

**エラー: "API key not configured"**
- → Gemini/Cartesia APIキーを確認
- → 開発サーバーを再起動

**データベースエラー**
- → Supabaseマイグレーションを実行
- → [MIGRATION_GUIDE.md](./supabase/MIGRATION_GUIDE.md) を参照

詳細は **[front/SETUP_GUIDE.md](./front/SETUP_GUIDE.md)** のトラブルシューティングセクションを参照してください。

---

## 📄 ライセンス

このプロジェクトは開発中です。ライセンスは未定です。

---

## 📞 サポート

質問や問題がある場合：

1. **ドキュメントを確認**: [front/SETUP_GUIDE.md](./front/SETUP_GUIDE.md)
2. **GitHub Issues**: プロジェクトのIssuesを検索
3. **プロジェクト管理者**: 管理者に問い合わせ

---

**Happy Coding! 🎉**

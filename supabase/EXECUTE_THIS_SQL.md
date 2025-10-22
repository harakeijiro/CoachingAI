# 🚀 Supabaseで実行するSQL（新規登録・ログインを有効化）

## 📍 実行手順

### ステップ1: Supabaseダッシュボードを開く

1. https://supabase.com/dashboard にアクセス
2. プロジェクトを選択

### ステップ2: SQL Editorを開く

1. 左サイドバーの **SQL Editor** をクリック
2. 右上の **New query** ボタンをクリック

### ステップ3: マイグレーションファイルを順番に実行

⚠️ **重要**: 以下の順番でマイグレーションファイルを実行してください。

#### ① users テーブルの作成
`migrations/001_create_users_table.sql` の内容をコピー＆ペーストして **Run** をクリック

#### ② characters テーブルの作成
`migrations/002_create_characters_table.sql` の内容をコピー＆ペーストして **Run** をクリック

#### ③ conversations テーブルの作成
`migrations/003_create_conversations_table.sql` の内容をコピー＆ペーストして **Run** をクリック

#### ④ memories テーブルの作成
`migrations/004_create_memories_table.sql` の内容をコピー＆ペーストして **Run** をクリック

#### ⑤ テストデータの投入（オプション）
`migrations/005_seed_sample_data.sql.skip` の内容をコピー＆ペーストして **Run** をクリック
（開発・テスト環境でのみ実行）

---

## ✅ ステップ4: 実行ボタンをクリック

1. SQLをペーストしたら、右下の **Run** ボタン（または `Cmd + Enter`）をクリック
2. 「**Success. No rows returned**」と表示されればOK！

---

## 🔍 ステップ5: テーブルが作成されたか確認

1. 左サイドバーの **Table Editor** をクリック
2. 以下のテーブルが表示されていることを確認：
   - `users` テーブル
   - `characters` テーブル
   - `conversations` テーブル
   - `memories` テーブル

---

## 🎉 完了後

SQLの実行が完了したら、以下をお知らせください：

**「SQLを実行しました」**

その後、開発サーバーを再起動して、新規登録・ログインを試してみましょう！

---

## 🆘 トラブルシューティング

### エラー: "relation already exists"

→ テーブルが既に存在しています。このエラーは無視してOKです。

### エラー: "permission denied"

→ プロジェクトの権限を確認してください。プロジェクトのオーナーでログインしているか確認してください。

### エラー: "syntax error"

→ SQLが正しくコピーされていない可能性があります。もう一度上記のSQLをコピーして実行してください。

### エラー: "foreign key constraint"

→ テーブルの作成順序が間違っている可能性があります。上記の順番で実行してください。

---

## 📚 参考情報

- 詳細なマイグレーションガイド: `MIGRATION_GUIDE.md`
- DB設計書: `../documents/DB設計書.md`
- クイックスタートガイド: `../QUICK_START.md`

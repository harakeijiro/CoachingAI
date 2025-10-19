# 🚀 Supabaseで実行するSQL（新規登録・ログインを有効化）

## 📍 実行手順

### ステップ1: Supabaseダッシュボードを開く

1. https://supabase.com/dashboard にアクセス
2. プロジェクトを選択

### ステップ2: SQL Editorを開く

1. 左サイドバーの **SQL Editor** をクリック
2. 右上の **New query** ボタンをクリック

### ステップ3: 以下のSQLをコピー＆ペーストして実行

⚠️ **重要**: 以下のSQLを全てコピーして、一度に実行してください。

---

## 📝 実行するSQL

```sql
-- ============================================
-- CoachingAI データベースセットアップ
-- users テーブルの作成
-- ============================================

-- users テーブルの作成
-- Supabase Auth の auth.users テーブルの拡張プロファイル情報を保持
CREATE TABLE IF NOT EXISTS public.users (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  birthdate DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- RLS (Row Level Security) を有効化
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- ユーザーは自分のレコードのみ参照可能
CREATE POLICY "Users can view their own profile"
  ON public.users
  FOR SELECT
  USING (auth.uid() = user_id);

-- ユーザーは自分のレコードのみ作成可能
CREATE POLICY "Users can create their own profile"
  ON public.users
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ユーザーは自分のレコードのみ更新可能
CREATE POLICY "Users can update their own profile"
  ON public.users
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- updated_at を自動更新するトリガー関数
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- updated_at 自動更新のトリガー
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- インデックスの作成
CREATE INDEX IF NOT EXISTS idx_users_user_id ON public.users(user_id);
```

---

## ✅ ステップ4: 実行ボタンをクリック

1. SQLをペーストしたら、右下の **Run** ボタン（または `Cmd + Enter`）をクリック
2. 「**Success. No rows returned**」と表示されればOK！

---

## 🔍 ステップ5: テーブルが作成されたか確認

1. 左サイドバーの **Table Editor** をクリック
2. `users` テーブルが表示されていることを確認

テーブルの構造：
- user_id (UUID)
- name (VARCHAR)
- birthdate (DATE)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)

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

---

## 📚 参考情報

- 詳細なマイグレーションガイド: `supabase/MIGRATION_GUIDE.md`
- DB設計書: `documents/DB設計書.md`


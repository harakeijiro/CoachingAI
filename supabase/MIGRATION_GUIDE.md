# Supabase マイグレーションガイド

このドキュメントでは、Supabaseデータベースのマイグレーション手順を説明します。

## 📋 マイグレーションファイル一覧

| ファイル名 | 説明 | 依存関係 |
|-----------|------|---------|
| `001_create_users_table.sql` | usersテーブルの作成 | なし |
| `002_create_characters_table.sql` | charactersテーブルの作成 | 001 |
| `003_create_conversations_table.sql` | conversationsテーブルの作成 | 002 |
| `004_create_memories_table.sql` | memoriesテーブルの作成 | 002 |

**重要**: 必ず番号順に実行してください！

---

## 🚀 マイグレーションの実行手順

### 方法1: Supabase ダッシュボード（推奨）

#### ステップ1: SQL Editorを開く

1. [Supabaseダッシュボード](https://supabase.com/dashboard) にアクセス
2. プロジェクトを選択
3. 左サイドバーの **SQL Editor** をクリック

#### ステップ2: マイグレーションを実行

各マイグレーションファイルに対して：

1. **New query** をクリック
2. マイグレーションファイルの内容をコピー
3. SQL Editorにペースト
4. **Run** ボタンをクリック
5. エラーがないことを確認

#### ステップ3: 実行順序

1. `001_create_users_table.sql`
2. `002_create_characters_table.sql`
3. `003_create_conversations_table.sql`
4. `004_create_memories_table.sql`

---

### 方法2: Supabase CLI（上級者向け）

#### 前提条件

- Supabase CLIがインストールされていること
- Supabaseプロジェクトにリンクされていること

#### コマンド

```bash
# Supabaseプロジェクトにリンク（初回のみ）
supabase link --project-ref your-project-ref

# マイグレーションを実行
supabase db push
```

---

## ✅ 実行確認

### Table Editorで確認

1. Supabaseダッシュボード > **Table Editor** を開く
2. 以下のテーブルが作成されていることを確認：
   - `users`
   - `characters`
   - `conversations`
   - `memories`

### SQL Editorで確認

```sql
-- テーブル一覧を表示
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public';
```

以下のテーブルが表示されればOK：
- users
- characters
- conversations
- memories

---

## 📊 テーブル構造の概要

### users

ユーザープロファイル情報を保持

```sql
user_id UUID PRIMARY KEY
name VARCHAR(255)
birthdate DATE
created_at TIMESTAMP
updated_at TIMESTAMP
```

### characters

AIキャラクターの設定情報

```sql
character_id UUID PRIMARY KEY
user_id UUID FOREIGN KEY
character_name VARCHAR(255)
personality_type VARCHAR(50)
model_path VARCHAR(255)
display_size INT
volume INT
response_speed INT
created_at TIMESTAMP
updated_at TIMESTAMP
```

### conversations

ユーザーとキャラクター間の対話ログ

```sql
conversation_id UUID PRIMARY KEY
character_id UUID FOREIGN KEY
user_input TEXT
character_response TEXT
user_emotion VARCHAR(50)
timestamp TIMESTAMP
```

### memories

キャラクターが記憶するユーザー情報

```sql
memory_id UUID PRIMARY KEY
character_id UUID FOREIGN KEY
topic VARCHAR(255)
content TEXT
created_at TIMESTAMP
updated_at TIMESTAMP
```

---

## 🔐 セキュリティ設定

### Row Level Security (RLS)

すべてのテーブルでRLSが有効化されています。

- ユーザーは**自分のデータのみ**にアクセス可能
- 他のユーザーのデータは自動的にフィルタリング
- SQLインジェクション対策

### ポリシー一覧

各テーブルには以下のポリシーが設定されています：

- **SELECT**: 自分のデータのみ閲覧可能
- **INSERT**: 自分のデータのみ作成可能
- **UPDATE**: 自分のデータのみ更新可能
- **DELETE**: 自分のデータのみ削除可能

---

## 🔄 トリガーと関数

### update_updated_at_column()

`updated_at` カラムを自動更新する関数

適用テーブル:
- users
- characters
- memories

```sql
-- トリガーの確認
SELECT 
  trigger_name, 
  event_manipulation, 
  event_object_table
FROM information_schema.triggers
WHERE trigger_schema = 'public';
```

---

## 🆘 トラブルシューティング

### エラー: "relation already exists"

**原因**: テーブルが既に存在している

**解決策**:
```sql
-- テーブルを削除してから再実行（データも削除されます！）
DROP TABLE IF EXISTS memories CASCADE;
DROP TABLE IF EXISTS conversations CASCADE;
DROP TABLE IF EXISTS characters CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column CASCADE;
```

### エラー: "foreign key constraint"

**原因**: 依存関係のあるテーブルが作成されていない

**解決策**: マイグレーションを順番通りに実行する

### エラー: "auth.users does not exist"

**原因**: Supabase Authが有効化されていない

**解決策**: Supabase AuthはデフォルトでON。プロジェクト設定を確認。

---

## 🔄 マイグレーションのロールバック

### 個別テーブルの削除

```sql
-- memoriesテーブルのみ削除
DROP TABLE IF EXISTS public.memories CASCADE;

-- 再度マイグレーションを実行
-- 004_create_memories_table.sql を実行
```

### 全テーブルの削除（完全リセット）

```sql
-- すべてのテーブルを削除
DROP TABLE IF EXISTS public.memories CASCADE;
DROP TABLE IF EXISTS public.conversations CASCADE;
DROP TABLE IF EXISTS public.characters CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;
DROP FUNCTION IF EXISTS public.update_updated_at_column CASCADE;

-- 再度すべてのマイグレーションを順番に実行
```

**警告**: この操作はすべてのデータを削除します！

---

## 📝 新しいマイグレーションの追加

### 命名規則

```
00X_description.sql
```

例:
- `005_add_voice_settings.sql`
- `006_create_sessions_table.sql`

### テンプレート

```sql
-- [マイグレーションの説明]
-- 作成日: YYYY-MM-DD

-- テーブルの作成
CREATE TABLE IF NOT EXISTS public.your_table (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- RLSを有効化
ALTER TABLE public.your_table ENABLE ROW LEVEL SECURITY;

-- ポリシーの作成
CREATE POLICY "Users can view their own records"
  ON public.your_table
  FOR SELECT
  USING (auth.uid() = user_id);

-- インデックスの作成
CREATE INDEX IF NOT EXISTS idx_your_table_user_id 
  ON public.your_table(user_id);
```

---

## 🔗 関連リンク

- [Supabase Documentation](https://supabase.com/docs)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [DB設計書](../documents/DB設計書.md)

---

## ✅ チェックリスト

マイグレーション実行後、以下を確認してください：

- [ ] すべてのテーブルが作成されている
- [ ] RLSが有効化されている
- [ ] ポリシーが設定されている
- [ ] トリガーが設定されている（users, characters, memories）
- [ ] インデックスが作成されている
- [ ] 外部キー制約が正しく設定されている

---

以上でマイグレーションは完了です！🎉


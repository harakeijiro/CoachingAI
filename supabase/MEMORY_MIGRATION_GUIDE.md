# メモリ機能マイグレーションガイド

## 📋 概要

このマイグレーションは、`memories`テーブルを拡張して重要情報の記憶機能を実装するためのものです。

## 🚀 実行手順

### Step 1: Supabaseダッシュボードを開く

1. https://supabase.com/dashboard にアクセス
2. プロジェクトを選択

### Step 2: SQL Editorを開く

1. 左サイドバーの **SQL Editor** をクリック
2. 右上の **New query** ボタンをクリック

### Step 3: マイグレーションSQLを実行

以下のファイルの内容をコピー＆ペーストして実行してください：

**ファイル**: `supabase/migrations/007_extend_memories_table.sql`

### Step 4: 実行ボタンをクリック

1. SQLをペーストしたら、右下の **Run** ボタン（または `Cmd + Enter`）をクリック
2. 「**Success. No rows returned**」と表示されればOK！

---

## ✅ 実行後の確認

### 1. テーブル構造の確認

**Table Editor** → `memories`テーブルを開いて、以下のカラムが追加されているか確認：

- ✅ `user_id` (UUID, NULL可)
- ✅ `memory_type` (TEXT, NOT NULL)
- ✅ `confidence` (NUMERIC, NULL可)
- ✅ `expires_at` (TIMESTAMP WITH TIME ZONE, NULL可)
- ✅ `deleted_at` (TIMESTAMP WITH TIME ZONE, NULL可)

### 2. 制約の確認

`memory_type`に以下の制約が設定されているか確認：

```sql
CHECK (memory_type IN ('goal', 'behavior_pattern', 'affect_trend', 'advice_history', 'personal_info'))
```

### 3. インデックスの確認

以下のインデックスが作成されているか確認：

- ✅ `idx_memories_user_id`
- ✅ `idx_memories_memory_type`
- ✅ `idx_memories_expires_at`
- ✅ `idx_memories_user_type`

### 4. RLSポリシーの確認

以下のポリシーが作成されているか確認：

- ✅ `Users can view their own memories`
- ✅ `Users can create their own memories`
- ✅ `Users can update their own memories`
- ✅ `Users can delete their own memories`

---

## ⚠️ 注意事項

### 既存データがある場合

- 既存の`memories`レコードの`memory_type`は自動的に`advice_history`に設定されます
- 既存の`memories`レコードの`user_id`は`character_id`から自動的に設定されます（可能な場合）
- `character_id`がNOT NULL制約から解除され、NULL可能になります

### 実行順序

このマイグレーションは、以下のマイグレーションの**後に**実行してください：

1. `001_create_users_table.sql`
2. `002_create_characters_table.sql`
3. `003_create_conversations_table.sql`
4. `004_create_memories_table.sql`

---

## 🐛 トラブルシューティング

### エラー: "relation already exists"

→ `ALTER TABLE ... ADD COLUMN IF NOT EXISTS`を使用しているため、このエラーは通常発生しません。カラムが既に存在する場合は追加されません。

### エラー: "foreign key constraint"

→ `auth.users`テーブルが存在することを確認してください。また、`profiles`テーブルが未実装の場合は、このマイグレーションは`auth.users`を参照しています。

### エラー: "constraint already exists"

→ `DROP CONSTRAINT IF EXISTS`を使用しているため、このエラーは通常発生しません。

### エラー: "permission denied"

→ プロジェクトのオーナーでログインしているか確認してください。

---

## 📊 実行結果の確認

### SQLで確認

```sql
-- テーブル構造の確認
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'memories'
ORDER BY ordinal_position;

-- 制約の確認
SELECT constraint_name, constraint_type
FROM information_schema.table_constraints
WHERE table_schema = 'public' AND table_name = 'memories';

-- インデックスの確認
SELECT indexname, indexdef
FROM pg_indexes
WHERE schemaname = 'public' AND tablename = 'memories';

-- RLSポリシーの確認
SELECT policyname, cmd, qual, with_check
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'memories';
```

---

## ✅ 完了チェックリスト

- [ ] SQLマイグレーションを実行
- [ ] エラーなく実行完了
- [ ] テーブル構造が正しいことを確認
- [ ] 制約が正しく設定されていることを確認
- [ ] インデックスが作成されていることを確認
- [ ] RLSポリシーが設定されていることを確認

---

## 🎉 次のステップ

マイグレーションが完了したら、以下を確認してください：

1. **環境変数の設定**
   - `NEXT_PUBLIC_APP_URL`が設定されているか確認（開発環境: `http://localhost:3000`）

2. **動作テスト**
   - 詳細は `documents/メモリ機能テスト手順.md` を参照

3. **会話を開始**
   - 5メッセージごとにメモリが自動抽出されることを確認


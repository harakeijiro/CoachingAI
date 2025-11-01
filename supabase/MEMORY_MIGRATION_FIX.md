# メモリ機能マイグレーション修正手順

## 🐛 エラー内容

```
ERROR: 42P01: relation "public.memories" does not exist
```

このエラーは、`memories`テーブルがまだ作成されていない状態で拡張マイグレーションを実行したために発生しました。

## ✅ 解決方法

### Step 1: まず`memories`テーブルを作成

**`004_create_memories_table.sql`を実行してください**

1. Supabaseダッシュボード → SQL Editorを開く
2. `supabase/migrations/004_create_memories_table.sql`の内容をコピー＆ペースト
3. **Run**をクリックして実行
4. エラーなく完了することを確認

### Step 2: その後、拡張マイグレーションを実行

**`007_extend_memories_table.sql`を実行してください**

1. SQL Editorで新しいクエリを開く
2. `supabase/migrations/007_extend_memories_table.sql`の内容をコピー＆ペースト
3. **Run**をクリックして実行
4. エラーなく完了することを確認

---

## 📋 正しい実行順序

マイグレーションは**必ず以下の順序**で実行してください：

1. ✅ `001_create_users_table.sql` - usersテーブルの作成
2. ✅ `002_create_characters_table.sql` - charactersテーブルの作成
3. ✅ `003_create_conversations_table.sql` - conversationsテーブルの作成
4. ✅ `004_create_memories_table.sql` - **memoriesテーブルの作成**（必須）
5. ✅ `007_extend_memories_table.sql` - memoriesテーブルの拡張（この後に実行）

---

## 🔍 確認方法

### テーブルが存在するか確認

SQL Editorで以下のクエリを実行：

```sql
-- memoriesテーブルが存在するか確認
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'memories'
);
```

**結果が`true`なら**、テーブルは存在します。  
**結果が`false`なら**、`004_create_memories_table.sql`を実行してください。

---

## ⚠️ 注意事項

- `004_create_memories_table.sql`は既に実行済みの場合、`CREATE TABLE IF NOT EXISTS`を使用しているため、エラーは発生しません（安全です）
- `007_extend_memories_table.sql`は`ALTER TABLE ... ADD COLUMN IF NOT EXISTS`を使用しているため、既にカラムが存在する場合は追加されません（安全です）

---

## 🎯 実行後の確認

両方のマイグレーションを実行したら、以下を確認：

```sql
-- テーブル構造の確認
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'memories'
ORDER BY ordinal_position;
```

期待されるカラム一覧：
- `memory_id` (uuid, PK)
- `character_id` (uuid, nullable)
- `user_id` (uuid, nullable) ← 新規追加
- `topic` (varchar(255))
- `content` (text)
- `memory_type` (text, NOT NULL) ← 新規追加
- `confidence` (numeric, nullable) ← 新規追加
- `expires_at` (timestamptz, nullable) ← 新規追加
- `deleted_at` (timestamptz, nullable) ← 新規追加
- `created_at` (timestamptz)
- `updated_at` (timestamptz)


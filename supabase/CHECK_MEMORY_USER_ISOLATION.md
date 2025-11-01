# メモリのユーザー分離確認手順

## 🔍 問題の確認

SupabaseのTable Editorでは、RLS（Row Level Security）が**無視されます**。そのため、すべてのユーザーのデータが見えてしまいます。これは正常な動作です。

実際にユーザーごとに分離されているか確認するには、**SQL Editor**で確認する必要があります。

---

## ✅ 確認方法

### Step 1: 各ユーザーのメモリ数を確認

Supabaseの**SQL Editor**で以下のクエリを実行：

```sql
-- ユーザーごとのメモリ数を確認
SELECT 
  user_id,
  COUNT(*) as memory_count
FROM public.memories
WHERE deleted_at IS NULL
GROUP BY user_id
ORDER BY memory_count DESC;
```

**期待される結果**:
- 各ユーザーごとに異なる`user_id`が表示される
- 各ユーザーのメモリ数が表示される

### Step 2: 特定のユーザーのメモリのみを確認

現在ログインしているユーザーIDを確認：

```sql
-- 現在のユーザーIDを確認（認証が必要）
SELECT auth.uid() as current_user_id;
```

その後、そのユーザーのメモリのみを確認：

```sql
-- 特定のユーザーIDでメモリを確認（実際のuser_idに置き換える）
SELECT 
  memory_id,
  user_id,
  memory_type,
  topic,
  content,
  created_at
FROM public.memories
WHERE user_id = '5410e477-b227-4d22-bf57-9de43c84d1cc'  -- 実際のuser_idに置き換える
  AND deleted_at IS NULL
ORDER BY created_at DESC;
```

### Step 3: 異なるユーザーのメモリが混在していないか確認

```sql
-- 全メモリのuser_idを確認
SELECT 
  user_id,
  COUNT(*) as count,
  STRING_AGG(topic, ', ' ORDER BY created_at) as topics
FROM public.memories
WHERE deleted_at IS NULL
GROUP BY user_id
ORDER BY user_id;
```

---

## 🐛 問題が発生している場合の確認

### 問題1: すべてのメモリが同じuser_idになっている

**原因の可能性**:
- 認証が正しく機能していない
- `user.id`が常に同じ値を返している
- すべてのユーザーが同じアカウントでログインしている

**確認方法**:
```sql
-- user_idの分布を確認
SELECT 
  user_id,
  COUNT(*) as count
FROM public.memories
GROUP BY user_id;
```

### 問題2: RLSポリシーが機能していない

**確認方法**:
1. 異なるユーザーでログイン
2. アプリからメモリを取得
3. それぞれのユーザーで異なるメモリが表示されるか確認

**確認用クエリ（認証状態で）**:
```sql
-- 現在ログインしているユーザーから見えるメモリのみを取得
-- これはRLSポリシーの動作を確認するためのクエリ
SELECT * FROM public.memories;
-- ↑ これは現在のユーザーのメモリのみを返すはず（RLS適用後）
```

---

## 🔧 修正が必要な場合

### 修正1: 認証情報が正しく渡されているか確認

`front/lib/actions/memory.ts`の`createMemories`関数で：
- `user.id`が正しく取得されているか
- ログに出力して確認

### 修正2: RLSポリシーの確認

`supabase/migrations/007_extend_memories_table.sql`のRLSポリシーが正しく設定されているか確認：

```sql
-- RLSポリシーの確認
SELECT 
  schemaname,
  tablename,
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public' 
  AND tablename = 'memories';
```

以下が設定されているか確認：
- `Users can view their own memories` (SELECT)
- `Users can create their own memories` (INSERT)
- `Users can update their own memories` (UPDATE)
- `Users can delete their own memories` (DELETE)

---

## 📊 確認結果の判断基準

### ✅ 正常な場合

- 各ユーザーごとに異なる`user_id`が設定されている
- SQL Editorで`user_id`を指定すると、そのユーザーのメモリのみが表示される
- アプリから見ると、ログインしているユーザーのメモリのみが表示される

### ❌ 問題がある場合

- すべてのメモリが同じ`user_id`になっている
- 異なるユーザーでログインしても、同じメモリが表示される
- `user_id`が`NULL`になっているメモリがある

---

まず、**Step 1**のクエリを実行して、結果を共有してください。


-- ============================================
-- CoachingAI 簡単テスト用キャラクターデータ
-- 既存のデータベース構造に合わせたサンプルデータ
-- ============================================

-- 注意: このスクリプトを実行する前に、実際のユーザーIDを取得して置き換える必要があります
-- Supabaseダッシュボードの認証 > ユーザーから実際のユーザーIDをコピーしてください

-- テスト用のキャラクターデータを挿入
-- 実際のユーザーIDに置き換えてください
INSERT INTO public.characters (
  character_id,
  user_id,
  character_name,
  personality_type,
  model_path,
  display_size,
  volume,
  response_speed,
  created_at,
  updated_at
) VALUES 
-- メンタル・自己理解テーマ
(
  gen_random_uuid(),
  'YOUR_USER_ID_HERE', -- 実際のユーザーIDに置き換え
  '心のサポーター あい',
  'mental',
  'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=400&h=400&fit=crop&crop=face',
  100,
  50,
  50,
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'YOUR_USER_ID_HERE', -- 実際のユーザーIDに置き換え
  '癒しのコーチ ゆう',
  'mental',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face',
  100,
  50,
  50,
  NOW(),
  NOW()
),

-- 恋愛・人間関係テーマ
(
  gen_random_uuid(),
  'YOUR_USER_ID_HERE', -- 実際のユーザーIDに置き換え
  '恋愛アドバイザー れん',
  'love',
  'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop&crop=face',
  100,
  50,
  50,
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'YOUR_USER_ID_HERE', -- 実際のユーザーIDに置き換え
  '人間関係の専門家 なな',
  'love',
  'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&h=400&fit=crop&crop=face',
  100,
  50,
  50,
  NOW(),
  NOW()
),

-- キャリア・目標達成テーマ
(
  gen_random_uuid(),
  'YOUR_USER_ID_HERE', -- 実際のユーザーIDに置き換え
  'キャリアコンサルタント けい',
  'career',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face',
  100,
  50,
  50,
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'YOUR_USER_ID_HERE', -- 実際のユーザーIDに置き換え
  '目標達成のメンター めい',
  'career',
  'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=400&h=400&fit=crop&crop=face',
  100,
  50,
  50,
  NOW(),
  NOW()
);

-- 使用方法:
-- 1. Supabaseダッシュボードにログイン
-- 2. SQL Editorを開く
-- 3. 認証 > ユーザーから実際のユーザーIDをコピー
-- 4. 上記の 'YOUR_USER_ID_HERE' を実際のユーザーIDに置き換え
-- 5. SQLを実行

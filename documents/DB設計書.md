# AI コンパニオン開発プロジェクト データベース設計書

## 1. 概要

本設計書は、AI コンパニオン開発プロジェクトの要件定義書に基づき、データベースのテーブル構造を定義するものです。Supabase (PostgreSQL) の利用を前提としています。

## 2. テーブル定義

### 2.1. `users` テーブル

ユーザーに関する情報を格納します。
Supabase Auth を利用する場合、`auth.users` テーブルが自動的に作成されます。この `users` テーブルは、`auth.users` テーブルの `id` を `user_id` として参照し、追加のユーザープロファイル情報を保持するために使用することを想定しています。

-- =========================================================
-- CoachingAI DB Schema for Supabase (PostgreSQL)
-- 認証: Supabase Auth（OAuthのみ、メール/パスワード無し）
-- ポリシー: RLS（user_id = auth.uid()）
-- =========================================================

-- 1) 前提拡張
create extension if not exists pgcrypto;  -- gen_random_uuid()

-- 2) 共通トリガ: updated_at を NOW() に自動更新
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- 3) 列挙 or チェック制約用ドメイン（柔軟性重視のため text + CHECK で実装）
--  ※ 運用で固定したい場合は enum type でもOK
-- ここではCHECKを各テーブルで個別に定義します。

-- 4) プロファイル（アプリ側ユーザー情報）
create table if not exists public.profiles (
  user_id      uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_url   text,
  locale       text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create trigger trg_profiles_updated
before update on public.profiles
for each row execute function public.set_updated_at();

-- 5) ユーザー既定設定
create table if not exists public.user_settings (
  user_id        uuid primary key references public.profiles(user_id) on delete cascade,
  llm_primary    text check (llm_primary in ('gemini','gpt')) default 'gemini',
  tts_voice_id   text,            -- Cartesia Voice ID
  tts_speed      numeric,         -- 任意: 0.5~2.0 などクライアント側でバリデーション
  response_style text check (response_style in ('polite','casual')) default 'polite',
  memory_policy  text check (memory_policy in ('important_only','auto_summary','no_save')) default 'important_only',
  retention_days int,             -- 30 / 90 / null(無期限)
  memory_targets jsonb,           -- 例: {"goal":true,"behavior_pattern":true,"affect_trend":true,"advice_history":true}
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create trigger trg_user_settings_updated
before update on public.user_settings
for each row execute function public.set_updated_at();

-- 6) アセット（3Dモデル/テクスチャ/音声等）
create table if not exists public.assets (
  asset_id     uuid primary key default gen_random_uuid(),
  user_id      uuid not null references public.profiles(user_id) on delete cascade,
  kind         text not null check (kind in ('model','texture','rig','animation','thumbnail','audio')),
  storage_path text not null,
  version      int not null default 1,
  metadata     jsonb, -- 例: {"format":"glb","polycount":12000,"scale":1.0}
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index if not exists idx_assets_user on public.assets(user_id);
create index if not exists idx_assets_kind on public.assets(kind);
create trigger trg_assets_updated
before update on public.assets
for each row execute function public.set_updated_at();

-- 7) キャラクター
create table if not exists public.characters (
  character_id     uuid primary key default gen_random_uuid(),
  user_id          uuid not null references public.profiles(user_id) on delete cascade,
  name             text not null,
  personality_type text,
  model_asset_id   uuid references public.assets(asset_id) on delete set null,
  default_pose     text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  deleted_at       timestamptz
);
create index if not exists idx_characters_user on public.characters(user_id);
create index if not exists idx_characters_created on public.characters(created_at desc);
create trigger trg_characters_updated
before update on public.characters
for each row execute function public.set_updated_at();

-- 8) キャラクター別上書き設定
create table if not exists public.character_settings (
  character_id   uuid primary key references public.characters(character_id) on delete cascade,
  size           numeric,  -- 表示倍率
  opacity        numeric,  -- 0.0~1.0
  position       text,     -- 'bottom_left' | 'bottom_right' | 'center' など
  tts_voice_id   text,     -- キャラ固有のCartesia声
  tts_speed      numeric,
  response_speed numeric,  -- 思考演出用
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create trigger trg_character_settings_updated
before update on public.character_settings
for each row execute function public.set_updated_at();

-- 9) 会話セッション（履歴の単位）
create table if not exists public.sessions (
  session_id   uuid primary key default gen_random_uuid(),
  user_id      uuid not null references public.profiles(user_id) on delete cascade,
  character_id uuid not null references public.characters(character_id) on delete cascade,
  title        text,
  is_important boolean not null default false,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  closed_at    timestamptz
);
create index if not exists idx_sessions_user on public.sessions(user_id);
create index if not exists idx_sessions_char on public.sessions(character_id);
create index if not exists idx_sessions_created on public.sessions(created_at desc);
create trigger trg_sessions_updated
before update on public.sessions
for each row execute function public.set_updated_at();

-- 10) メッセージ（1発話単位）
create table if not exists public.messages (
  message_id     uuid primary key default gen_random_uuid(),
  session_id     uuid not null references public.sessions(session_id) on delete cascade,
  role           text not null check (role in ('user','assistant','system')),
  content_text   text,
  content_meta   jsonb, -- {"input_mode":"voice|text","emotion":{"valence":...},"confidence":...,"phonemes":[...]}
  audio_asset_id uuid references public.assets(asset_id) on delete set null, -- Cartesia音声を保存する場合のみ
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create index if not exists idx_messages_session_created on public.messages(session_id, created_at asc);
create trigger trg_messages_updated
before update on public.messages
for each row execute function public.set_updated_at();

-- 11) セッション要約（履歴一覧で使用）
create table if not exists public.session_summaries (
  summary_id            uuid primary key default gen_random_uuid(),
  session_id            uuid not null references public.sessions(session_id) on delete cascade,
  summary_text          text not null,
  key_points            jsonb, -- {"learning":[...],"next_actions":[...]}
  extracted_memory_refs jsonb, -- ["<memory_id>", ...] 参照の冪等化に使用
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);
create index if not exists idx_session_summaries_session on public.session_summaries(session_id);
create index if not exists idx_session_summaries_created on public.session_summaries(created_at desc);
create trigger trg_session_summaries_updated
before update on public.session_summaries
for each row execute function public.set_updated_at();

-- 12) 長期記憶（重要情報のみ）
create table if not exists public.memories (
  memory_id         uuid primary key default gen_random_uuid(),
  user_id           uuid not null references public.profiles(user_id) on delete cascade,
  character_id      uuid references public.characters(character_id) on delete set null,
  memory_type       text not null check (memory_type in ('goal','behavior_pattern','affect_trend','advice_history')),
  topic             text not null,
  content           text not null,
  confidence        numeric,     -- 0.0~1.0
  source_summary_id uuid references public.session_summaries(summary_id) on delete set null,
  expires_at        timestamptz, -- user_settings.retention_days に応じてアプリ層で設定
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  deleted_at        timestamptz
);
create index if not exists idx_memories_user on public.memories(user_id);
create index if not exists idx_memories_type on public.memories(memory_type);
create index if not exists idx_memories_expires on public.memories(expires_at);
create trigger trg_memories_updated
before update on public.memories
for each row execute function public.set_updated_at();

-- 13) 目標（SMART）
create table if not exists public.goals (
  goal_id      uuid primary key default gen_random_uuid(),
  user_id      uuid not null references public.profiles(user_id) on delete cascade,
  character_id uuid references public.characters(character_id) on delete set null,
  title        text not null,
  description  text,
  due_date     date,
  status       text not null check (status in ('active','paused','completed','archived')) default 'active',
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  completed_at timestamptz
);
create index if not exists idx_goals_user on public.goals(user_id);
create index if not exists idx_goals_status on public.goals(status);
create index if not exists idx_goals_due on public.goals(due_date);
create trigger trg_goals_updated
before update on public.goals
for each row execute function public.set_updated_at();

-- 14) 目標進捗ログ
create table if not exists public.goal_progress (
  progress_id  uuid primary key default gen_random_uuid(),
  goal_id      uuid not null references public.goals(goal_id) on delete cascade,
  note         text,
  score        int, -- 0-100 等（クライアント側で制御）
  recorded_at  timestamptz not null default now(),
  created_at   timestamptz not null default now()
);
create index if not exists idx_progress_goal_recorded on public.goal_progress(goal_id, recorded_at);

-- 15) リマインダー（通知設定）
create table if not exists public.reminders (
  reminder_id   uuid primary key default gen_random_uuid(),
  user_id       uuid not null references public.profiles(user_id) on delete cascade,
  goal_id       uuid references public.goals(goal_id) on delete set null,
  schedule_spec text not null, -- cronやJSONで表現
  active        boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index if not exists idx_reminders_user on public.reminders(user_id);
create trigger trg_reminders_updated
before update on public.reminders
for each row execute function public.set_updated_at();

-- 16) プライバシー関連リクエスト（エクスポート／削除／匿名化）
create table if not exists public.privacy_requests (
  request_id   uuid primary key default gen_random_uuid(),
  user_id      uuid not null references public.profiles(user_id) on delete cascade,
  kind         text not null check (kind in ('export','delete_all','anonymize')),
  status       text not null check (status in ('queued','processing','done','failed')) default 'queued',
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  processed_at timestamptz
);
create index if not exists idx_privacy_requests_user on public.privacy_requests(user_id);
create trigger trg_privacy_requests_updated
before update on public.privacy_requests
for each row execute function public.set_updated_at();

-- 17) 監査ログ（任意）
create table if not exists public.audit_logs (
  log_id        uuid primary key default gen_random_uuid(),
  user_id       uuid not null references public.profiles(user_id) on delete cascade,
  action        text not null,   -- 'settings_update','export','delete','session_resume' など
  resource_type text,            -- 'session','memory','goal','setting' など
  resource_id   uuid,
  detail        jsonb,
  created_at    timestamptz not null default now()
);
create index if not exists idx_audit_user_created on public.audit_logs(user_id, created_at desc);

-- =========================================================
-- RLS（Row Level Security）
-- =========================================================

-- 有効化
alter table public.profiles           enable row level security;
alter table public.user_settings      enable row level security;
alter table public.assets             enable row level security;
alter table public.characters         enable row level security;
alter table public.character_settings enable row level security;
alter table public.sessions           enable row level security;
alter table public.messages           enable row level security;
alter table public.session_summaries  enable row level security;
alter table public.memories           enable row level security;
alter table public.goals              enable row level security;
alter table public.goal_progress      enable row level security;
alter table public.reminders          enable row level security;
alter table public.privacy_requests   enable row level security;
alter table public.audit_logs         enable row level security;

-- 基本ポリシー（owner 自身のみ）
-- profiles
create policy if not exists sel_profiles on public.profiles
  for select using (user_id = auth.uid());
create policy if not exists ins_profiles on public.profiles
  for insert with check (user_id = auth.uid());
create policy if not exists upd_profiles on public.profiles
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy if not exists del_profiles on public.profiles
  for delete using (user_id = auth.uid());

-- user_settings
create policy if not exists sel_user_settings on public.user_settings
  for select using (user_id = auth.uid());
create policy if not exists ins_user_settings on public.user_settings
  for insert with check (user_id = auth.uid());
create policy if not exists upd_user_settings on public.user_settings
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy if not exists del_user_settings on public.user_settings
  for delete using (user_id = auth.uid());

-- assets
create policy if not exists sel_assets on public.assets
  for select using (user_id = auth.uid());
create policy if not exists ins_assets on public.assets
  for insert with check (user_id = auth.uid());
create policy if not exists upd_assets on public.assets
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy if not exists del_assets on public.assets
  for delete using (user_id = auth.uid());

-- characters
create policy if not exists sel_characters on public.characters
  for select using (user_id = auth.uid());
create policy if not exists ins_characters on public.characters
  for insert with check (user_id = auth.uid());
create policy if not exists upd_characters on public.characters
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy if not exists del_characters on public.characters
  for delete using (user_id = auth.uid());

-- character_settings（characters 経由の所有権を参照）
create policy if not exists sel_character_settings on public.character_settings
  for select using (
    exists (select 1 from public.characters c where c.character_id = character_settings.character_id and c.user_id = auth.uid())
  );
create policy if not exists ins_character_settings on public.character_settings
  for insert with check (
    exists (select 1 from public.characters c where c.character_id = character_settings.character_id and c.user_id = auth.uid())
  );
create policy if not exists upd_character_settings on public.character_settings
  for update using (
    exists (select 1 from public.characters c where c.character_id = character_settings.character_id and c.user_id = auth.uid())
  )
  with check (
    exists (select 1 from public.characters c where c.character_id = character_settings.character_id and c.user_id = auth.uid())
  );
create policy if not exists del_character_settings on public.character_settings
  for delete using (
    exists (select 1 from public.characters c where c.character_id = character_settings.character_id and c.user_id = auth.uid())
  );

-- sessions
create policy if not exists sel_sessions on public.sessions
  for select using (user_id = auth.uid());
create policy if not exists ins_sessions on public.sessions
  for insert with check (user_id = auth.uid());
create policy if not exists upd_sessions on public.sessions
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy if not exists del_sessions on public.sessions
  for delete using (user_id = auth.uid());

-- messages（親セッションの所有者のみ）
create policy if not exists sel_messages on public.messages
  for select using (
    exists (select 1 from public.sessions s where s.session_id = messages.session_id and s.user_id = auth.uid())
  );
create policy if not exists ins_messages on public.messages
  for insert with check (
    exists (select 1 from public.sessions s where s.session_id = messages.session_id and s.user_id = auth.uid())
  );
create policy if not exists upd_messages on public.messages
  for update using (
    exists (select 1 from public.sessions s where s.session_id = messages.session_id and s.user_id = auth.uid())
  )
  with check (
    exists (select 1 from public.sessions s where s.session_id = messages.session_id and s.user_id = auth.uid())
  );
create policy if not exists del_messages on public.messages
  for delete using (
    exists (select 1 from public.sessions s where s.session_id = messages.session_id and s.user_id = auth.uid())
  );

-- session_summaries（セッション所有者のみ）
create policy if not exists sel_session_summaries on public.session_summaries
  for select using (
    exists (select 1 from public.sessions s where s.session_id = session_summaries.session_id and s.user_id = auth.uid())
  );
create policy if not exists ins_session_summaries on public.session_summaries
  for insert with check (
    exists (select 1 from public.sessions s where s.session_id = session_summaries.session_id and s.user_id = auth.uid())
  );
create policy if not exists upd_session_summaries on public.session_summaries
  for update using (
    exists (select 1 from public.sessions s where s.session_id = session_summaries.session_id and s.user_id = auth.uid())
  )
  with check (
    exists (select 1 from public.sessions s where s.session_id = session_summaries.session_id and s.user_id = auth.uid())
  );
create policy if not exists del_session_summaries on public.session_summaries
  for delete using (
    exists (select 1 from public.sessions s where s.session_id = session_summaries.session_id and s.user_id = auth.uid())
  );

-- memories
create policy if not exists sel_memories on public.memories
  for select using (user_id = auth.uid());
create policy if not exists ins_memories on public.memories
  for insert with check (user_id = auth.uid());
create policy if not exists upd_memories on public.memories
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy if not exists del_memories on public.memories
  for delete using (user_id = auth.uid());

-- goals
create policy if not exists sel_goals on public.goals
  for select using (user_id = auth.uid());
create policy if not exists ins_goals on public.goals
  for insert with check (user_id = auth.uid());
create policy if not exists upd_goals on public.goals
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy if not exists del_goals on public.goals
  for delete using (user_id = auth.uid());

-- goal_progress（親goalの所有者のみ）
create policy if not exists sel_goal_progress on public.goal_progress
  for select using (
    exists (select 1 from public.goals g where g.goal_id = goal_progress.goal_id and g.user_id = auth.uid())
  );
create policy if not exists ins_goal_progress on public.goal_progress
  for insert with check (
    exists (select 1 from public.goals g where g.goal_id = goal_progress.goal_id and g.user_id = auth.uid())
  );
create policy if not exists upd_goal_progress on public.goal_progress
  for update using (
    exists (select 1 from public.goals g where g.goal_id = goal_progress.goal_id and g.user_id = auth.uid())
  )
  with check (
    exists (select 1 from public.goals g where g.goal_id = goal_progress.goal_id and g.user_id = auth.uid())
  );
create policy if not exists del_goal_progress on public.goal_progress
  for delete using (
    exists (select 1 from public.goals g where g.goal_id = goal_progress.goal_id and g.user_id = auth.uid())
  );

-- reminders
create policy if not exists sel_reminders on public.reminders
  for select using (user_id = auth.uid());
create policy if not exists ins_reminders on public.reminders
  for insert with check (user_id = auth.uid());
create policy if not exists upd_reminders on public.reminders
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy if not exists del_reminders on public.reminders
  for delete using (user_id = auth.uid());

-- privacy_requests
create policy if not exists sel_privacy_requests on public.privacy_requests
  for select using (user_id = auth.uid());
create policy if not exists ins_privacy_requests on public.privacy_requests
  for insert with check (user_id = auth.uid());
create policy if not exists upd_privacy_requests on public.privacy_requests
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy if not exists del_privacy_requests on public.privacy_requests
  for delete using (user_id = auth.uid());

-- audit_logs（ユーザー自身の行為のみ閲覧可能。運用で管理者閲覧が必要なら別ロールで付与）
create policy if not exists sel_audit_logs on public.audit_logs
  for select using (user_id = auth.uid());
create policy if not exists ins_audit_logs on public.audit_logs
  for insert with check (user_id = auth.uid());
-- 更新/削除は通常不要。必要なら同様に追加。

-- =========================================================
-- 便利ビュー（任意）：履歴一覧用の軽量結合
-- =========================================================
create or replace view public.v_history_list as
select
  s.session_id,
  s.user_id,
  s.character_id,
  coalesce(s.title, left(ss.summary_text, 60)) as title,
  s.is_important,
  s.created_at,
  ss.summary_text,
  ss.key_points
from public.sessions s
left join lateral (
  select summary_text, key_points
  from public.session_summaries
  where session_id = s.session_id
  order by created_at desc
  limit 1
) ss on true;

API 設計書（Supabase 利用）
1. はじめに

本ドキュメントは CoachingAI のAPI仕様を定義する。
バックエンドは Supabase（PostgreSQL + Auth + Storage + Edge Functions）を用いる。
基本のデータ読み書きは Supabase Client SDK で行い、機密鍵を扱う処理や外部API連携、複合トランザクションは Edge Functions 側で実装する。

参考ドキュメント
要件定義書、画面設計書、データベース設計書（最終SQL）。

2. 認証と共通仕様

認証は Supabase Auth（OAuth: Google / Microsoft）。
クライアントは認証後のJWTを全リクエストに付与する。

ヘッダ
Authorization: Bearer <jwt>

RLSにより、全テーブルは user_id = auth.uid() の行のみ操作可能。
Edge Functions はリクエストヘッダからユーザーコンテキストを復元して Supabase サーバSDKを初期化する。

エラーフォーマット
{
"error": { "code": "string", "message": "string", "details": { "...": "..." } }
}

レート制限と冪等性
重い処理（chat、export）はユーザー単位で制限する。必要に応じて Idempotency-Key ヘッダを受け付け、短期キャッシュで二重実行を防ぐ。

3. エンドポイント分類

クライアント直アクセス（Supabase Client SDK）
profiles、user_settings、assets、characters、character_settings、sessions、messages、session_summaries、memories、goals、goal_progress、reminders、privacy_requests、v_history_list のCRUD/参照。

Edge Functions（HTTP、/functions/v1 配下）
chat、summarize-session、memory-upsert、export, privacy-dispatch（削除/匿名化処理の実行）、tts（必要時に分離）。
注記: 実装では chat 内で要約とメモリ抽出を同時実行する。再要約やバッチ用途に個別関数も用意する。

4. Edge Functions API
4.1 POST /functions/v1/chat

目的
ユーザー発話を受けて LLM 応答を生成し、必要に応じて Cartesia TTS を生成、セッション・メッセージ・要約・メモリを保存する。3D用のアクションヒントも返す。

認証
必須。

リクエストボディ
{
"session_id": "UUID or null",
"character_id": "UUID",
"message": {
"type": "text" | "audio",
"text": "string",
"audio_base64": "string"
},
"client_meta": {
"input_mode": "voice" | "text",
"emotion_hint": "string",
"language": "ja-JP"
},
"options": {
"generate_tts": true | false,
"save_policy_override": "important_only" | "auto_summary" | "no_save",
"idempotency_key": "string"
}
}

レスポンス（200）
{
"session_id": "UUID",
"assistant_message_id": "UUID",
"response_text": "string",
"action": {
"emotion": "joy|sad|angry|neutral|...",
"animation": "nod|wave|think|...",
"expression": "smile|serious|surprised|...",
"lip_sync_meta": { "phonemes": [], "timings": [] }
},
"tts": { "audio_base64": "string" },
"summary": { "updated": true | false, "summary_id": "UUID or null" },
"memories": { "upserted_ids": ["UUID", "..."] }
}

主な処理フロー

JWT 検証と user_id 抽出。

session_id が無ければ sessions を新規作成（character_id 紐付け）。

messages にユーザー発話を保存（content_meta に emotion_hint 等を格納）。

user_settings、character_settings、直近の session_summaries と memories を取得し、プロンプトを構築。

LLM 呼び出し（Vercel AI SDK 経由の Gemini または GPT）。

応答テキストを messages（role=assistant）に保存。

保存方針に応じて session_summaries を更新 or 追加。

要約から重要情報を抽出し、memories を upsert（memory_type、confidence、expires_atを設定）。

options.generate_tts が true の場合、Cartesia TTS を呼び出し、lip sync 用メタも生成。

アクションヒント（emotion/animation/expression）はルールまたはLLM補助で決定。

レスポンス返却。

エラー
validation_failed / forbidden / upstream_error / rate_limited / conflict（同じ idempotency_key 再送）など。

4.2 POST /functions/v1/summarize-session

目的
既存セッションの全メッセージから最新要約を再生成し、session_summaries に保存する。

認証
必須。

リクエスト
{ "session_id": "UUID" }

レスポンス
{ "summary_id": "UUID", "summary_text": "string", "key_points": { "learning": [], "next_actions": [] } }

4.3 POST /functions/v1/memory-upsert

目的
任意のテキストから重要情報を抽出し、memories に upsert する（UIからの手動登録や要約編集反映用）。

認証
必須。

リクエスト
{
"character_id": "UUID or null",
"source_summary_id": "UUID or null",
"items": [
{
"memory_type": "goal|behavior_pattern|affect_trend|advice_history",
"topic": "string",
"content": "string",
"confidence": 0.0
}
]
}

レスポンス
{ "upserted_ids": ["UUID", "..."] }

4.4 POST /functions/v1/export

目的
ユーザーデータ一式のエクスポートを生成し、ストレージへ保存してダウンロードURLを返す。

認証
必須。レート制限を厳しめに設定。

リクエスト
{ "format": "json" | "csv", "scopes": ["sessions","messages","memories","goals","settings"] }

レスポンス
{ "request_id": "UUID", "status": "queued|processing|done", "download_url": "string or null" }

備考
privacy_requests に export を登録し、ジョブで処理。完了後にダウンロードURLを更新。

4.5 POST /functions/v1/privacy-dispatch

目的
プライバシー関連操作を実行する（delete_all、anonymize）。UIはまず privacy_requests を作成し、その後この関数を起動する。

認証
必須。破壊的操作は二重確認の上で呼び出す。

リクエスト
{ "request_id": "UUID" }

レスポンス
{ "status": "processing|done|failed" }

動作
request.kind に応じて対象データを削除または匿名化し、privacy_requests を更新。RLS下で安全に実行する。

4.6 POST /functions/v1/tts（必要に応じて）

目的
Cartesia TTS をサーバ側で呼び出し、音声と lip sync メタを返す。chat に内包できる場合は省略可。

認証
必須。

リクエスト
{ "text": "string", "voice_id": "string or null", "speed": 1.0 }

レスポンス
{ "audio_base64": "string", "lip_sync_meta": { "phonemes": [], "timings": [] } }

5. Supabase Client SDK（直接アクセス設計）

以下は典型的なCRUDと検索パターン。RLSにより本人の行のみ操作可能。

5.1 プロフィール

取得
const { data } = await supabase.from("profiles").select("*").single();

作成・更新
サインアップ後に初期行が無い場合は insert。その後は update。

5.2 ユーザー設定

取得
await supabase.from("user_settings").select("*").single();

保存
await supabase.from("user_settings").upsert({ user_id, llm_primary, ... });

備考
未設定はアプリ側のデフォルトを使用。character_settings があれば上書き。

5.3 アセット（3Dモデル、音声等）

アップロード
Supabase Storage にバケットを作成し、クライアントでファイルを put → そのキーを assets.storage_path に insert。

検索
await supabase.from("assets").select("*").eq("kind","model").order("created_at",{ascending:false});

5.4 キャラクターと個別設定

一覧
await supabase.from("characters").select("*").order("created_at",{ascending:false});

作成
await supabase.from("characters").insert({ name, personality_type, model_asset_id });

上書き設定
await supabase.from("character_settings").upsert({ character_id, size, opacity, ... });

5.5 セッション

作成
await supabase.from("sessions").insert({ character_id, title });

一覧（履歴画面）
軽量な一覧は v_history_list ビューを利用。
await supabase.from("v_history_list").select("*").order("created_at",{ascending:false}).limit(50);

重要フラグ
await supabase.from("sessions").update({ is_important: true }).eq("session_id", id);

5.6 メッセージ

取得（時系列）
await supabase.from("messages").select("*").eq("session_id", id).order("created_at", { ascending: true });

UIから送信（テキストのみの暫定）
await supabase.from("messages").insert({ session_id, role: "user", content_text, content_meta });

通常は Edge Functions の chat を使って一括処理すること。

5.7 セッション要約

最新要約の取得
await supabase.from("session_summaries").select("*").eq("session_id", id).order("created_at",{ascending:false}).limit(1);

再要約
Edge Functions summarize-session を呼び出す。

5.8 メモリ（重要情報のみ）

検索
await supabase.from("memories").select("*").eq("memory_type","goal").order("created_at",{ascending:false});

作成・更新
手動編集は memory-upsert でも、直接 upsert でも可（運用ポリシーに合わせる）。
expires_at は user_settings.retention_days に基づきクライアントまたは関数側で設定。

5.9 目標と進捗

目標CRUD
insert/update/select on goals。status を active/paused/completed/archived。

進捗ログ
insert/select on goal_progress（goal_id ごとに order by recorded_at）。

5.10 リマインダー

CRUD
insert/update/select on reminders。schedule_spec は cron またはJSON（アプリ規約に合わせる）。
Edge Functions または外部ワーカーでスケジュール実行。

5.11 プライバシーリクエスト

作成
await supabase.from("privacy_requests").insert({ kind: "export" | "delete_all" | "anonymize" });

状態確認
select on privacy_requests。必要なら privacy-dispatch を起動。

6. 画面との結線（主要ユースケース）

ランディング
未ログイン → /signup or /signin（OAuth）。ログイン後は /chat へ。

新規登録／ログイン
OAuth 成功後、profiles と user_settings の初期行をチェック。無ければ作成。

オンボーディング
選択値を user_settings と character_settings に保存。必要なら characters を初期生成。

対話画面
ユーザー入力は chat 関数へ。返却データで

テキスト表示

TTS 再生

3Dアクション適用
履歴へは v_history_list、詳細へは messages、要約は session_summaries。

設定画面
user_settings／character_settings を編集保存。Cartesia 声質（tts_voice_id）、応答スタイルや LLM 切替、記憶方針・保持期間・記憶対象を管理。

履歴画面
v_history_list を一覧表示。要約編集は session_summaries 更新、重要化は sessions.is_important を更新。
「この要約で再開」は最新要約テキストを chat のコンテキストに渡す。

プライバシー
privacy_requests を作成し、export／delete_all／anonymize を実行。完了後は通知とダウンロード導線。

7. セキュリティとRLS注意点

ストレージ
assets.storage_path に対するダウンロード権限は Storage ポリシーで user_id 検証を行う。公開不要なモデルは匿名公開しない。

RLS
全テーブルの RLS は最終SQLのとおり。join 前提の select はサブクエリ exists を伴うポリシーで制御済み。
破壊的操作（delete_all）は privacy-dispatch 側で行い、トランザクション管理する。

監査
重要操作は audit_logs に記録（settings_update、export、delete、session_resume など）。

8. バージョニングと将来拡張

APIバージョン
Edge Functions は /functions/v1 配下で運用。互換性を壊す変更は v2 として導入する。

Whisper 連携
将来は /functions/v1/asr を追加し、音声ストリームの逐次認識に対応。messages.content_meta に音声認識メタを格納。

マルチキャラクター
characters を複数所持する前提で既に対応済み。セッション作成時に character_id を選択可能。

9. 最小実装チェックリスト

必須
profiles 作成、user_settings 初期化、characters 1体、chat エンドポイント、messages 保存、session_summaries 生成、memories upsert、Cartesia TTS 呼び出し、v_history_list 画面。

推奨
export、privacy-dispatch、goals／progress、reminders、assets のUI、Storageポリシー設定。

10. 参考コード断片（Next.js App Router）

Edge Functions 呼び出し
const res = await fetch("/functions/v1/chat", {
method: "POST",
headers: {
"Authorization": Bearer ${jwt},
"Content-Type": "application/json",
"Idempotency-Key": crypto.randomUUID()
},
body: JSON.stringify(payload)
});

Supabase クエリ例
const { data: history } = await supabase.from("v_history_list")
.select("*").order("created_at", { ascending: false }).limit(50);
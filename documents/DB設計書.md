# AI コンパニオン開発プロジェクト データベース設計書

## 1. 概要

本設計書は、AI コンパニオン開発プロジェクトの要件定義書に基づき、データベースのテーブル構造を定義するものです。Supabase (PostgreSQL) の利用を前提としています。

## 2. テーブル定義

### 2.1. `users` テーブル

ユーザーに関する情報を格納します。
Supabase Auth を利用する場合、`auth.users` テーブルが自動的に作成されます。この `users` テーブルは、`auth.users` テーブルの `id` を `user_id` として参照し、追加のユーザープロファイル情報を保持するために使用することを想定しています。

| カラム名     | データ型                   | 制約                        | 説明                                                        |
| :----------- | :------------------------- | :-------------------------- | :---------------------------------------------------------- |
| `user_id`    | `UUID`                     | `PRIMARY KEY`               | ユーザーを一意に識別する ID（Supabase Auth の `id` を参照） |
| `name`       | `VARCHAR(255)`             | `NOT NULL`                  | ユーザー名                                                  |
| `birthdate`  | `DATE`                     | `NULLABLE`                  | ユーザーの誕生日                                            |
| `created_at` | `TIMESTAMP WITH TIME ZONE` | `NOT NULL`, `DEFAULT NOW()` | レコード作成日時 (Supabase の自動更新機能を利用)            |
| `updated_at` | `TIMESTAMP WITH TIME ZONE` | `NOT NULL`, `DEFAULT NOW()` | レコード更新日時 (Supabase の自動更新機能を利用)            |

### 2.2. `characters` テーブル

AI コンパニオンのキャラクターに関する情報を格納します。
| カラム名 | データ型 | 制約 | 説明 |
| :------------------ | :------------ | :----------------------------------- | :----------------------------------------- |
| `character_id` | `UUID` | `PRIMARY KEY` | キャラクターを一意に識別する ID |
| `user_id` | `UUID` | `FOREIGN KEY` (`users.user_id`) | キャラクターを所有するユーザーの ID |
| `character_name` | `VARCHAR(255)`| `NOT NULL` | キャラクターの名前 |
| `personality_type` | `VARCHAR(50)` | `NOT NULL` | キャラクターの性格タイプ（例: 明るい、冷静） |
| `model_path` | `VARCHAR(255)`| `NOT NULL` | 3D モデルのパス |
| `display_size` | `INT` | `NOT NULL` (デフォルト値設定推奨) | キャラクターの表示サイズ |
| `volume` | `INT` | `NOT NULL` (デフォルト値設定推奨) | キャラクターの音声ボリューム |
| `response_speed` | `INT` | `NOT NULL` (デフォルト値設定推奨) | キャラクターの応答速度 |
| `created_at` | `TIMESTAMP WITH TIME ZONE` | `NOT NULL`, `DEFAULT NOW()` | レコード作成日時 (Supabase の自動更新機能を利用) |
| `updated_at` | `TIMESTAMP WITH TIME ZONE` | `NOT NULL`, `DEFAULT NOW()` | レコード更新日時 (Supabase の自動更新機能を利用) |

### 2.3. `conversations` テーブル

ユーザーとキャラクター間の対話ログを格納します。
| カラム名 | データ型 | 制約 | 説明 |
| :-------------- | :------------ | :--------------------------------------- | :------------------------------------- |
| `conversation_id` | `UUID` | `PRIMARY KEY` | 対話ログを一意に識別する ID |
| `character_id` | `UUID` | `FOREIGN KEY` (`characters.character_id`) | 対話したキャラクターの ID |
| `user_input` | `TEXT` | `NOT NULL` | ユーザーの入力テキストまたは音声入力のテキスト化 |
| `character_response`| `TEXT` | `NOT NULL` | キャラクターの応答テキスト |
| `user_emotion` | `VARCHAR(50)` | `NULLABLE` | ユーザーの感情（例: 喜び、怒り） |
| `timestamp` | `TIMESTAMP WITH TIME ZONE` | `NOT NULL`, `DEFAULT NOW()` | 対話が行われた日時 (Supabase の自動更新機能を利用) |

### 2.4. `memories` テーブル

キャラクターがユーザーに関する重要な情報を記憶するために使用します。
| カラム名 | データ型 | 制約 | 説明 |
| :------------- | :------------ | :-------------------------------------- | :------------------------------------- |
| `memory_id` | `UUID` | `PRIMARY KEY` | 記憶を一意に識別する ID |
| `character_id` | `UUID` | `FOREIGN KEY` (`characters.character_id`) | 記憶を持つキャラクターの ID |
| `topic` | `VARCHAR(255)`| `NOT NULL` | 記憶のトピック（例: ユーザーの好きな食べ物） |
| `content` | `TEXT` | `NOT NULL` | 記憶の内容 |
| `created_at` | `TIMESTAMP WITH TIME ZONE` | `NOT NULL`, `DEFAULT NOW()` | レコード作成日時 (Supabase の自動更新機能を利用) |
| `updated_at` | `TIMESTAMP WITH TIME ZONE` | `NOT NULL`, `DEFAULT NOW()` | レコード更新日時 (Supabase の自動更新機能を利用) |

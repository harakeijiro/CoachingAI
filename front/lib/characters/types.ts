/**
 * キャラクター管理の共通型定義
 * 全てのテーマ・キャラクターで使用される共通の型を定義
 */

/**
 * キャラクターの人格・設定定義
 * LLMプロンプト、UI表示、3Dモデル設定などを含む
 */
export interface CharacterPersonaConfig {
  /** システム内部ID (例: "mental-dog", "love-cat", "career-owl") */
  characterId: string;
  
  /** カテゴリ・目的 (例: "mental", "love", "career") */
  theme: string;
  
  /** ユーザーに名乗る/表示される名前 (例: "みずき") */
  name: string;
  
  /** キャラとしての見た目の年齢設定 */
  age: number;
  
  /** 性別設定 */
  gender: "female" | "male" | "other";
  
  /** UI用肩書き (例: "ワンちゃんコーチ") */
  roleLabel: string;

  /** GLBなど3Dモデルのパス */
  modelPath: string;
  
  /** 音声合成やボイスプリセットID */
  voiceId: string;
  
  /** 利用するアニメーション名 */
  animations: readonly string[];
  
  /** 初期ポーズ・待機状態 (例: "idle") */
  defaultPose: string;

  /** 
   * LLMに渡すべき「ふるまい・話し方・ルール」
   * ここには "どう接するか""どんな口調か" だけを書く
   * 性格、語尾、返答ルールなどを定義
   */
  personaCore: string;
}


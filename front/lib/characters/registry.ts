/**
 * キャラクターレジストリ
 * 選択中のキャラクターIDから設定を取得する
 */

import type { CharacterPersonaConfig } from "./types";
import { DogConfig } from "@/components/characters/mental/dog/config";

/**
 * 登録されている全キャラクターの設定
 */
const characterRegistry = new Map<string, CharacterPersonaConfig>([
  [DogConfig.characterId, DogConfig],
  // 今後、他のキャラクターも追加:
  // [CatConfig.characterId, CatConfig],
  // [OwlConfig.characterId, OwlConfig],
]);

/**
 * キャラクターIDから設定を取得
 * @param characterId キャラクターID (例: "mental-dog")
 * @returns キャラクター設定、見つからない場合はnull
 */
export function getCharacterConfig(
  characterId: string
): CharacterPersonaConfig | null {
  return characterRegistry.get(characterId) || null;
}

/**
 * 選択中のキャラクターIDを取得（localStorageから）
 * @returns キャラクターID、見つからない場合はデフォルトの"mental-dog"
 */
export function getSelectedCharacterId(): string {
  if (typeof window === "undefined") {
    return "mental-dog"; // サーバーサイドではデフォルトを返す
  }
  return (
    localStorage.getItem("coaching_ai_selected_character_id") || "mental-dog"
  );
}

/**
 * 選択中のキャラクター設定を取得
 * @returns キャラクター設定、見つからない場合は犬キャラクターの設定
 */
export function getSelectedCharacterConfig(): CharacterPersonaConfig {
  const characterId = getSelectedCharacterId();
  return getCharacterConfig(characterId) || DogConfig;
}

/**
 * 全キャラクターのID一覧を取得
 * @returns キャラクターIDの配列
 */
export function getAllCharacterIds(): string[] {
  return Array.from(characterRegistry.keys());
}

/**
 * テーマに紐づくキャラクターID一覧を取得
 * @param theme テーマ (例: "mental", "love", "career")
 * @returns 該当テーマのキャラクター挑戦IDの配列
 */
export function getCharacterIdsByTheme(theme: string): string[] {
  return Array.from(characterRegistry.values())
    .filter((config) => config.theme === theme)
    .map((config) => config.characterId);
}

/**
 * キャラクター設定をレジストリに登録（動的追加用）
 * 将来的にキャラクターを追加する際に使用
 */
export function registerCharacter(config: CharacterPersonaConfig): void {
  characterRegistry.set(config.characterId, config);
}


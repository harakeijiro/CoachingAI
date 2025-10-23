/**
 * キャラクター共通のエクスポート
 * 全キャラクターで使用される共通コンポーネントをエクスポート
 */

export { CharacterCanvas } from "./CharacterCanvas";
export { CharacterLighting } from "./CharacterLighting";

// 型定義のエクスポート
export type {
  Theme,
  CharacterId,
  BaseCharacterProps,
  AnimationState,
  VoiceState,
  BehaviorState,
  ModelRefs,
  CharacterConfig,
} from "./CharacterTypes";

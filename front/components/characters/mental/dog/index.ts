/**
 * 犬キャラクターの統合エクスポート
 * 各機能コンポーネントを統合してエクスポート
 */

export { Dog } from "./Dog";
export { DogModel } from "./DogModel";
export { DogAnimations } from "./DogAnimations";
export { DogVoice } from "./DogVoice";
export { DogBehavior } from "./DogBehavior";

// 型定義のエクスポート
export type {
  DogProps,
  DogAnimationState,
  DogVoiceState,
  DogBehaviorState,
  DogModelRefs,
  GLTFResult,
} from "./DogTypes";

// 設定のエクスポート
export { DogConfig } from "./config";
export type { CharacterPersonaConfig } from "@/lib/characters/types";

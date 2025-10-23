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
  DogConfig,
  GLTFResult,
} from "./DogTypes";

// 設定のエクスポート
export const DOG_CONFIG = {
  characterId: "mental-dog" as const,
  theme: "mental" as const,
  name: "ワンちゃんコーチ",
  modelPath: "/characters/mental/dog/dog_speak_after2.glb",
  voiceId: "dog-voice-001",
  animations: ["idle", "talking", "listening", "happy", "sad"],
  defaultPose: "idle",
} as const;

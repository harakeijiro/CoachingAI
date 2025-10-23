/**
 * キャラクター共通の型定義
 * 全キャラクターで使用される基本的な型を定義
 */

import * as THREE from "three";

// テーマ定義
export type Theme = "mental" | "love" | "career";

// キャラクターID定義
export type CharacterId = `${Theme}-${string}`;

// 基本的なキャラクタープロパティ
export interface BaseCharacterProps {
  position?: [number, number, number];
  scale?: number | [number, number, number];
  rotation?: [number, number, number];
}

// アニメーション状態
export interface AnimationState {
  isTalking: boolean;
  isListening: boolean;
  isIdle: boolean;
}

// 音声状態
export interface VoiceState {
  isSpeaking: boolean;
  isMuted: boolean;
  volume: number;
}

// 行動状態
export interface BehaviorState {
  isActive: boolean;
  currentAction?: string;
  mood?: "happy" | "neutral" | "sad" | "excited";
}

// 3Dモデル関連の型
export interface ModelRefs {
  groupRef: React.RefObject<THREE.Group>;
  meshRefs: Record<string, React.RefObject<THREE.SkinnedMesh>>;
}

// キャラクター設定
export interface CharacterConfig {
  characterId: CharacterId;
  theme: Theme;
  name: string;
  modelPath: string;
  voiceId?: string;
  animations: string[];
  defaultPose?: string;
}

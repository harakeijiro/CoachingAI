/**
 * 犬キャラクターの型定義
 * メンタルテーマの犬キャラクター固有の型を定義
 */

import React from "react";
import * as THREE from "three";
import { BaseCharacterProps, AnimationState, VoiceState, BehaviorState } from "../../shared/CharacterTypes";

// 犬キャラクター固有のプロパティ
export interface DogProps extends BaseCharacterProps {
  isTalking?: boolean;
  isListening?: boolean;
  mood?: "happy" | "neutral" | "sad" | "excited";
}

// 犬のアニメーション状態
export interface DogAnimationState extends AnimationState {
  tailWagging?: boolean;
  earMovement?: boolean;
}

// 犬の音声状態
export interface DogVoiceState extends VoiceState {
  barkIntensity?: number;
  whineLevel?: number;
}

// 犬の行動状態
export interface DogBehaviorState extends BehaviorState {
  tailWagging?: boolean;
  earPosition?: "up" | "down" | "side";
  sitting?: boolean;
  lying?: boolean;
}

// GLTF関連の型定義
type ActionName = "metarigAction" | "KeyAction.001" | "エンプティAction";

interface GLTFAction extends THREE.AnimationClip {
  name: ActionName;
}

export type GLTFResult = THREE.Object3D & {
  nodes: {
    立方体005: THREE.SkinnedMesh;
    立方体005_1: THREE.SkinnedMesh;
    立方体005_2: THREE.SkinnedMesh;
    立方体005_3: THREE.SkinnedMesh;
    立方体005_4: THREE.SkinnedMesh;
    立方体005_5: THREE.SkinnedMesh;
    立方体005_6: THREE.SkinnedMesh;
    立方体005_7: THREE.SkinnedMesh;
    Mouse: THREE.SkinnedMesh;
    Mouse_Inside: THREE.SkinnedMesh;
    平面: THREE.Mesh;
    spine: THREE.Bone;
  };
  materials: {
    ["マテリアル.004"]: THREE.MeshStandardMaterial;
    マテリアル_pink: THREE.MeshStandardMaterial;
    マテリアル_head: THREE.MeshStandardMaterial;
    ["マテリアル.001"]: THREE.MeshStandardMaterial;
    ["マテリアル.007"]: THREE.MeshStandardMaterial;
    ["マテリアル.003"]: THREE.MeshStandardMaterial;
    ["マテリアル.002"]: THREE.MeshStandardMaterial;
    Material_body: THREE.MeshStandardMaterial;
    ["マテリアル.013"]: THREE.MeshStandardMaterial;
  };
  animations: GLTFAction[];
};

// 犬の3Dモデル参照
export interface DogModelRefs {
  groupRef: React.RefObject<THREE.Group>;
  mouseRef: React.RefObject<THREE.SkinnedMesh>;
  mouseInsideRef: React.RefObject<THREE.SkinnedMesh>;
}

// 犬の設定
export interface DogConfig {
  characterId: "mental-dog";
  theme: "mental";
  name: "ワンちゃんコーチ";
  modelPath: "/characters/mental/dog/dog_speak_after2.glb";
  voiceId: "dog-voice-001";
  animations: ["idle", "talking", "listening", "happy", "sad"];
  defaultPose: "idle";
}

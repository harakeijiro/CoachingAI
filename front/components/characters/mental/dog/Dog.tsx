/**
 * 犬キャラクターの統合コンポーネント
 * 各機能（Model, Voice, Animations, Behavior）を統合
 */

import React, { useRef } from "react";
import { DogModel } from "./DogModel";
import { DogVoice } from "./DogVoice";
import { DogAnimations } from "./DogAnimations";
import { DogBehavior } from "./DogBehavior";
import { DogProps, DogModelRefs, DogVoiceState, DogAnimationState, DogBehaviorState } from "./DogTypes";

export function Dog({ isTalking, ...props }: DogProps) {
  // refsの初期化
  const refs: DogModelRefs = {
    groupRef: useRef<THREE.Group>(null!),
    mouseRef: useRef<THREE.SkinnedMesh>(null!),
    mouseInsideRef: useRef<THREE.SkinnedMesh>(null!),
  };

  // 状態の初期化
  const voiceState: DogVoiceState = {
    isSpeaking: isTalking || false,
    isMuted: false,
    volume: 1.0,
  };

  const animationState: DogAnimationState = {
    isTalking: isTalking || false,
    isListening: false,
    isIdle: !isTalking,
  };

  const behaviorState: DogBehaviorState = {
    isActive: true,
    currentAction: isTalking ? "talking" : "idle",
    mood: "happy",
  };

  return (
    <>
      {/* 3Dモデル */}
      <DogModel refs={refs} {...props} />
      
      {/* 音声機能（口パクアニメーション） */}
      <DogVoice voiceState={voiceState} refs={refs} />
      
      {/* アニメーション */}
      <DogAnimations animationState={animationState} refs={refs} />
      
      {/* 行動制御 */}
      <DogBehavior behaviorState={behaviorState} refs={refs} />
    </>
  );
}

/**
 * 犬キャラクターのアニメーションコンポーネント
 * ボディアニメーション、ポーズ制御を担当
 */

import React from "react";
import { useFrame } from "@react-three/fiber";
import { DogAnimationState, DogModelRefs } from "./DogTypes";

interface DogAnimationsProps {
  animationState: DogAnimationState;
  refs: DogModelRefs;
}

export function DogAnimations({ animationState, refs }: DogAnimationsProps) {
  // TODO: 既存のDog.tsxからアニメーション部分を移行
  // - useAnimations
  // - ボディアニメーション制御
  // - ポーズ制御
  
  useFrame((state) => {
    // TODO: アニメーション制御ロジックを移行
    // - アイドルアニメーション
    // - 話している時のアニメーション
    // - 聞いている時のアニメーション
  });

  return null; // アニメーションはrefsを通じて制御
}

/**
 * 犬キャラクターの行動制御コンポーネント
 * キャラクター固有の行動、反応を担当
 */

import React from "react";
import { useFrame } from "@react-three/fiber";
import { DogBehaviorState, DogModelRefs } from "./DogTypes";

interface DogBehaviorProps {
  behaviorState: DogBehaviorState;
  refs: DogModelRefs;
}

export function DogBehavior({ behaviorState, refs }: DogBehaviorProps) {
  // TODO: 犬キャラクター固有の行動制御を実装
  // - しっぽ振り
  // - 耳の動き
  // - 座る・寝るなどのポーズ
  // - 感情表現
  
  useFrame((state) => {
    // TODO: 行動制御ロジックを実装
    // - しっぽ振りアニメーション
    // - 耳の動き
    // - 感情に応じたポーズ
    // - ユーザーの行動に対する反応
  });

  return null; // 行動制御はrefsを通じて制御
}

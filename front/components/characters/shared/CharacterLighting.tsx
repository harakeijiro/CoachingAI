/**
 * キャラクター共通のライティング設定
 * キャラクター表示用のライティングを担当
 */

import React from "react";

interface CharacterLightingProps {
  ambientIntensity?: number;
  directionalIntensity?: number;
  directionalPosition?: [number, number, number];
  directionalPosition2?: [number, number, number];
}

export function CharacterLighting({
  ambientIntensity = 0.5,
  directionalIntensity = 1,
  directionalPosition = [5, 5, 5],
  directionalPosition2 = [-5, 5, -5],
}: CharacterLightingProps) {
  return (
    <>
      {/* 環境光 */}
      <ambientLight intensity={ambientIntensity} />
      
      {/* メインライト */}
      <directionalLight 
        position={directionalPosition} 
        intensity={directionalIntensity} 
      />
      
      {/* サブライト */}
      <directionalLight 
        position={directionalPosition2} 
        intensity={directionalIntensity * 0.5} 
      />
    </>
  );
}

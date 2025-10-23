/**
 * キャラクター共通の3D表示設定
 * Canvas、ライティング、環境設定を担当
 */

import React from "react";
import { Canvas } from "@react-three/fiber";
import { Environment } from "@react-three/drei";

interface CharacterCanvasProps {
  children: React.ReactNode;
  camera?: {
    position?: [number, number, number];
    fov?: number;
  };
  lighting?: {
    ambientIntensity?: number;
    directionalIntensity?: number;
  };
}

export function CharacterCanvas({ 
  children, 
  camera = { position: [0, 0, 3.5], fov: 40 },
  lighting = { ambientIntensity: 0.5, directionalIntensity: 1 }
}: CharacterCanvasProps) {
  return (
    <Canvas camera={camera}>
      {/* 環境光 */}
      <ambientLight intensity={lighting.ambientIntensity} />
      
      {/* 指向性ライト */}
      <directionalLight 
        position={[5, 5, 5]} 
        intensity={lighting.directionalIntensity} 
      />
      <directionalLight 
        position={[-5, 5, -5]} 
        intensity={lighting.directionalIntensity * 0.5} 
      />
      
      {/* 環境設定 */}
      <Environment preset="sunset" />
      
      {/* キャラクターコンテンツ */}
      {children}
    </Canvas>
  );
}

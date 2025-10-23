/**
 * 犬キャラクターの3Dモデルコンポーネント
 * GLTF読み込み、基本表示、マテリアル設定を担当
 */

import React, { useRef, useMemo } from "react";
import { useFrame, useGraph } from "@react-three/fiber";
import { useGLTF, useAnimations } from "@react-three/drei";
import { SkeletonUtils } from "three-stdlib";
import { DogProps, DogModelRefs, GLTFResult } from "./DogTypes";

interface DogModelComponentProps extends DogProps {
  refs: DogModelRefs;
}

export function DogModel({ refs, ...props }: DogModelComponentProps) {
  const { scene, animations } = useGLTF("/characters/mental/dog/dog_speak_after2.glb");
  const clone = useMemo(() => SkeletonUtils.clone(scene), [scene]);
  const { nodes, materials } = useGraph(clone) as unknown as GLTFResult;
  useAnimations(animations, refs.groupRef);

  return (
    <group ref={refs.groupRef} {...props} dispose={null}>
      <group name="Scene">
        <group name="metarig">
          <primitive object={nodes.spine} />
          <group name="Body">
            <skinnedMesh
              name="立方体005"
              geometry={nodes.立方体005.geometry}
              material={materials["マテリアル.004"]}
              skeleton={nodes.立方体005.skeleton}
            />
            <skinnedMesh
              name="立方体005_1"
              geometry={nodes.立方体005_1.geometry}
              material={materials.マテリアル_pink}
              skeleton={nodes.立方体005_1.skeleton}
            />
            <skinnedMesh
              name="立方体005_2"
              geometry={nodes.立方体005_2.geometry}
              material={materials.マテリアル_head}
              skeleton={nodes.立方体005_2.skeleton}
            />
            <skinnedMesh
              name="立方体005_3"
              geometry={nodes.立方体005_3.geometry}
              material={materials["マテリアル.001"]}
              skeleton={nodes.立方体005_3.skeleton}
            />
            <skinnedMesh
              name="立方体005_4"
              geometry={nodes.立方体005_4.geometry}
              material={materials["マテリアル.007"]}
              skeleton={nodes.立方体005_4.skeleton}
            />
            <skinnedMesh
              name="立方体005_5"
              geometry={nodes.立方体005_5.geometry}
              material={materials["マテリアル.003"]}
              skeleton={nodes.立方体005_5.skeleton}
            />
            <skinnedMesh
              name="立方体005_6"
              geometry={nodes.立方体005_6.geometry}
              material={materials["マテリアル.002"]}
              skeleton={nodes.立方体005_6.skeleton}
            />
            <skinnedMesh
              name="立方体005_7"
              geometry={nodes.立方体005_7.geometry}
              material={materials.Material_body}
              skeleton={nodes.立方体005_7.skeleton}
            />
          </group>
          <skinnedMesh
            ref={refs.mouseRef}
            name="Mouse"
            geometry={nodes.Mouse.geometry}
            material={materials.Material_body}
            skeleton={nodes.Mouse.skeleton}
            morphTargetDictionary={nodes.Mouse.morphTargetDictionary}
            morphTargetInfluences={nodes.Mouse.morphTargetInfluences}
          />
          <skinnedMesh
            ref={refs.mouseInsideRef}
            name="Mouse_Inside"
            geometry={nodes.Mouse_Inside.geometry}
            material={materials.マテリアル_pink}
            skeleton={nodes.Mouse_Inside.skeleton}
            morphTargetDictionary={nodes.Mouse_Inside.morphTargetDictionary}
            morphTargetInfluences={nodes.Mouse_Inside.morphTargetInfluences}
          />
        </group>
        <group
          name="エンプティ"
          position={[0, 2.219, 0]}
          rotation={[0, -0.417, 0]}
        />
        <mesh
          name="平面"
          geometry={nodes.平面.geometry}
          material={materials["マテリアル.013"]}
          position={[0, 0, 5.615]}
          scale={11.272}
        />
      </group>
    </group>
  );
}

// GLTFプリロード
useGLTF.preload("/characters/mental/dog/dog_speak_after2.glb");

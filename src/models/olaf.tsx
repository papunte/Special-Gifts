import { useGLTF } from "@react-three/drei";
import type { ThreeElements } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import type { Group, Mesh } from "three";
import * as THREE from "three";

type OlafProps = ThreeElements["group"];

export function OlafModel({ children, ...props }: OlafProps) {
  const { scene } = useGLTF("/models/olaf-q.glb");
  const groupRef = useRef<Group>(null);

  const clonedScene = useMemo(() => {
    const cloned = scene.clone(true);
    cloned.traverse((node) => {
      if (node instanceof THREE.Mesh) {
        node.castShadow = true;
        node.receiveShadow = true;
        if (node.material) {
          node.material.side = THREE.DoubleSide;
        }
      }
    });
    return cloned;
  }, [scene]);

  useEffect(() => {
    return () => {
      clonedScene.traverse((node) => {
        if ((node as Mesh).geometry) {
          (node as Mesh).geometry.dispose();
        }
      });
    };
  }, [clonedScene]);

  return (
    <group ref={groupRef} {...props}>
      <primitive object={clonedScene} />
      {children}
    </group>
  );
}

useGLTF.preload("/models/olaf-q.glb");
export default OlafModel;

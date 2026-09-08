import { useGLTF } from "@react-three/drei";
import type { ThreeElements } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import type { Group } from "three";
import * as THREE from "three";

type CakeProps = ThreeElements["group"] & {
  text?: string;
};

export function CakeModel({
  text = "Happy Birthday Nano, enjoyed your 19th",
  children,
  ...props
}: CakeProps) {
  const { scene } = useGLTF("/models/cake-q.glb");
  const groupRef = useRef<Group>(null);

  // Dynamic canvas texture with elegant typography and gold/white shimmer
  const textTexture = useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 2048;
    canvas.height = 512;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      // Soft frosty background glow with transparent gradient
      const grad = ctx.createLinearGradient(0, 0, canvas.width, 0);
      grad.addColorStop(0, "rgba(74, 144, 226, 0.0)");
      grad.addColorStop(0.2, "rgba(74, 144, 226, 0.75)");
      grad.addColorStop(0.5, "rgba(255, 255, 255, 0.95)");
      grad.addColorStop(0.8, "rgba(74, 144, 226, 0.75)");
      grad.addColorStop(1, "rgba(74, 144, 226, 0.0)");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 160, canvas.width, 192);

      // Gold & white typography
      ctx.shadowColor = "rgba(0, 0, 0, 0.6)";
      ctx.shadowBlur = 12;
      ctx.shadowOffsetX = 2;
      ctx.shadowOffsetY = 4;

      ctx.font = "bold 64px 'Georgia', 'Playfair Display', serif";
      ctx.fillStyle = "#1b355a";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(text, canvas.width / 2, canvas.height / 2);

      // Inner gold highlight
      ctx.shadowBlur = 0;
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = "#FFD700";
      ctx.strokeText(text, canvas.width / 2, canvas.height / 2);
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
    return texture;
  }, [text]);

  const clonedScene = useMemo(() => {
    const cloned = scene.clone(true);

    // High quality PBR Blue Frosting Materials matching Frozen theme & Cakes.png
    const blueFrostingMaterial = new THREE.MeshStandardMaterial({
      color: new THREE.Color("#4A90E2"),
      roughness: 0.65,
      metalness: 0.08,
      side: THREE.DoubleSide,
    });

    const skyBlueTrimMaterial = new THREE.MeshStandardMaterial({
      color: new THREE.Color("#87CEEB"),
      roughness: 0.5,
      metalness: 0.12,
      side: THREE.DoubleSide,
    });

    const whitePearlMaterial = new THREE.MeshStandardMaterial({
      color: new THREE.Color("#FFFFFF"),
      roughness: 0.2,
      metalness: 0.3,
      side: THREE.DoubleSide,
    });

    let meshIndex = 0;
    cloned.traverse((node) => {
      if (node instanceof THREE.Mesh) {
        node.castShadow = true;
        node.receiveShadow = true;

        const nameLower = node.name.toLowerCase();
        if (nameLower.includes("pearl") || nameLower.includes("bead") || nameLower.includes("white")) {
          node.material = whitePearlMaterial;
        } else if (nameLower.includes("trim") || nameLower.includes("ring") || nameLower.includes("plate")) {
          node.material = skyBlueTrimMaterial;
        } else {
          // Tier body meshes
          if (meshIndex % 2 === 1) {
            node.material = new THREE.MeshStandardMaterial({
              color: new THREE.Color("#3A7BC8"),
              roughness: 0.6,
              metalness: 0.06,
              side: THREE.DoubleSide,
            });
          } else {
            node.material = blueFrostingMaterial;
          }
        }
        meshIndex++;
      }
    });

    return cloned;
  }, [scene]);

  // Procedural sunflower & pearl decorations positioned around tiers
  const decorations = useMemo(() => {
    const sunflowers = [];
    const pearls = [];

    // Sunflower tier 1 (mid tier)
    const tier1Radius = 0.85;
    const tier1Height = 0.45;
    const countTier1 = 6;
    for (let i = 0; i < countTier1; i++) {
      const angle = (i / countTier1) * Math.PI * 2;
      sunflowers.push({
        position: [
          Math.cos(angle) * tier1Radius,
          tier1Height,
          Math.sin(angle) * tier1Radius,
        ] as [number, number, number],
        rotation: [0, -angle - Math.PI / 2, 0] as [number, number, number],
        scale: 0.18,
      });
    }

    // Sunflower tier 2 (lower tier)
    const tier2Radius = 1.15;
    const tier2Height = 0.15;
    const countTier2 = 8;
    for (let i = 0; i < countTier2; i++) {
      const angle = (i / countTier2) * Math.PI * 2 + Math.PI / 8;
      sunflowers.push({
        position: [
          Math.cos(angle) * tier2Radius,
          tier2Height,
          Math.sin(angle) * tier2Radius,
        ] as [number, number, number],
        rotation: [0, -angle - Math.PI / 2, 0] as [number, number, number],
        scale: 0.22,
      });
    }

    // White pearls scalloped around base
    const pearlCount = 32;
    const baseRadius = 1.25;
    for (let i = 0; i < pearlCount; i++) {
      const angle = (i / pearlCount) * Math.PI * 2;
      pearls.push([
        Math.cos(angle) * baseRadius,
        0.04,
        Math.sin(angle) * baseRadius,
      ] as [number, number, number]);
    }

    return { sunflowers, pearls };
  }, []);

  useEffect(() => {
    return () => {
      textTexture.dispose();
      clonedScene.traverse((node) => {
        if ((node as THREE.Mesh).geometry) {
          (node as THREE.Mesh).geometry.dispose();
        }
      });
    };
  }, [clonedScene, textTexture]);

  return (
    <group ref={groupRef} {...props}>
      <primitive object={clonedScene} />

      {/* Text Ribbon around bottom tier */}
      <mesh position={[0, 0.22, 0]} rotation={[0, Math.PI * 0.75, 0]}>
        <cylinderGeometry args={[1.18, 1.18, 0.26, 64, 1, true]} />
        <meshStandardMaterial
          map={textTexture}
          transparent
          opacity={0.96}
          side={THREE.DoubleSide}
          roughness={0.4}
        />
      </mesh>

      {/* Decorative Sunflowers */}
      {decorations.sunflowers.map((s, idx) => (
        <group key={`sunflower-${idx}`} position={s.position} rotation={s.rotation} scale={s.scale}>
          {/* Flower Center */}
          <mesh position={[0, 0, 0.02]}>
            <cylinderGeometry args={[0.22, 0.22, 0.08, 16]} />
            <meshStandardMaterial color="#5C3317" roughness={0.9} />
          </mesh>
          {/* Yellow Petals Ring */}
          {Array.from({ length: 12 }).map((_, pIdx) => {
            const pAngle = (pIdx / 12) * Math.PI * 2;
            return (
              <mesh
                key={`petal-${pIdx}`}
                position={[Math.cos(pAngle) * 0.32, Math.sin(pAngle) * 0.32, 0]}
                rotation={[0, 0, pAngle]}
              >
                <coneGeometry args={[0.09, 0.35, 8]} />
                <meshStandardMaterial color="#FFD700" roughness={0.5} />
              </mesh>
            );
          })}
        </group>
      ))}

      {/* Decorative White Frosting Pearls */}
      {decorations.pearls.map((pos, idx) => (
        <mesh key={`pearl-${idx}`} position={pos}>
          <sphereGeometry args={[0.035, 12, 12]} />
          <meshStandardMaterial color="#FFFFFF" roughness={0.2} metalness={0.3} />
        </mesh>
      ))}

      {children}
    </group>
  );
}

useGLTF.preload("/models/cake-q.glb");
export { CakeModel as Cake };
export default CakeModel;

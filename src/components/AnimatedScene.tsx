import { useFrame } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import type { Group } from "three";
import { Candle } from "../models/candle";
import { CakeModel } from "../models/cake";
import { OlafModel } from "../models/olaf";
import { Table } from "../models/table";
import { PictureFrame } from "../models/pictureFrame";
import { BirthdayCard } from "./BirthdayCard";

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

const lerp = (from: number, to: number, t: number) => from + (to - from) * t;

const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

export type BirthdayCardConfig = {
  id: string;
  image: string;
  position: [number, number, number];
  rotation: [number, number, number];
};

export type AnimatedSceneProps = {
  isPlaying: boolean;
  onBackgroundFadeChange?: (opacity: number) => void;
  onEnvironmentProgressChange?: (progress: number) => void;
  candleLit: boolean;
  onAnimationComplete?: () => void;
  cards: ReadonlyArray<BirthdayCardConfig>;
  activeCardId: string | null;
  onToggleCard: (id: string) => void;
};

// ─── Animation Timings ───────────────────────────────────────────
// Cake descends from above (0s → 3.5s)
const CAKE_START_Y = 5;
const CAKE_END_Y = 0;
const CAKE_DESCENT_DURATION = 3.5;

// Table slides in from behind (1.5s → 3.5s)
const TABLE_START_Z = 8;
const TABLE_END_Z = 0;
const TABLE_SLIDE_DURATION = 2.0;
const TABLE_SLIDE_START = 1.5;

// Candle drops from above (5.0s → 6.2s)
const CANDLE_START_Y = 4;
const CANDLE_END_Y = 0;
const CANDLE_DROP_DURATION = 1.2;
const CANDLE_DROP_START = 5.0;

// Olaf walks in position alongside cake descent
const OLAF_END_POSITION: [number, number, number] = [1.2, 0, 0.8];

// Environment fade (9.8s → 10.5s)
const BACKGROUND_FADE_DURATION = 0.7;
const BACKGROUND_FADE_START = 9.8;
const FULL_SCENE_DURATION = BACKGROUND_FADE_START + BACKGROUND_FADE_DURATION;

export function AnimatedScene({
  isPlaying,
  onBackgroundFadeChange,
  onEnvironmentProgressChange,
  candleLit,
  onAnimationComplete,
  cards,
  activeCardId,
  onToggleCard,
}: AnimatedSceneProps) {
  const cakeGroup = useRef<Group>(null);
  const olafGroup = useRef<Group>(null);
  const tableGroup = useRef<Group>(null);
  const candleGroup = useRef<Group>(null);
  const animationStartRef = useRef<number | null>(null);
  const hasPrimedRef = useRef(false);
  const hasCompletedRef = useRef(false);
  const completionNotifiedRef = useRef(false);
  const backgroundOpacityRef = useRef(1);
  const environmentProgressRef = useRef(0);

  useEffect(() => {
    onBackgroundFadeChange?.(backgroundOpacityRef.current);
    onEnvironmentProgressChange?.(environmentProgressRef.current);
  }, [onBackgroundFadeChange, onEnvironmentProgressChange]);

  const emitBackgroundOpacity = (value: number) => {
    const clamped = clamp(value, 0, 1);
    if (Math.abs(clamped - backgroundOpacityRef.current) > 0.005) {
      backgroundOpacityRef.current = clamped;
      onBackgroundFadeChange?.(clamped);
    }
  };

  const emitEnvironmentProgress = (value: number) => {
    const clamped = clamp(value, 0, 1);
    if (Math.abs(clamped - environmentProgressRef.current) > 0.005) {
      environmentProgressRef.current = clamped;
      onEnvironmentProgressChange?.(clamped);
    }
  };

  useFrame(({ clock }) => {
    const cake = cakeGroup.current;
    const olaf = olafGroup.current;
    const table = tableGroup.current;
    const candle = candleGroup.current;

    if (!cake || !table || !candle || !olaf) {
      return;
    }

    if (!hasPrimedRef.current) {
      cake.position.set(0, CAKE_START_Y, 0);
      cake.rotation.set(0, 0, 0);
      olaf.position.set(OLAF_END_POSITION[0], CAKE_START_Y + 0.1, OLAF_END_POSITION[2]);
      olaf.rotation.set(0, -0.4, 0);
      table.position.set(0, 0, TABLE_START_Z);
      table.rotation.set(0, 0, 0);
      candle.position.set(0, CANDLE_START_Y, 0);
      candle.visible = false;
      hasPrimedRef.current = true;
    }

    if (!isPlaying) {
      emitBackgroundOpacity(1);
      emitEnvironmentProgress(0);
      animationStartRef.current = null;
      hasCompletedRef.current = false;
      completionNotifiedRef.current = false;
      return;
    }

    if (hasCompletedRef.current) {
      emitBackgroundOpacity(0);
      emitEnvironmentProgress(1);
      if (!completionNotifiedRef.current) {
        completionNotifiedRef.current = true;
        onAnimationComplete?.();
      }
      return;
    }

    if (animationStartRef.current === null) {
      animationStartRef.current = clock.elapsedTime;
    }

    const elapsed = clock.elapsedTime - animationStartRef.current;
    const clampedElapsed = clamp(elapsed, 0, FULL_SCENE_DURATION);

    // ─── Cake Descent + Rotation (0 → 3.5s) ───────────────────
    const cakeProgress = clamp(clampedElapsed / CAKE_DESCENT_DURATION, 0, 1);
    const cakeEase = easeOutCubic(cakeProgress);

    cake.position.y = lerp(CAKE_START_Y, CAKE_END_Y, cakeEase);
    cake.position.x = 0;
    cake.position.z = 0;
    cake.rotation.y = cakeEase * Math.PI * 2;

    // ─── Olaf alongside cake (descends to front of table) ──────
    olaf.position.y = lerp(CAKE_START_Y + 0.1, OLAF_END_POSITION[1], cakeEase);
    olaf.position.x = OLAF_END_POSITION[0];
    olaf.position.z = OLAF_END_POSITION[2];
    olaf.rotation.y = -0.4 + cakeEase * Math.PI * 2;

    // ─── Table slide in (1.5s → 3.5s) ──────────────────────────
    let tableZ = TABLE_START_Z;
    if (clampedElapsed >= TABLE_SLIDE_START) {
      const tableProgress = clamp(
        (clampedElapsed - TABLE_SLIDE_START) / TABLE_SLIDE_DURATION,
        0,
        1
      );
      const tableEase = easeOutCubic(tableProgress);
      tableZ = lerp(TABLE_START_Z, TABLE_END_Z, tableEase);
    }
    table.position.set(0, 0, tableZ);

    // ─── Candle drop (5.0s → 6.2s) ─────────────────────────────
    if (clampedElapsed >= CANDLE_DROP_START) {
      if (!candle.visible) {
        candle.visible = true;
      }
      const candleProgress = clamp(
        (clampedElapsed - CANDLE_DROP_START) / CANDLE_DROP_DURATION,
        0,
        1
      );
      const candleEase = easeOutCubic(candleProgress);
      candle.position.y = lerp(CANDLE_START_Y, CANDLE_END_Y, candleEase);
    } else {
      candle.visible = false;
      candle.position.set(0, CANDLE_START_Y, 0);
    }

    // ─── Background / Environment fade (9.8s → 10.5s) ──────────
    if (clampedElapsed < BACKGROUND_FADE_START) {
      emitBackgroundOpacity(1);
      emitEnvironmentProgress(0);
    } else {
      const fadeProgress = clamp(
        (clampedElapsed - BACKGROUND_FADE_START) / BACKGROUND_FADE_DURATION,
        0,
        1
      );
      const eased = easeOutCubic(fadeProgress);
      const bgOpacity = 1 - eased;
      emitBackgroundOpacity(bgOpacity);
      emitEnvironmentProgress(1 - bgOpacity);
    }

    const animationDone = clampedElapsed >= FULL_SCENE_DURATION;
    if (animationDone) {
      cake.position.set(0, CAKE_END_Y, 0);
      cake.rotation.set(0, 0, 0);
      olaf.position.set(OLAF_END_POSITION[0], OLAF_END_POSITION[1], OLAF_END_POSITION[2]);
      olaf.rotation.set(0, -0.4, 0);
      table.position.set(0, 0, TABLE_END_Z);
      candle.position.set(0, CANDLE_END_Y, 0);
      candle.visible = true;
      emitBackgroundOpacity(0);
      emitEnvironmentProgress(1);
      hasCompletedRef.current = true;
      if (!completionNotifiedRef.current) {
        completionNotifiedRef.current = true;
        onAnimationComplete?.();
      }
    }
  });

  return (
    <>
      {/* Table & Tabletop Accessories */}
      <group ref={tableGroup}>
        <Table />
        <PictureFrame
          image="/assets/frame2.jpg"
          position={[0, 0.735, 3]}
          rotation={[0, 5.6, 0]}
          scale={0.75}
        />
        <PictureFrame
          image="/assets/frame3.jpg"
          position={[0, 0.735, -3]}
          rotation={[0, 4.0, 0]}
          scale={0.75}
        />
        <PictureFrame
          image="/assets/frame4.jpg"
          position={[-1.5, 0.735, 2.5]}
          rotation={[0, 5.4, 0]}
          scale={0.75}
        />
        <PictureFrame
          image="/assets/frame1.jpg"
          position={[-1.5, 0.735, -2.5]}
          rotation={[0, 4.2, 0]}
          scale={0.75}
        />
        {cards.map((card) => (
          <BirthdayCard
            key={card.id}
            id={card.id}
            image={card.image}
            tablePosition={card.position}
            tableRotation={card.rotation}
            isActive={activeCardId === card.id}
            onToggle={onToggleCard}
          />
        ))}
      </group>

      {/* Olaf 3D Character Model — positioned IN FRONT of table */}
      <group ref={olafGroup}>
        <OlafModel scale={0.55} />
      </group>

      {/* Decorated Frozen Cake — scaled down for proper proportion */}
      <group ref={cakeGroup}>
        <CakeModel scale={0.45} />
      </group>

      {/* Candle Model */}
      <group ref={candleGroup}>
        <Candle isLit={candleLit} scale={0.25} position={[0, 1.1, 0]} />
      </group>
    </>
  );
}

export default AnimatedScene;

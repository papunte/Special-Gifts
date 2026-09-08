import { Canvas, useThree } from "@react-three/fiber";
import { Environment, OrbitControls } from "@react-three/drei";
import {
  Suspense,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { Vector3 } from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import { Fireworks } from "./components/Fireworks";
import type { BirthdayCardConfig } from "./components/AnimatedScene";
import { AnimatedScene } from "./components/AnimatedScene";
import { AccessGatePage } from "./components/AccessGatePage";
import { ScrollTriggerSequence } from "./components/ScrollTriggerSequence";
import { LauncherBalloons } from "./components/LauncherBalloons";
import { Volume2, VolumeX, RotateCcw, Sparkles } from "lucide-react";
import "./App.css";

type Phase = "gate" | "scroll" | "3d";

const ORBIT_TARGET = new Vector3(0, 1, 0);
const ORBIT_INITIAL_RADIUS = 3.2;
const ORBIT_INITIAL_HEIGHT = 1.1;
const ORBIT_INITIAL_AZIMUTH = Math.PI / 2.2;
const ORBIT_MIN_DISTANCE = 1.8;
const ORBIT_MAX_DISTANCE = 8;
const ORBIT_MIN_POLAR = Math.PI * 0.05;
const ORBIT_MAX_POLAR = Math.PI / 2.05;

const BIRTHDAY_CARDS: ReadonlyArray<BirthdayCardConfig> = [
  {
    id: "confetti",
    image: "/assets/cards.png",
    position: [1.1, 0.081, -1.8],
    rotation: [-Math.PI / 2, 0, Math.PI / 3],
  },
];

function ConfiguredOrbitControls({ enabled = true }: { enabled?: boolean }) {
  const controlsRef = useRef<OrbitControlsImpl>(null);
  const camera = useThree((state) => state.camera);

  useEffect(() => {
    const offset = new Vector3(
      Math.sin(ORBIT_INITIAL_AZIMUTH) * ORBIT_INITIAL_RADIUS,
      ORBIT_INITIAL_HEIGHT,
      Math.cos(ORBIT_INITIAL_AZIMUTH) * ORBIT_INITIAL_RADIUS
    );
    const cameraPosition = ORBIT_TARGET.clone().add(offset);
    camera.position.copy(cameraPosition);
    camera.lookAt(ORBIT_TARGET);

    const controls = controlsRef.current;
    if (controls) {
      controls.target.copy(ORBIT_TARGET);
      controls.update();
    }
  }, [camera]);

  return (
    <OrbitControls
      ref={controlsRef}
      enabled={enabled}
      enableDamping
      dampingFactor={0.05}
      minDistance={ORBIT_MIN_DISTANCE}
      maxDistance={ORBIT_MAX_DISTANCE}
      minPolarAngle={ORBIT_MIN_POLAR}
      maxPolarAngle={ORBIT_MAX_POLAR}
    />
  );
}

type EnvironmentBackgroundControllerProps = {
  intensity: number;
};

function EnvironmentBackgroundController({
  intensity,
}: EnvironmentBackgroundControllerProps) {
  const scene = useThree((state) => state.scene);

  useEffect(() => {
    if ("backgroundIntensity" in scene) {
      (scene as typeof scene & { backgroundIntensity: number }).backgroundIntensity =
        intensity;
    }
  }, [scene, intensity]);

  return null;
}

export default function App() {
  const [currentPhase, setCurrentPhase] = useState<Phase>("gate");
  const [isBoxOpened, setIsBoxOpened] = useState(false);
  const [environmentProgress, setEnvironmentProgress] = useState(0);
  const [hasAnimationCompleted, setHasAnimationCompleted] = useState(false);
  const [isCandleLit, setIsCandleLit] = useState(true);
  const [fireworksActive, setFireworksActive] = useState(false);
  const [activeCardId, setActiveCardId] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(false);

  const backgroundAudioRef = useRef<HTMLAudioElement | null>(null);

  // Audio setup
  useEffect(() => {
    const audio = new Audio("/assets/palace.mp3");
    audio.loop = true;
    audio.volume = 0.6;
    audio.preload = "auto";
    backgroundAudioRef.current = audio;

    return () => {
      audio.pause();
      backgroundAudioRef.current = null;
    };
  }, []);

  const playBackgroundMusic = useCallback(() => {
    const audio = backgroundAudioRef.current;
    if (!audio) return;
    audio.muted = isMuted;
    if (audio.paused) {
      void audio.play().catch(() => {
        // Autoplay policy fallback
      });
    }
  }, [isMuted]);

  const toggleMute = useCallback(() => {
    setIsMuted((prev) => {
      const next = !prev;
      if (backgroundAudioRef.current) {
        backgroundAudioRef.current.muted = next;
      }
      return next;
    });
  }, []);

  // Handler when "Open The Box" is clicked on Gate page
  const handleBoxOpen = useCallback(() => {
    setIsBoxOpened(true);
    setCurrentPhase("scroll");
    playBackgroundMusic();
  }, [playBackgroundMusic]);

  // Handler when frame sequence unboxing completes
  const handleSequenceComplete = useCallback(() => {
    setCurrentPhase("3d");
  }, []);

  // Blow candle action
  const blowOutCandle = useCallback(() => {
    if (hasAnimationCompleted && isCandleLit) {
      setIsCandleLit(false);
      setFireworksActive(true);
    }
  }, [hasAnimationCompleted, isCandleLit]);

  // Keyboard space key interaction
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.code === "Space" || event.key === " ") {
        event.preventDefault();
        if (currentPhase === "gate") {
          handleBoxOpen();
        } else if (currentPhase === "3d") {
          blowOutCandle();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentPhase, handleBoxOpen, blowOutCandle]);

  const handleCardToggle = useCallback((id: string) => {
    setActiveCardId((current) => (current === id ? null : id));
  }, []);

  const resetToGate = useCallback(() => {
    setCurrentPhase("gate");
    setIsBoxOpened(false);
    setHasAnimationCompleted(false);
    setIsCandleLit(true);
    setFireworksActive(false);
    setActiveCardId(null);
    setEnvironmentProgress(0);
  }, []);

  return (
    <div className="App relative w-full min-h-screen bg-black text-white select-none">
      {/* Global Audio Toggle Button */}
      <button
        onClick={toggleMute}
        className="fixed top-4 right-4 z-50 p-2.5 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-md border border-white/20 text-cyan-200 hover:text-white shadow-[0_0_15px_rgba(0,0,0,0.5)] transition-all active:scale-90"
        title={isMuted ? "Unmute Music" : "Mute Music"}
      >
        {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
      </button>

      {/* PHASE 1: Access Gate Page */}
      {currentPhase === "gate" && (
        <AccessGatePage
          isBoxOpened={isBoxOpened}
          onBoxOpen={handleBoxOpen}
        />
      )}

      {/* PHASE 2: 4K Frame Sequence Scroll Unboxing */}
      {currentPhase === "scroll" && (
        <ScrollTriggerSequence
          frameBasePath="/sequences/Unboxing/"
          totalFrames={300}
          onSequenceComplete={handleSequenceComplete}
        />
      )}

      {/* PHASE 3: 3D Frozen Alpine Graphics Scene */}
      {currentPhase === "3d" && (
        <div className="relative w-screen h-screen overflow-hidden">
          {/* Top Control Bar in 3D Mode */}
          <div className="absolute top-4 left-4 z-40 flex items-center gap-2 pointer-events-auto">
            <button
              onClick={resetToGate}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-black/40 hover:bg-black/60 backdrop-blur-md border border-white/20 text-xs font-semibold text-cyan-200 transition-all active:scale-95"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Restart Experience</span>
            </button>
            <LauncherBalloons buttonText="Balloons 🎈" className="scale-90 origin-left" />
          </div>

          {/* Candle Blow Hint Overlay */}
          {hasAnimationCompleted && isCandleLit && (
            <div
              className="hint-overlay flex items-center gap-2 px-6 py-3 rounded-full bg-black/60 backdrop-blur-md border border-cyan-400/30 text-cyan-100 shadow-[0_0_30px_rgba(124,199,251,0.4)] transition-all hover:scale-105 active:scale-95"
              onClick={blowOutCandle}
            >
              <Sparkles className="w-5 h-5 text-amber-300 animate-spin" style={{ animationDuration: "5s" }} />
              <span className="text-xs md:text-sm tracking-widest font-semibold uppercase">
                Press Space or Click to Blow the Candle 🎂
              </span>
              <Sparkles className="w-5 h-5 text-amber-300 animate-spin" style={{ animationDuration: "5s" }} />
            </div>
          )}

          {/* 3D WebGL Canvas */}
          <Canvas
            gl={{ alpha: true, antialias: true }}
            camera={{ position: [0, 1.1, 3.2], fov: 45 }}
            style={{ background: "transparent" }}
            onCreated={({ gl }) => {
              gl.setClearColor("#000000", 0);
            }}
          >
            <Suspense fallback={null}>
              <AnimatedScene
                isPlaying={true}
                candleLit={isCandleLit}
                onEnvironmentProgressChange={setEnvironmentProgress}
                onAnimationComplete={() => setHasAnimationCompleted(true)}
                cards={BIRTHDAY_CARDS}
                activeCardId={activeCardId}
                onToggleCard={handleCardToggle}
              />

              {/* Alpine Cool Lighting */}
              <ambientLight intensity={(1 - environmentProgress) * 0.7 + 0.3} color="#DCEBFF" />
              <directionalLight
                intensity={0.65}
                position={[-2, 10, 5]}
                color="#F5F8FF"
                castShadow
              />
              <directionalLight
                intensity={0.35}
                position={[3, 4, -2]}
                color="#7CC7FB"
              />

              {/* Snowy Alpine HDRI */}
              <Environment
                files="/environments/snowy.hdr"
                backgroundRotation={[0, 3.3, 0]}
                environmentRotation={[0, 3.3, 0]}
                background
                environmentIntensity={0.12 * environmentProgress}
                backgroundIntensity={0.06 * environmentProgress}
              />
              <EnvironmentBackgroundController intensity={0.06 * environmentProgress} />

              {/* Celebratory Fireworks */}
              <Fireworks isActive={fireworksActive} origin={[0, 7, -8]} />

              {/* Orbit Controls (enabled for 360 inspection) */}
              <ConfiguredOrbitControls enabled={activeCardId === null} />
            </Suspense>
          </Canvas>
        </div>
      )}
    </div>
  );
}

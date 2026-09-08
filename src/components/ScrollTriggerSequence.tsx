import React, { useEffect, useRef, useState, useCallback } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { LauncherBalloons } from "./LauncherBalloons";
import { ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

gsap.registerPlugin(ScrollTrigger);

// ── Scroll progress timeline (module-level constants) ─────────────────────────
//  0.00 – 0.70   Image sequence (frames 1–300)
//  0.70 – 0.86   Balloon stage: button rises from bottom, centers, exits top
//    0.70 – 0.78   button enters (bottom → center)
//    0.78 – 0.86   button exits  (center → top)
//  0.70 – 0.95   Black overlay (z-30)
//  0.93 – 1.00   Final black fade (z-40) → 3D
//  0.99+          onSequenceComplete fires
// ─────────────────────────────────────────────────────────────────────────────
const SEQ_END = 0.70; // frame sequence completes
const BALLOON_END = 0.86; // balloon button fully exited top
const BLACK_END = 0.95; // black overlay disappears
const FINAL_FADE = 0.93; // final full-black layer appears

export interface ScrollTriggerSequenceProps {
  frameBasePath?: string; // default: "/sequences/Unboxing/"
  totalFrames?: number;   // default: 300
  onSequenceComplete?: () => void;
}

export const ScrollTriggerSequence: React.FC<ScrollTriggerSequenceProps> = ({
  frameBasePath = "/sequences/Unboxing/",
  totalFrames = 300,
  onSequenceComplete,
}) => {
  // Outer 600vh scroll container — provides scroll distance (NOT pinned)
  const containerRef = useRef<HTMLDivElement>(null);
  // Inner 100vh viewport — this is the element GSAP will pin
  const viewportRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageCacheRef = useRef<Map<number, HTMLImageElement>>(new Map());
  const currentFrameRef = useRef<number>(1);
  const isCompletedRef = useRef<boolean>(false);

  const [scrollProgress, setScrollProgress] = useState<number>(0);

  // Helper to get formatted frame path: frame_0001.webp -> frame_0300.webp
  const getFramePath = useCallback(
    (index: number) => {
      const clampedIndex = Math.min(totalFrames, Math.max(1, index));
      const padIndex = String(clampedIndex).padStart(4, "0");
      return `${frameBasePath}frame_${padIndex}.webp`;
    },
    [frameBasePath, totalFrames]
  );

  // Function to load and cache a single frame
  const loadFrame = useCallback(
    (index: number): Promise<HTMLImageElement> => {
      if (imageCacheRef.current.has(index)) {
        return Promise.resolve(imageCacheRef.current.get(index)!);
      }

      return new Promise((resolve, reject) => {
        const img = new Image();
        img.src = getFramePath(index);
        img.onload = () => {
          imageCacheRef.current.set(index, img);
          resolve(img);
        };
        img.onerror = () => {
          reject(new Error(`Failed to load frame ${index}`));
        };
      });
    },
    [getFramePath]
  );

  // Preload next N frames ahead of current index
  const preloadAhead = useCallback(
    (currentIndex: number, count = 12) => {
      for (let i = 1; i <= count; i++) {
        const nextIdx = currentIndex + i;
        if (nextIdx <= totalFrames && !imageCacheRef.current.has(nextIdx)) {
          void loadFrame(nextIdx);
        }
      }
    },
    [loadFrame, totalFrames]
  );

  // Draw a frame on the canvas with responsive, aspect-correct scaling.
  //
  // RESPONSIVE STRATEGY — contain/cover blend:
  //   containScale: image fits entirely within the viewport (no cropping).
  //   coverScale:   image fills the viewport (may crop edges).
  //
  //   Portrait screens (mobile): pure contain — no cropping, comfortable framing.
  //   Landscape screens (laptop/desktop): blend 0–70% toward cover for
  //     immersive feel without extreme zoom on ultrawide.
  //
  //   blend = 0   → pure contain (no overflow)
  //   blend = 0.7 → 70% of the way from contain to cover
  //
  //   Portrait (aspect < 1):   blend = 0       (contain only)
  //   Landscape (aspect ≥ 1):  blend = min(0.7, (aspect-1) × 0.7)
  //     e.g. 16:9 (1.78) → blend ≈ 0.55
  //          21:9 (2.37) → blend = 0.70  (capped)
  const drawFrame = useCallback((img: HTMLImageElement) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const displayWidth = window.innerWidth;
    const displayHeight = window.innerHeight;

    if (canvas.width !== displayWidth * dpr || canvas.height !== displayHeight * dpr) {
      canvas.width = displayWidth * dpr;
      canvas.height = displayHeight * dpr;
    }

    ctx.save();
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, displayWidth, displayHeight);

    // Principled contain/cover blend based on viewport aspect ratio
    const scaleByW = displayWidth / img.naturalWidth;
    const scaleByH = displayHeight / img.naturalHeight;
    const containScale = Math.min(scaleByW, scaleByH);
    const coverScale = Math.max(scaleByW, scaleByH);
    const viewportAspect = displayWidth / displayHeight;

    // blend: 0 on portrait, up to 0.7 on landscape
    const blend = viewportAspect < 1.0
      ? 0
      : Math.min(0.70, (viewportAspect - 1.0) * 0.70);

    const renderScale = containScale + (coverScale - containScale) * blend;
    const renderWidth = img.naturalWidth * renderScale;
    const renderHeight = img.naturalHeight * renderScale;
    const offsetX = (displayWidth - renderWidth) / 2;
    const offsetY = (displayHeight - renderHeight) / 2;

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(img, offsetX, offsetY, renderWidth, renderHeight);
    ctx.restore();
  }, []);

  // Render specific frame index
  const renderFrame = useCallback(
    (index: number) => {
      const clamped = Math.min(totalFrames, Math.max(1, index));
      currentFrameRef.current = clamped;

      const cached = imageCacheRef.current.get(clamped);
      if (cached && cached.complete) {
        drawFrame(cached);
      } else {
        void loadFrame(clamped).then((img) => {
          if (currentFrameRef.current === clamped) {
            drawFrame(img);
          }
        });
      }

      // Preload next batch
      preloadAhead(clamped, 10);
    },
    [drawFrame, loadFrame, preloadAhead, totalFrames]
  );

  // Initial preload of first 25 frames for instant startup
  useEffect(() => {
    let isMounted = true;

    loadFrame(1).then((img) => {
      if (isMounted) {
        drawFrame(img);
        for (let i = 2; i <= 25; i++) {
          void loadFrame(i);
        }
      }
    });

    const handleResize = () => {
      const currentImg = imageCacheRef.current.get(currentFrameRef.current);
      if (currentImg) {
        drawFrame(currentImg);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => {
      isMounted = false;
      window.removeEventListener("resize", handleResize);
    };
  }, [drawFrame, loadFrame]);

  // Handle sequence completion.
  // Fires once when scroll reaches 0.99 (purely scroll-driven, no timer gate).
  const handleComplete = useCallback(() => {
    if (isCompletedRef.current) return;
    isCompletedRef.current = true;

    // Short black fade then transition to 3D phase
    setTimeout(() => {
      if (onSequenceComplete) {
        onSequenceComplete();
      }
    }, 400);
  }, [onSequenceComplete]);

  // Setup GSAP ScrollTrigger
  //
  // ARCHITECTURE:
  //   trigger  = outer 600vh container (provides scroll distance, NOT pinned)
  //   pin      = inner 100vh viewport (the element GSAP fixes on screen)
  //
  // pinSpacing: false because the outer container already has explicit height.
  // st.kill(true) removes pin, pin-spacer and any transform GSAP applied,
  // so nothing stale remains when the component unmounts before 3D mounts.
  useEffect(() => {
    const container = containerRef.current;
    const viewport = viewportRef.current;
    if (!container || !viewport) return;

    const st = ScrollTrigger.create({
      trigger: container,
      pin: viewport,
      pinSpacing: false,
      start: "top top",
      end: "bottom bottom",
      scrub: 0.05,
      onUpdate: (self) => {
        const progress = self.progress;
        setScrollProgress(progress);

        // Reset completion guard on backward scroll
        if (progress < 0.95) {
          isCompletedRef.current = false;
        }

        // Frame sequence: maps progress 0.00–0.70 to frames 1–300.
        // Beyond 0.70 the last frame holds; black overlay takes over visually.
        const frameProgress = Math.min(1, progress / SEQ_END);
        const targetFrame = Math.min(
          totalFrames,
          Math.max(1, Math.floor(frameProgress * (totalFrames - 1)) + 1)
        );

        renderFrame(targetFrame);

        // 3D transition: purely scroll-driven — fires only at scroll end.
        // No timer. No balloon-state gate. Balloon stage is 0.70–0.86;
        // user must scroll past it before progress reaches 0.99.
        if (progress >= 0.99 && !isCompletedRef.current) {
          handleComplete();
        }
      },
    });

    return () => {
      // kill(true) removes pin state, pin-spacer, and GSAP transforms from DOM
      st.kill(true);
    };
  }, [handleComplete, renderFrame, totalFrames]);

  // ── Derived display states ─────────────────────────────────────────────────

  const isInFrameSequence = scrollProgress < SEQ_END;
  // Black staging is active from SEQ_END to BLACK_END.
  // We keep it in the DOM via isInBlackStaging so LauncherBalloons stays mounted
  // (no pop-in on conditional mount). Visual opacity is scroll-driven below.
  const isInBlackStaging = scrollProgress >= SEQ_END && scrollProgress < BLACK_END;

  // Balloon button: 100% scroll-driven — no timer, no timeout, no state outside progress.
  //
  // balloonT ∈ [0, 1] across the balloon phase (SEQ_END=0.70 to BALLOON_END=0.86).
  //   t = 0.0: button is one full screen-height below center (entering)
  //   t = 0.5: button is at center    (progress ≈ 0.78)
  //   t = 1.0: button is one full screen-height above center (exited)
  //
  // Backward scroll reverses the animation automatically — no timers.
  const balloonT = Math.max(0, Math.min(1,
    (scrollProgress - SEQ_END) / (BALLOON_END - SEQ_END)
  ));
  // +100vh (below) → 0 (center) → -100vh (above)
  const buttonOffsetVh = (1 - 2 * balloonT) * 100;
  // Opacity: 0 at edges, 1 in the middle 60% of the phase
  const buttonOpacity = Math.min(1, Math.min(balloonT, 1 - balloonT) * 6);

  // Black overlay opacity: scroll-driven fade-in over progress 0.70 → 0.74.
  // This replaces the Framer Motion time-based "duration: 0.5" fade, so the
  // overlay opacity is scrubbed by scroll — it cannot cover the canvas before
  // the user actually scrolls past SEQ_END.
  const overlayOpacity = scrollProgress <= SEQ_END
    ? 0
    : Math.min(1, (scrollProgress - SEQ_END) / 0.04);

  // Canvas opacity: always 1 — black overlay handles the visual transition
  const canvasOpacity = 1;

  return (
    <div
      ref={containerRef}
      className="relative w-full bg-black select-none"
      style={{ height: "600vh" }}
    >
      {/* Inner 100vh viewport — pinned by GSAP ScrollTrigger (no CSS sticky) */}
      <div ref={viewportRef} className="relative left-0 w-full h-screen overflow-hidden flex items-center justify-center bg-black">
        {/* 4K Frame Canvas — opacity always 1, no CSS transition needed */}
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full object-cover pointer-events-none"
          style={{ opacity: canvasOpacity }}
        />

        {/* Subtle Top & Bottom Vignette Overlays (only during frame sequence) */}
        {isInFrameSequence && (
          <>
            <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-black/50 to-transparent pointer-events-none" />
            <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />
          </>
        )}

        {/* Scroll Down Prompt — fades out when user scrolls past ~10% */}
        <AnimatePresence>
          {scrollProgress < 0.10 && isInFrameSequence && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.5 }}
              className="absolute bottom-8 inset-x-0 z-20 flex flex-col items-center gap-1.5 pointer-events-none"
            >
              <span className="text-xs md:text-sm font-medium tracking-widest uppercase text-white/60 bg-black/40 backdrop-blur-sm px-5 py-2 rounded-full border border-white/10">
                Keep scrolling very slowly, and wait for the surprise
              </span>
              <ChevronDown className="w-4 h-4 animate-bounce text-white/40" />
            </motion.div>
          )}
        </AnimatePresence>

        {/*
          Black Staging Area — active from SEQ_END (0.70) to BLACK_END (0.95).

          IMPORTANT: this is a plain div (not AnimatePresence/motion.div).
          Its opacity is scroll-driven (overlayOpacity), not time-based.
          This means it cannot cover the canvas before the user scrolls past 0.70
          — the premature fade bug is eliminated.

          LauncherBalloons is ALWAYS mounted while isInBlackStaging is true.
          Its position/opacity are controlled by scroll-driven inline styles.
          There is no conditional mount/unmount of the button inside the staging
          zone — this eliminates the "pop-in" entrance animation bug.
        */}
        {isInBlackStaging && (
          <div
            className="absolute inset-0 bg-black z-30"
            style={{ opacity: overlayOpacity }}
          >
            {/* Scroll-driven balloon button — position = f(self.progress), no timers */}
            <div
              style={{
                position: "absolute",
                left: "50%",
                top: "50%",
                transform: `translate(-50%, calc(-50% + ${buttonOffsetVh}vh))`,
                opacity: buttonOpacity,
                pointerEvents: buttonOpacity > 0.3 ? "auto" : "none",
                willChange: "transform, opacity",
              }}
            >
              <LauncherBalloons
                buttonText="Enjoyed your 19th Nano"
                className=""
              />
            </div>
          </div>
        )}

        {/* Final black fade — covers everything before 3D loads (z-40) */}
        <AnimatePresence>
          {scrollProgress >= FINAL_FADE && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
              className="absolute inset-0 bg-black z-40"
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default ScrollTriggerSequence;

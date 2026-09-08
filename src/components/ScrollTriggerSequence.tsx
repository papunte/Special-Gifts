import React, { useEffect, useRef, useState, useCallback } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { LauncherBalloons } from "./LauncherBalloons";
import { ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

gsap.registerPlugin(ScrollTrigger);

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
  const [currentFrame, setCurrentFrame] = useState<number>(1);
  const lastFrameTimeRef = useRef<number | null>(null);
  // Forces a React re-render after the 1500ms delay so the button appears
  const [balloonTimerFired, setBalloonTimerFired] = useState<boolean>(false);
  const balloonTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  // Draw a frame on the canvas preserving aspect ratio
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

    // Cover calculation so 4K WebP fills the screen
    const imgAspect = img.naturalWidth / img.naturalHeight;
    const screenAspect = displayWidth / displayHeight;

    let renderWidth: number;
    let renderHeight: number;
    let offsetX: number;
    let offsetY: number;

    if (screenAspect > imgAspect) {
      renderWidth = displayWidth;
      renderHeight = displayWidth / imgAspect;
      offsetX = 0;
      offsetY = (displayHeight - renderHeight) / 2;
    } else {
      renderHeight = displayHeight;
      renderWidth = displayHeight * imgAspect;
      offsetX = (displayWidth - renderWidth) / 2;
      offsetY = 0;
    }

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

  // Handle sequence completion transition
  const handleComplete = useCallback(() => {
    if (isCompletedRef.current) return;
    isCompletedRef.current = true;

    // Clean black fade then transition
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

        if (progress < 0.90) {
          isCompletedRef.current = false;
        }

        // Frame sequence occupies 0–70% of the scroll range.
        // Beyond 70% the canvas holds on the last frame then fades to black.
        const frameProgress = Math.min(1, progress / 0.70);
        const targetFrame = Math.min(
          totalFrames,
          Math.max(1, Math.floor(frameProgress * (totalFrames - 1)) + 1)
        );

        renderFrame(targetFrame);
        setCurrentFrame(targetFrame);

        // Track first time frame >= 295 is reached for the 1500ms balloon gate.
        // A one-shot setTimeout forces a React re-render so the button
        // appears even if the user stops scrolling after reaching frame 295.
        if (targetFrame >= 300 && lastFrameTimeRef.current === null) {
          lastFrameTimeRef.current = performance.now();
          if (balloonTimerRef.current !== null) {
            clearTimeout(balloonTimerRef.current);
          }
          balloonTimerRef.current = setTimeout(() => {
            setBalloonTimerFired(true);
          }, 1500);
        } else if (targetFrame < 300) {
          // User scrolled back — reset the gate
          lastFrameTimeRef.current = null;
          setBalloonTimerFired(false);
          if (balloonTimerRef.current !== null) {
            clearTimeout(balloonTimerRef.current);
            balloonTimerRef.current = null;
          }
        }

        // Trigger sequence completion when scroll reaches 99%
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

  // Clean up balloon setTimeout on unmount
  useEffect(() => {
    return () => {
      if (balloonTimerRef.current !== null) {
        clearTimeout(balloonTimerRef.current);
      }
    };
  }, []);

  // Derived display states
  const isInFrameSequence = scrollProgress < 0.72;
  const isInBlackStaging = scrollProgress >= 0.72 && scrollProgress < 0.93;

  // Balloon button: visible only after frame 295 AND 1500ms have elapsed.
  // balloonTimerFired is set by setTimeout above — guarantees a re-render
  // even if the user stops scrolling (no further onUpdate invocations).
  const showBalloonButton =
    scrollProgress >= 0.72 &&
    scrollProgress < 0.90 &&
    currentFrame >= 295 &&
    balloonTimerFired;

  // Canvas opacity: fade out after frame sequence ends
  const canvasOpacity = scrollProgress < 0.68
    ? 1
    : scrollProgress < 0.74
      ? 1 - ((scrollProgress - 0.68) / 0.06)
      : 0;

  return (
    <div
      ref={containerRef}
      className="relative w-full bg-black select-none"
      style={{ height: "600vh" }}
    >
      {/* Inner 100vh viewport — pinned by GSAP ScrollTrigger (no CSS sticky) */}
      <div ref={viewportRef} className="relative left-0 w-full h-screen overflow-hidden flex items-center justify-center bg-black">
        {/* 4K Frame Canvas */}
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full object-cover pointer-events-none"
          style={{ opacity: canvasOpacity, transition: "opacity 0.3s ease" }}
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
                Scroll down to unbox the surprise
              </span>
              <ChevronDown className="w-4 h-4 animate-bounce text-white/40" />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Black Staging Area — Launch Birthday Balloons Button */}
        <AnimatePresence>
          {isInBlackStaging && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6 }}
              className="absolute inset-0 bg-black z-30 flex items-center justify-center"
            >
              <AnimatePresence>
                {showBalloonButton && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                    className="flex items-center justify-center"
                  >
                    <LauncherBalloons
                      buttonText="Launch Birthday Balloons"
                      className=""
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Final black fade transition to 3D */}
        <AnimatePresence>
          {scrollProgress >= 0.93 && (
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

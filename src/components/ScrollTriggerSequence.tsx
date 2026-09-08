import React, { useEffect, useRef, useState, useCallback } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { LauncherBalloons } from "./LauncherBalloons";
import { ChevronDown, Sparkles, FastForward } from "lucide-react";
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
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageCacheRef = useRef<Map<number, HTMLImageElement>>(new Map());
  const currentFrameRef = useRef<number>(1);
  const isCompletedRef = useRef<boolean>(false);

  const [scrollProgress, setScrollProgress] = useState<number>(0);
  const [isTransitioning, setIsTransitioning] = useState<boolean>(false);

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

    // Cover / contain calculation with crisp rendering
    const imgAspect = img.naturalWidth / img.naturalHeight;
    const screenAspect = displayWidth / displayHeight;

    let renderWidth: number;
    let renderHeight: number;
    let offsetX: number;
    let offsetY: number;

    // Use cover behavior so 4K WebP fills the screen gorgeously
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

  // Initial preload of first 15 frames for instant startup
  useEffect(() => {
    let isMounted = true;

    // Load first frame immediately and draw it
    loadFrame(1).then((img) => {
      if (isMounted) {
        drawFrame(img);
        // Preload next frames in background
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
    setIsTransitioning(true);

    setTimeout(() => {
      if (onSequenceComplete) {
        onSequenceComplete();
      }
    }, 600);
  }, [onSequenceComplete]);

  // Setup GSAP ScrollTrigger
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        trigger: container,
        start: "top top",
        end: "bottom bottom",
        scrub: 0.15,
        onUpdate: (self) => {
          const progress = self.progress;
          setScrollProgress(progress);

          // Calculate frame index (1 to totalFrames)
          const targetFrame = Math.min(
            totalFrames,
            Math.max(1, Math.floor(progress * (totalFrames - 1)) + 1)
          );

          renderFrame(targetFrame);

          // Trigger sequence completion when scroll reaches 98%
          if (progress >= 0.98 && !isCompletedRef.current) {
            handleComplete();
          }
        },
      });
    }, containerRef);

    return () => {
      ctx.revert();
    };
  }, [handleComplete, renderFrame, totalFrames]);

  return (
    <div
      ref={containerRef}
      className="relative w-full bg-black select-none"
      style={{ height: "300vh" }}
    >
      {/* Sticky Fullscreen 4K Canvas Viewport */}
      <div className="sticky top-0 left-0 w-full h-screen overflow-hidden flex items-center justify-center">
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full object-cover pointer-events-none"
        />

        {/* Ambient Top & Bottom Vignette Overlays */}
        <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-black/80 via-black/30 to-transparent pointer-events-none" />
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-black/80 via-black/30 to-transparent pointer-events-none" />

        {/* Top Floating Header & Progress Bar */}
        <div className="absolute top-0 inset-x-0 z-30 p-4 md:p-6 flex items-center justify-between pointer-events-auto">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 shadow-[0_0_15px_rgba(124,199,251,0.3)]">
              <Sparkles className="w-5 h-5 text-cyan-300" />
            </div>
            <div>
              <h2
                className="text-lg md:text-2xl font-bold tracking-wider text-white drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)]"
                style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
              >
                Unboxing Nano's Gift
              </h2>
              <p className="text-xs text-cyan-200/80 tracking-widest uppercase">
                Frame {currentFrameRef.current} / {totalFrames} • 4K Scroll Sync
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Skip directly to 3D Scene */}
            <button
              onClick={handleComplete}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-white/10 hover:bg-white/20 text-white backdrop-blur-md border border-white/20 shadow-md transition-all active:scale-95"
            >
              <FastForward className="w-3.5 h-3.5 text-cyan-300" />
              <span>Enter 3D Scene</span>
            </button>
          </div>
        </div>

        {/* Progress Bar Line */}
        <div className="absolute top-0 inset-x-0 h-1 bg-white/10 z-40">
          <div
            className="h-full bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-400 shadow-[0_0_12px_#38bdf8] transition-all duration-75"
            style={{ width: `${Math.min(100, Math.max(0, scrollProgress * 100))}%` }}
          />
        </div>

        {/* Bottom Floating Controls: Scroll Hint & Launcher Balloons */}
        <div className="absolute bottom-6 inset-x-0 z-30 flex flex-col items-center gap-3 pointer-events-auto px-4">
          {/* Scroll Down Prompt (Fades out when user scrolls past 10%) */}
          <AnimatePresence>
            {scrollProgress < 0.12 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex flex-col items-center gap-1 text-cyan-100/90 text-xs md:text-sm font-medium tracking-widest uppercase bg-black/40 backdrop-blur-md px-5 py-2 rounded-full border border-white/15 shadow-[0_0_20px_rgba(0,0,0,0.5)]"
              >
                <span>Scroll down to unbox the surprise</span>
                <ChevronDown className="w-4 h-4 animate-bounce text-cyan-300" />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Launcher Balloons Component */}
          <LauncherBalloons buttonText="Launch Birthday Balloons! 🎈" />
        </div>

        {/* End Transition Squircle / Dark Fade to Phase 3 */}
        <AnimatePresence>
          {isTransitioning && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6 }}
              className="absolute inset-0 bg-black z-50 flex flex-col items-center justify-center text-white"
            >
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="flex flex-col items-center gap-3"
              >
                <div className="w-12 h-12 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin" />
                <p
                  className="text-xl font-bold tracking-widest text-cyan-200"
                  style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
                >
                  Entering Frozen Alpine Realm...
                </p>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default ScrollTriggerSequence;

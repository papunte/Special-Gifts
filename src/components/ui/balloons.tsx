import * as React from "react";
import { cn } from "@/lib/utils";
import confetti from "canvas-confetti";

export interface BalloonsProps {
  type?: "default" | "text";
  text?: string;
  fontSize?: number;
  color?: string;
  className?: string;
  onLaunch?: () => void;
}

export interface BalloonsHandle {
  launchAnimation: () => void;
}

const Balloons = React.forwardRef<BalloonsHandle, BalloonsProps>(
  ({ type = "default", text = "Happy 19th Nano!", className, onLaunch }, ref) => {
    const containerRef = React.useRef<HTMLDivElement>(null);

    const launchAnimation = React.useCallback(async () => {
      try {
        // Try importing balloons-js dynamically or safely
        const balloonsModule = await import("balloons-js");
        if (type === "default" && typeof balloonsModule.balloons === "function") {
          balloonsModule.balloons();
        } else if (
          type === "text" &&
          text &&
          typeof balloonsModule.textBalloons === "function"
        ) {
          balloonsModule.textBalloons([
            {
              text,
              fontSize: 48,
              color: "#4A90E2",
            },
          ]);
        }
      } catch (err) {
        console.warn("balloons-js launcher fallback:", err);
      }

      // Rich multi-colored Frozen & celebratory confetti burst
      try {
        confetti({
          particleCount: 80,
          spread: 90,
          origin: { y: 0.8 },
          colors: ["#7CC7FB", "#4A90E2", "#FFFFFF", "#FFD700", "#E0EFFE", "#A5F3FC"],
        });
        setTimeout(() => {
          confetti({
            particleCount: 50,
            angle: 60,
            spread: 60,
            origin: { x: 0, y: 0.8 },
            colors: ["#FFD700", "#4A90E2", "#FFFFFF"],
          });
          confetti({
            particleCount: 50,
            angle: 120,
            spread: 60,
            origin: { x: 1, y: 0.8 },
            colors: ["#7CC7FB", "#A5F3FC", "#FFFFFF"],
          });
        }, 200);
      } catch (e) {
        console.warn("confetti fallback error:", e);
      }

      if (onLaunch) {
        onLaunch();
      }
    }, [type, text, onLaunch]);

    // Export launch animation method to parent ref
    React.useImperativeHandle(
      ref,
      () => ({
        launchAnimation,
      }),
      [launchAnimation]
    );

    return (
      <div
        ref={containerRef}
        className={cn("balloons-container pointer-events-none fixed inset-0 z-50", className)}
      />
    );
  }
);
Balloons.displayName = "Balloons";

export { Balloons };
export default Balloons;

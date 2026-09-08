import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export interface WetPaintButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  className?: string;
  isUnlocked?: boolean;
}

// Props for the Drip component
type DripProps = {
  left: string;
  height: number;
  delay: number;
  isUnlocked?: boolean;
};

// The Drip component creates the animated dripping snow/paint effect
const Drip: React.FC<DripProps> = ({ left, height, delay, isUnlocked = true }) => {
  return (
    <motion.div
      className="absolute top-[99%] origin-top pointer-events-none"
      style={{ left }}
      initial={{ scaleY: 0.75 }}
      animate={
        isUnlocked
          ? { scaleY: [0.75, 1.25, 0.75] }
          : { scaleY: [0.6, 0.8, 0.6] }
      }
      transition={{
        duration: 2.2,
        times: [0, 0.35, 1],
        delay,
        ease: "easeInOut",
        repeat: Infinity,
        repeatDelay: 1.5,
      }}
    >
      {/* The main body of the drip - snow white */}
      <div
        style={{ height }}
        className="w-2.5 rounded-b-full bg-white transition-all shadow-[0_2px_8px_rgba(255,255,255,0.4)] group-hover:bg-slate-50"
      />

      {/* SVG for the right-side curve of the drip */}
      <svg
        width="6"
        height="6"
        viewBox="0 0 6 6"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="absolute left-full top-0"
      >
        <g clipPath="url(#clip0_snow_right)">
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M5.4 0H0V5.4C0 2.41765 2.41766 0 5.4 0Z"
            className="fill-white transition-colors group-hover:fill-slate-50"
          />
        </g>
        <defs>
          <clipPath id="clip0_snow_right">
            <rect width="6" height="6" fill="white" />
          </clipPath>
        </defs>
      </svg>

      {/* SVG for the left-side curve of the drip */}
      <svg
        width="6"
        height="6"
        viewBox="0 0 6 6"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="absolute right-full top-0 rotate-90"
      >
        <g clipPath="url(#clip0_snow_left)">
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M5.4 0H0V5.4C0 2.41765 2.41766 0 5.4 0Z"
            className="fill-white transition-colors group-hover:fill-slate-50"
          />
        </g>
        <defs>
          <clipPath id="clip0_snow_left">
            <rect width="6" height="6" fill="white" />
          </clipPath>
        </defs>
      </svg>

      {/* A smaller, detached droplet that falls */}
      {isUnlocked && (
        <motion.div
          initial={{ y: -6, opacity: 1, scale: 0.9 }}
          animate={{ y: [-6, 42], opacity: [1, 0], scale: [0.9, 0.4] }}
          transition={{
            duration: 2.2,
            times: [0, 1],
            delay,
            ease: "easeIn",
            repeat: Infinity,
            repeatDelay: 1.5,
          }}
          className="absolute top-full h-2 w-2 rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)]"
        />
      )}
    </motion.div>
  );
};

// The main component that renders the button and its drips
export const WetPaintButton: React.FC<WetPaintButtonProps> = ({
  children,
  className,
  disabled,
  isUnlocked = true,
  ...props
}) => {
  return (
    <button
      disabled={disabled}
      className={cn(
        "group relative rounded-xl bg-white px-8 py-4 font-bold text-black text-lg tracking-wider transition-all duration-300 select-none shadow-[0_0_30px_rgba(255,255,255,0.4),0_10px_20px_rgba(0,0,0,0.5)]",
        "hover:bg-slate-50 hover:shadow-[0_0_40px_rgba(255,255,255,0.7),0_12px_24px_rgba(0,0,0,0.6)] hover:scale-[1.02] active:scale-[0.98]",
        "disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:shadow-none",
        className
      )}
      {...props}
    >
      <span className="relative z-10 flex items-center justify-center gap-2">
        {children}
      </span>

      {/* Animated drips */}
      <Drip left="12%" height={24} delay={0.4} isUnlocked={isUnlocked} />
      <Drip left="32%" height={18} delay={2.4} isUnlocked={isUnlocked} />
      <Drip left="58%" height={14} delay={3.8} isUnlocked={isUnlocked} />
      <Drip left="82%" height={20} delay={1.2} isUnlocked={isUnlocked} />
    </button>
  );
};

export default WetPaintButton;

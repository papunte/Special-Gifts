import React, { useRef } from "react";
import { Balloons, type BalloonsHandle } from "./ui/balloons";

interface LauncherBalloonsProps {
  onLaunch?: () => void;
  className?: string;
  buttonText?: string;
}

export const LauncherBalloons: React.FC<LauncherBalloonsProps> = ({
  onLaunch,
  className = "",
  buttonText = "Launch Birthday Balloons",
}) => {
  const balloonsRef = useRef<BalloonsHandle>(null);

  const handleLaunch = () => {
    if (balloonsRef.current) {
      balloonsRef.current.launchAnimation();
    }
    if (onLaunch) {
      onLaunch();
    }
  };

  return (
    <div className={`relative inline-flex items-center gap-3 ${className}`}>
      <button
        onClick={handleLaunch}
        className="px-8 py-3.5 rounded-xl text-sm md:text-base font-medium tracking-wide text-white bg-white/[0.06] hover:bg-white/[0.10] border border-white/[0.12] hover:border-white/[0.20] backdrop-blur-sm transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] cursor-pointer select-none"
      >
        {buttonText}
      </button>
      <Balloons ref={balloonsRef} type="default" />
    </div>
  );
};

export default LauncherBalloons;

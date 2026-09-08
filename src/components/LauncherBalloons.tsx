import React, { useRef } from "react";
import { Balloons, type BalloonsHandle } from "./ui/balloons";
import { Button } from "./ui/button";
import { Sparkles } from "lucide-react";

interface LauncherBalloonsProps {
  onLaunch?: () => void;
  className?: string;
  buttonText?: string;
}

export const LauncherBalloons: React.FC<LauncherBalloonsProps> = ({
  onLaunch,
  className = "",
  buttonText = "Release Birthday Balloons! 🎈",
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
      <Button
        onClick={handleLaunch}
        variant="frozen"
        size="lg"
        className="group shadow-[0_0_25px_rgba(124,199,251,0.4)] hover:shadow-[0_0_35px_rgba(124,199,251,0.7)] font-semibold tracking-wide"
      >
        <Sparkles className="w-5 h-5 mr-2 text-yellow-300 animate-spin" style={{ animationDuration: '4s' }} />
        {buttonText}
      </Button>
      <Balloons ref={balloonsRef} type="default" />
    </div>
  );
};

export default LauncherBalloons;

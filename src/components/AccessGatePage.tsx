import React, { useEffect, useMemo, useState, useCallback } from "react";
import dayjs from "dayjs";
import duration from "dayjs/plugin/duration";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import { motion, AnimatePresence } from "framer-motion";
import { WetPaintButton } from "./ui/wet-paint-button";
import { Clock } from "lucide-react";

dayjs.extend(duration);
dayjs.extend(utc);
dayjs.extend(timezone);

// Target: September 10, 2026 00:00:00 WIB (Asia/Jakarta = UTC+7)
const TARGET_DATE_WIB = "2026-09-10T00:00:00+07:00";

interface AccessGatePageProps {
  isBoxOpened?: boolean;
  onBoxOpen: () => void;
}

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  totalMs: number;
}

export const AccessGatePage: React.FC<AccessGatePageProps> = ({
  onBoxOpen,
}) => {
  const targetTime = useMemo(() => dayjs(TARGET_DATE_WIB), []);
  const [isExiting, setIsExiting] = useState(false);

  const calculateTimeLeft = useCallback((): TimeLeft => {
    const now = dayjs();
    const diff = targetTime.diff(now);

    if (diff <= 0) {
      return { days: 0, hours: 0, minutes: 0, seconds: 0, totalMs: 0 };
    }

    const dur = dayjs.duration(diff);
    return {
      days: Math.floor(dur.asDays()),
      hours: dur.hours(),
      minutes: dur.minutes(),
      seconds: dur.seconds(),
      totalMs: diff,
    };
  }, [targetTime]);

  const [timeLeft, setTimeLeft] = useState<TimeLeft>(calculateTimeLeft);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);
    return () => clearInterval(timer);
  }, [calculateTimeLeft]);

  const isActuallyUnlocked = timeLeft.totalMs <= 0;

  const handleOpenBox = useCallback(() => {
    setIsExiting(true);
    // Allow navbar fade-out animation to begin, then trigger parent transition
    setTimeout(() => {
      onBoxOpen();
    }, 500);
  }, [onBoxOpen]);

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-black flex flex-col items-center justify-center px-4 select-none text-white">
      {/* Premium Minimal Navbar */}
      <motion.nav
        initial={{ opacity: 0, y: -10 }}
        animate={isExiting ? { opacity: 0, y: -30 } : { opacity: 1, y: 0 }}
        transition={{ duration: isExiting ? 0.5 : 0.8, ease: "easeOut" }}
        className="fixed top-0 left-0 right-0 z-50 flex items-center px-6 md:px-10"
        style={{
          height: "48px",
          background: "rgba(5,5,5,0.75)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        <span
          className="text-sm md:text-base font-medium tracking-wide text-white/80 hover:text-white/95 transition-opacity duration-300 cursor-default"
          style={{ fontFamily: "'Outfit', sans-serif" }}
        >
          Present from Alex
        </span>
      </motion.nav>

      {/* Center Content */}
      <div className="relative z-10 flex flex-col items-center justify-center max-w-md w-full gap-8">
        {/* Countdown Timer Display */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="w-full"
        >
          <div className="flex items-center justify-center gap-2 md:gap-4 mb-2">
            <TimeUnit value={timeLeft.days} label="Days" />
            <span className="text-2xl md:text-3xl font-light text-white/20 self-center -mt-4">:</span>
            <TimeUnit value={timeLeft.hours} label="Hours" />
            <span className="text-2xl md:text-3xl font-light text-white/20 self-center -mt-4">:</span>
            <TimeUnit value={timeLeft.minutes} label="Mins" />
            <span className="text-2xl md:text-3xl font-light text-white/20 self-center -mt-4">:</span>
            <TimeUnit value={timeLeft.seconds} label="Secs" />
          </div>
        </motion.div>

        {/* CTA Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="flex flex-col items-center gap-4"
        >
          <WetPaintButton
            onClick={handleOpenBox}
            disabled={!isActuallyUnlocked}
            isUnlocked={isActuallyUnlocked}
            className="min-w-[260px] md:min-w-[320px]"
          >
            {isActuallyUnlocked ? (
              <span>Ready for the surprise?</span>
            ) : (
              <>
                <Clock className="w-5 h-5 text-neutral-500" />
                <span>Nano Birthday is Coming</span>
              </>
            )}
          </WetPaintButton>
        </motion.div>
      </div>
    </div>
  );
};

interface TimeUnitProps {
  value: number;
  label: string;
}

const TimeUnit: React.FC<TimeUnitProps> = ({ value, label }) => {
  const formatted = String(value).padStart(2, "0");
  return (
    <div className="flex flex-col items-center">
      <div className="w-14 h-16 md:w-18 md:h-20 rounded-xl bg-white/[0.03] border border-white/[0.08] backdrop-blur-sm flex items-center justify-center">
        <AnimatePresence mode="popLayout">
          <motion.span
            key={formatted}
            initial={{ y: 8, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -8, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="text-2xl md:text-3xl font-semibold font-mono tracking-tight text-white/90"
          >
            {formatted}
          </motion.span>
        </AnimatePresence>
      </div>
      <span className="text-[10px] md:text-xs tracking-widest text-white/30 uppercase mt-1.5 font-medium">
        {label}
      </span>
    </div>
  );
};

export default AccessGatePage;

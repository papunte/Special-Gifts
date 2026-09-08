import React, { useEffect, useMemo, useState } from "react";
import dayjs from "dayjs";
import duration from "dayjs/plugin/duration";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import { motion, AnimatePresence } from "framer-motion";
import { WetPaintButton } from "./ui/wet-paint-button";
import { Sparkles, Clock, Snowflake, Lock, Unlock } from "lucide-react";

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
  const [isTestUnlocked, setIsTestUnlocked] = useState(false);

  const calculateTimeLeft = (): TimeLeft => {
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
  };

  const [timeLeft, setTimeLeft] = useState<TimeLeft>(calculateTimeLeft);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);
    return () => clearInterval(timer);
  }, [targetTime]);

  const isActuallyUnlocked = timeLeft.totalMs <= 0 || isTestUnlocked;

  // Snowflakes particles for ambient Frozen atmosphere
  const snowflakes = useMemo(
    () =>
      Array.from({ length: 24 }).map((_, i) => ({
        id: i,
        left: `${(i * 4.2 + (i % 3) * 2) % 100}%`,
        size: 2 + (i % 4) * 2,
        duration: 7 + (i % 6) * 2,
        delay: (i % 7) * 1.1,
        opacity: 0.3 + (i % 5) * 0.15,
      })),
    []
  );

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-black flex flex-col items-center justify-between py-8 px-4 select-none text-white">
      {/* Background Radial Glow & Gradient */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-950/40 via-black to-black pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-cyan-500/10 rounded-full blur-[140px] pointer-events-none" />

      {/* Floating Snowflakes */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {snowflakes.map((flake) => (
          <motion.div
            key={flake.id}
            initial={{ y: "-5vh", opacity: 0 }}
            animate={{ y: "105vh", opacity: [0, flake.opacity, 0] }}
            transition={{
              duration: flake.duration,
              delay: flake.delay,
              repeat: Infinity,
              ease: "linear",
            }}
            className="absolute rounded-full bg-cyan-100 shadow-[0_0_8px_#ffffff]"
            style={{
              left: flake.left,
              width: flake.size,
              height: flake.size,
            }}
          />
        ))}
      </div>

      {/* Top Header */}
      <header className="relative z-10 flex flex-col items-center text-center mt-2">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-cyan-400/20 backdrop-blur-md mb-3 shadow-[0_0_15px_rgba(124,199,251,0.15)]"
        >
          <Snowflake className="w-4 h-4 text-cyan-300 animate-spin" style={{ animationDuration: "12s" }} />
          <span className="text-xs md:text-sm font-medium tracking-widest text-cyan-200 uppercase">
            Frozen 19th Birthday Experience
          </span>
          <Sparkles className="w-4 h-4 text-yellow-300" />
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, delay: 0.2 }}
          className="text-3xl md:text-5xl lg:text-6xl font-extrabold tracking-wider bg-gradient-to-b from-white via-cyan-100 to-blue-300 bg-clip-text text-transparent drop-shadow-[0_4px_24px_rgba(165,243,252,0.35)]"
          style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
        >
          Happy 19th Birthday, Nano
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.4 }}
          className="text-xs md:text-sm text-cyan-200/70 tracking-widest mt-1 uppercase"
        >
          Sept 10, 2026 • 00:00 WIB (Asia/Jakarta)
        </motion.p>
      </header>

      {/* Center Visual & Countdown Section */}
      <div className="relative z-10 flex flex-col items-center justify-center my-auto max-w-2xl w-full">
        {/* Countdown Timer Display */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="w-full mb-6"
        >
          <div className="flex items-center justify-center gap-2 md:gap-4 mb-2">
            <TimeUnit value={timeLeft.days} label="Days" />
            <span className="text-2xl md:text-4xl font-light text-cyan-400/60 self-center -mt-4">:</span>
            <TimeUnit value={timeLeft.hours} label="Hours" />
            <span className="text-2xl md:text-4xl font-light text-cyan-400/60 self-center -mt-4">:</span>
            <TimeUnit value={timeLeft.minutes} label="Mins" />
            <span className="text-2xl md:text-4xl font-light text-cyan-400/60 self-center -mt-4">:</span>
            <TimeUnit value={timeLeft.seconds} label="Secs" />
          </div>
        </motion.div>

        {/* Centered Olaf Visual Hero */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, delay: 0.6 }}
          className="relative group w-48 h-48 md:w-60 md:h-60 flex items-center justify-center"
        >
          {/* Glowing Aura Ring */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-cyan-500/20 via-blue-500/10 to-transparent blur-xl group-hover:scale-110 transition-transform duration-700" />
          <div className="absolute -inset-2 rounded-full border border-cyan-400/20 border-dashed animate-spin" style={{ animationDuration: "30s" }} />

          {/* Olaf Preview Image */}
          <motion.img
            src="/sequences/Unboxing/frame_0001.webp"
            alt="Olaf Preview"
            className="w-full h-full object-contain filter drop-shadow-[0_10px_25px_rgba(124,199,251,0.4)]"
            animate={{ y: [-4, 6, -4] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
          />
        </motion.div>
      </div>

      {/* Bottom CTA & Controls */}
      <footer className="relative z-10 flex flex-col items-center gap-4 mb-3">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.7 }}
          className="flex flex-col items-center gap-3"
        >
          <WetPaintButton
            onClick={onBoxOpen}
            disabled={!isActuallyUnlocked}
            isUnlocked={isActuallyUnlocked}
            className="min-w-[260px] md:min-w-[320px]"
          >
            {isActuallyUnlocked ? (
              <>
                <Sparkles className="w-5 h-5 text-amber-500" />
                <span>Open The Box</span>
                <Sparkles className="w-5 h-5 text-amber-500" />
              </>
            ) : (
              <>
                <Clock className="w-5 h-5 text-neutral-500" />
                <span>Nano Birthday is Coming</span>
              </>
            )}
          </WetPaintButton>

          {/* Status Subtitle */}
          <p className="text-xs text-neutral-400 tracking-wider text-center">
            {isActuallyUnlocked ? (
              <span className="text-cyan-300 font-medium">✨ Unlocked! Click to unbox the gift & start the music ✨</span>
            ) : (
              <span>Locked until September 10, 2026 00:00 WIB</span>
            )}
          </p>
        </motion.div>

        {/* Interactive Developer / Preview Mode Toggle */}
        <motion.button
          onClick={() => setIsTestUnlocked((prev) => !prev)}
          className="mt-1 flex items-center gap-1.5 px-3 py-1 text-[11px] rounded-full bg-white/5 hover:bg-white/10 text-cyan-200/60 hover:text-cyan-200 border border-white/10 transition-colors"
          title="Toggle preview unlock for testing"
        >
          {isTestUnlocked ? <Unlock className="w-3 h-3 text-green-400" /> : <Lock className="w-3 h-3 text-amber-400" />}
          <span>{isTestUnlocked ? "Preview Mode: UNLOCKED" : "Test Bypass / Unlock Now"}</span>
        </motion.button>
      </footer>
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
      <div className="w-14 h-16 md:w-20 md:h-22 rounded-2xl bg-white/5 border border-cyan-300/20 backdrop-blur-lg flex items-center justify-center shadow-[0_8px_32px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.2)]">
        <AnimatePresence mode="popLayout">
          <motion.span
            key={formatted}
            initial={{ y: 8, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -8, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="text-2xl md:text-4xl font-bold font-mono tracking-tight text-white drop-shadow-[0_2px_10px_rgba(165,243,252,0.6)]"
          >
            {formatted}
          </motion.span>
        </AnimatePresence>
      </div>
      <span className="text-[10px] md:text-xs tracking-widest text-cyan-300/70 uppercase mt-1.5 font-medium">
        {label}
      </span>
    </div>
  );
};

export default AccessGatePage;

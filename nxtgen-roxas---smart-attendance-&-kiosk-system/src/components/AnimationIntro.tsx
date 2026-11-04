import React, { useEffect, useState } from 'react';
import { Sparkles } from 'lucide-react';

interface AnimationIntroProps {
  onComplete: () => void;
  durationMs?: number;
}

export const AnimationIntro: React.FC<AnimationIntroProps> = ({
  onComplete,
  durationMs = 3000,
}) => {
  const [progress, setProgress] = useState(0);
  const [isFadingOut, setIsFadingOut] = useState(false);

  useEffect(() => {
    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const pct = Math.min(100, Math.round((elapsed / durationMs) * 100));
      setProgress(pct);

      if (elapsed >= durationMs - 400 && !isFadingOut) {
        setIsFadingOut(true);
      }

      if (elapsed >= durationMs) {
        clearInterval(interval);
        onComplete();
      }
    }, 30);

    return () => clearInterval(interval);
  }, [durationMs, onComplete, isFadingOut]);

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-gradient-to-br from-[#0c1829] via-[#0F172A] to-[#082f49] text-white overflow-hidden transition-opacity duration-500 ${
        isFadingOut ? 'opacity-0 scale-105 pointer-events-none' : 'opacity-100 scale-100'
      }`}
    >
      {/* Background Animated Ambient Glows */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 sm:w-96 h-80 sm:h-96 bg-[#29C5E8]/20 rounded-full blur-3xl animate-pulse pointer-events-none" />
      <div className="absolute bottom-1/3 right-1/4 w-72 sm:w-80 h-72 sm:h-80 bg-[#FF6F00]/15 rounded-full blur-3xl animate-pulse delay-700 pointer-events-none" />

      {/* Main Container */}
      <div className="relative flex flex-col items-center text-center p-6 space-y-6 max-w-sm sm:max-w-md w-full">
        {/* Animated Logo Shield */}
        <div className="relative group">
          {/* Glowing pulse rings */}
          <div className="absolute -inset-3 bg-gradient-to-r from-[#29C5E8] to-[#FF6F00] rounded-3xl opacity-60 blur-xl animate-pulse" />
          
          <div className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-3xl bg-white p-3.5 border-4 border-[#29C5E8] shadow-2xl flex items-center justify-center transform transition-transform duration-700 animate-bounce-subtle">
            <img
              src="/assets/aistudio/NXTGEN_PRIMARY_LOGO_602b8b89.png"
              alt="NXTGEN Logo"
              className="w-full h-full object-contain filter drop-shadow-md"
            />
          </div>

          <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-[#FF6F00] text-white flex items-center justify-center border-2 border-slate-900 shadow-lg animate-spin-slow">
            <Sparkles className="w-4 h-4" />
          </div>
        </div>

        {/* Brand Text */}
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/15 border border-[#29C5E8]/40 text-[#29C5E8] text-xs font-black uppercase tracking-widest shadow-sm">
            <span>CCF Roxas</span>
            <span>•</span>
            <span>Kids Church</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center justify-center">
            <span className="text-[#29C5E8]">NXT</span>
            <span className="text-[#FF6F00]">GEN</span>
            <span className="ml-2 text-white">ROXAS</span>
          </h1>

          <p className="text-xs sm:text-sm text-slate-300 font-medium">
            Attendance Management & Child Safety System
          </p>
        </div>

        {/* 3-Seconds Progress Indicator */}
        <div className="w-full max-w-xs space-y-2 pt-2">
          <div className="w-full h-2 rounded-full bg-slate-800/80 border border-slate-700/60 overflow-hidden p-0.5">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#29C5E8] via-[#38bdf8] to-[#FF6F00] transition-all duration-75 shadow-sm"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
            <span className="text-[#29C5E8] font-bold">Initializing System...</span>
            <button
              type="button"
              onClick={onComplete}
              className="text-slate-400 hover:text-white underline cursor-pointer text-[10px]"
            >
              Skip
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

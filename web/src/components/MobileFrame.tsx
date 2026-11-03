import React, { useState, useEffect } from 'react';
import { Wifi, BatteryMedium, Signal } from 'lucide-react';

interface MobileFrameProps {
  children: React.ReactNode;
  activeSimLabel?: string;
}

export const MobileFrame: React.FC<MobileFrameProps> = ({ children, activeSimLabel = 'SIM 1 HR' }) => {
  const [currentTime, setCurrentTime] = useState<string>('09:41');

  useEffect(() => {
    const update = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })
      );
    };
    update();
    const interval = setInterval(update, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative mx-auto w-[380px] h-[780px] bg-slate-900 rounded-[50px] p-3 shadow-2xl shadow-brand-500/10 border-4 border-slate-700/80 ring-1 ring-white/10 flex flex-col overflow-hidden select-none">
      {/* Outer Phone Bezel Buttons */}
      <div className="absolute -left-[7px] top-[110px] w-[3px] h-[30px] bg-slate-600 rounded-l-sm" />
      <div className="absolute -left-[7px] top-[155px] w-[3px] h-[50px] bg-slate-600 rounded-l-sm" />
      <div className="absolute -left-[7px] top-[215px] w-[3px] h-[50px] bg-slate-600 rounded-l-sm" />
      <div className="absolute -right-[7px] top-[140px] w-[3px] h-[65px] bg-slate-600 rounded-r-sm" />

      {/* Screen Area */}
      <div className="relative w-full h-full bg-slate-950 rounded-[40px] overflow-hidden flex flex-col border border-slate-800">
        {/* Dynamic Island / Speaker Pill */}
        <div className="absolute top-2.5 left-1/2 -translate-x-1/2 z-50 flex items-center justify-center">
          <div className="w-28 h-6 bg-black rounded-full flex items-center justify-between px-3.5 shadow-inner">
            <div className="w-2.5 h-2.5 rounded-full bg-slate-900 ring-1 ring-slate-800" />
            <div className="w-10 h-1 bg-slate-800 rounded-full" />
            <div className="w-2 h-2 rounded-full bg-blue-950 ring-1 ring-blue-800" />
          </div>
        </div>

        {/* Status Bar */}
        <div className="h-10 pt-2.5 px-6 flex items-center justify-between text-xs font-semibold text-slate-300 z-40 bg-slate-950/60 backdrop-blur-md">
          <span className="font-mono">{currentTime}</span>

          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-brand-900/60 text-brand-300 border border-brand-700/50">
              {activeSimLabel}
            </span>
            <Signal className="w-3.5 h-3.5 text-emerald-400" />
            <Wifi className="w-3.5 h-3.5 text-slate-300" />
            <BatteryMedium className="w-4 h-4 text-slate-300" />
          </div>
        </div>

        {/* App Content */}
        <div className="flex-1 overflow-hidden relative flex flex-col">
          {children}
        </div>

        {/* Home Navigation Pill Bar */}
        <div className="h-6 flex items-center justify-center bg-slate-950">
          <div className="w-32 h-1 bg-slate-600 rounded-full" />
        </div>
      </div>
    </div>
  );
};

import { useState, useEffect, ReactNode } from 'react';
import { Wifi, Battery, Smartphone, Maximize2, Minimize2, Sparkles, Bell } from 'lucide-react';

interface IPhone16FrameProps {
  children: ReactNode;
  activeAlert?: string | null;
  budgetStatus?: { isOver: boolean; percent: number; text: string };
}

export type TitaniumColor = 'desert' | 'natural' | 'black' | 'white';

export const IPhone16Frame = ({
  children,
  activeAlert,
  budgetStatus,
}: IPhone16FrameProps) => {
  const [timeStr, setTimeStr] = useState('09:41');
  const [isDynamicIslandExpanded, setIsDynamicIslandExpanded] = useState(false);
  const [colorFinish, setColorFinish] = useState<TitaniumColor>('desert');
  const [isDeviceFramed, setIsDeviceFramed] = useState(true);

  // Live time updater
  useEffect(() => {
    const update = () => {
      const now = new Date();
      const h = String(now.getHours()).padStart(2, '0');
      const m = String(now.getMinutes()).padStart(2, '0');
      setTimeStr(`${h}:${m}`);
    };
    update();
    const timer = setInterval(update, 10000);
    return () => clearInterval(timer);
  }, []);

  // Finish border and frame styles for iPhone 16 Pro Max
  const frameBorderStyles: Record<TitaniumColor, { ring: string; outerBg: string; name: string }> = {
    desert: {
      ring: 'border-[#cfb79f] shadow-[0_25px_60px_-15px_rgba(180,145,115,0.35)]',
      outerBg: 'bg-gradient-to-b from-[#e3d3c2] via-[#cfb79f] to-[#be9f83]',
      name: 'Desert Titanium',
    },
    natural: {
      ring: 'border-[#9c9a96] shadow-[0_25px_60px_-15px_rgba(140,140,140,0.35)]',
      outerBg: 'bg-gradient-to-b from-[#bab7b2] via-[#9e9b96] to-[#888681]',
      name: 'Natural Titanium',
    },
    black: {
      ring: 'border-[#3a393d] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.5)]',
      outerBg: 'bg-gradient-to-b from-[#48464b] via-[#2f2e32] to-[#1e1d21]',
      name: 'Black Titanium',
    },
    white: {
      ring: 'border-[#e3e3e4] shadow-[0_25px_60px_-15px_rgba(200,200,200,0.4)]',
      outerBg: 'bg-gradient-to-b from-[#f5f5f7] via-[#e5e5e7] to-[#d6d6d8]',
      name: 'White Titanium',
    },
  };

  return (
    <div className="min-h-screen bg-slate-900/95 text-slate-100 flex flex-col items-center justify-center sm:py-6 sm:px-4 selection:bg-amber-500/20">
      {/* Top Floating Device Control Bar (visible on sm/desktop) */}
      <div className="hidden sm:flex items-center justify-between gap-4 w-full max-w-[480px] mb-3 px-3 py-1.5 rounded-full bg-slate-800/80 backdrop-blur-md border border-slate-700/60 text-xs text-slate-300 shadow-lg">
        <div className="flex items-center gap-1.5">
          <Smartphone className="w-3.5 h-3.5 text-amber-400" />
          <span className="font-semibold text-white tracking-tight">iPhone 16 Pro Max</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-400/15 text-amber-300 font-medium">
            6.9" Super Retina XDR
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Finish selector */}
          <div className="flex items-center gap-1">
            {(['desert', 'natural', 'black', 'white'] as TitaniumColor[]).map(c => (
              <button
                key={c}
                onClick={() => setColorFinish(c)}
                title={frameBorderStyles[c].name}
                className={`w-3.5 h-3.5 rounded-full transition-transform ${
                  colorFinish === c ? 'scale-125 ring-2 ring-white' : 'opacity-70 hover:opacity-100'
                } ${
                  c === 'desert'
                    ? 'bg-[#cfb79f]'
                    : c === 'natural'
                    ? 'bg-[#9c9a96]'
                    : c === 'black'
                    ? 'bg-[#2b2a2e]'
                    : 'bg-[#f0f0f2]'
                }`}
              />
            ))}
          </div>

          <div className="h-3 w-px bg-slate-700" />

          {/* Toggle framed device vs fluid view */}
          <button
            onClick={() => setIsDeviceFramed(!isDeviceFramed)}
            className="flex items-center gap-1 text-[11px] text-slate-300 hover:text-white px-2 py-0.5 rounded-full hover:bg-slate-700/60 transition-colors"
          >
            {isDeviceFramed ? (
              <>
                <Maximize2 className="w-3 h-3" />
                <span>ขยายจอ</span>
              </>
            ) : (
              <>
                <Minimize2 className="w-3 h-3" />
                <span>กรอบ iPhone</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main iPhone 16 Pro Max Chassis */}
      <div
        className={`relative transition-all duration-300 ${
          isDeviceFramed
            ? `w-full sm:w-[436px] sm:h-[915px] sm:max-h-[96vh] sm:rounded-[56px] sm:p-[10px] ${frameBorderStyles[colorFinish].outerBg} sm:shadow-2xl shadow-black/70 ring-1 ring-white/20`
            : 'w-full max-w-2xl min-h-screen sm:rounded-none p-0 bg-slate-900'
        }`}
      >
        {/* Hardware side buttons (visible when framed on desktop) */}
        {isDeviceFramed && (
          <>
            {/* Top speaker ear piece slot */}
            <div className="hidden sm:block absolute top-[6px] left-1/2 -translate-x-1/2 w-14 h-[3px] bg-slate-800/90 rounded-full z-40" />

            {/* Left side: Action button */}
            <div className="hidden sm:block absolute -left-[4px] top-[125px] w-[4px] h-[30px] bg-slate-300 rounded-l-sm shadow-sm" />
            {/* Left side: Volume up */}
            <div className="hidden sm:block absolute -left-[4px] top-[175px] w-[4px] h-[54px] bg-slate-300 rounded-l-sm shadow-sm" />
            {/* Left side: Volume down */}
            <div className="hidden sm:block absolute -left-[4px] top-[242px] w-[4px] h-[54px] bg-slate-300 rounded-l-sm shadow-sm" />

            {/* Right side: Power / Side button */}
            <div className="hidden sm:block absolute -right-[4px] top-[190px] w-[4px] h-[78px] bg-slate-300 rounded-r-sm shadow-sm" />
            {/* Right side: iPhone 16 Pro Max Camera Control button (touch capacitive recessed) */}
            <div
              className="hidden sm:block absolute -right-[4px] top-[590px] w-[4px] h-[50px] bg-slate-400 rounded-r-sm shadow-inner cursor-pointer"
              title="iPhone 16 Camera Control"
            />
          </>
        )}

        {/* Display Screen Container */}
        <div
          className={`relative w-full h-full bg-slate-50 text-slate-900 overflow-hidden flex flex-col ${
            isDeviceFramed
              ? 'sm:rounded-[47px] sm:border-[4px] sm:border-black shadow-inner [transform:translateZ(0)]'
              : 'min-h-screen'
          }`}
        >
          {/* iOS 18 Status Bar & Dynamic Island */}
          <div className="sticky top-0 z-50 bg-slate-50/90 backdrop-blur-md pt-2.5 sm:pt-3 px-6 pb-2 select-none border-b border-slate-200/40">
            <div className="flex items-center justify-between h-7 relative">
              {/* Left: Time & Location */}
              <div className="w-16 flex items-center text-[13px] font-semibold tracking-tight text-slate-900 font-sans pl-1">
                <span>{timeStr}</span>
              </div>

              {/* Center: Dynamic Island */}
              <div
                id="iphone-dynamic-island"
                onClick={() => setIsDynamicIslandExpanded(!isDynamicIslandExpanded)}
                className={`cursor-pointer transition-all duration-300 ease-spring bg-black text-white flex items-center justify-between px-3 py-1 rounded-full shadow-md select-none ${
                  isDynamicIslandExpanded
                    ? 'w-72 sm:w-80 h-11 ring-2 ring-emerald-500/40 shadow-emerald-950/20'
                    : 'w-28 sm:w-32 h-7.5 hover:scale-105'
                }`}
              >
                {/* Left side inside Dynamic Island */}
                <div className="flex items-center gap-1.5 min-w-0">
                  <div className="w-2.5 h-2.5 rounded-full bg-slate-800 border border-slate-700/80 shrink-0 flex items-center justify-center">
                    <div className="w-1 h-1 rounded-full bg-cyan-500/80 animate-ping" />
                  </div>
                  {isDynamicIslandExpanded ? (
                    <span className="text-[11px] font-medium text-slate-200 truncate">
                      {budgetStatus?.text || 'ระบบบันทึกรายรับรายจ่าย'}
                    </span>
                  ) : (
                    <span className="text-[10px] font-semibold text-emerald-400 flex items-center gap-0.5">
                      <Sparkles className="w-2.5 h-2.5" />
                      <span>{budgetStatus?.percent ? `${budgetStatus.percent.toFixed(0)}%` : 'Budget'}</span>
                    </span>
                  )}
                </div>

                {/* Center / Camera lens indicator */}
                <div className="w-2.5 h-2.5 rounded-full bg-slate-900 border border-slate-700/60 mx-1 shrink-0" />

                {/* Right side inside Dynamic Island */}
                <div className="flex items-center justify-end shrink-0">
                  {isDynamicIslandExpanded ? (
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                        budgetStatus?.isOver ? 'bg-rose-500 text-white' : 'bg-emerald-500 text-white'
                      }`}
                    >
                      {budgetStatus?.isOver ? 'เตือนงบ' : 'ปกติ'}
                    </span>
                  ) : (
                    <div className="flex items-center gap-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    </div>
                  )}
                </div>
              </div>

              {/* Right: Cellular, WiFi, Battery */}
              <div className="w-16 flex items-center justify-end gap-1.5 text-slate-800 pr-1">
                {/* 5G signal bars */}
                <div className="flex items-end gap-[1.5px] h-2.5">
                  <div className="w-[2.5px] h-1 bg-slate-800 rounded-2xs" />
                  <div className="w-[2.5px] h-1.5 bg-slate-800 rounded-2xs" />
                  <div className="w-[2.5px] h-2 bg-slate-800 rounded-2xs" />
                  <div className="w-[2.5px] h-2.5 bg-slate-800 rounded-2xs" />
                </div>
                <Wifi className="w-3.5 h-3.5" />
                <div className="flex items-center gap-0.5">
                  <span className="text-[10px] font-bold leading-none">88</span>
                  <Battery className="w-4 h-4 fill-slate-800" />
                </div>
              </div>
            </div>

            {/* Dynamic Island Quick Expansion Sub-panel */}
            {isDynamicIslandExpanded && (
              <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-600 animate-in fade-in">
                <span className="flex items-center gap-1 text-slate-700">
                  <Bell className="w-3.5 h-3.5 text-amber-500" />
                  <span>iPhone 16 Pro Max Dynamic Island</span>
                </span>
                <span className="text-emerald-700 font-semibold">แตะเพื่อย่อ</span>
              </div>
            )}
          </div>

          {/* Screen Content Scroll Area */}
          <div className="flex-1 overflow-y-auto no-scrollbar relative flex flex-col">
            {children}

            {/* Bottom iOS Home Indicator Bar */}
            <div className="sticky bottom-0 z-30 pt-1 pb-2 bg-gradient-to-t from-white/95 via-white/80 to-transparent pointer-events-none flex justify-center items-center">
              <div className="w-32 sm:w-36 h-1 bg-slate-900/80 rounded-full" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

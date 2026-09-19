import { useState, useEffect, ReactNode, RefObject } from 'react';
import { Wifi, Battery, Smartphone, Monitor, Sparkles, Bell, Camera, Download, Home, Loader2, Receipt } from 'lucide-react';

interface IPhone16FrameProps {
  children: ReactNode;
  activeAlert?: string | null;
  budgetStatus?: { isOver: boolean; percent: number; text: string };
  onCaptureScreen?: () => void;
  onOpenDailySlip?: () => void;
  onOpenSlipScanner?: () => void;
  isCapturing?: boolean;
  screenRef?: RefObject<HTMLDivElement | null>;
  isDeviceFramed: boolean;
  onToggleDeviceFrame: () => void;
}

export type TitaniumColor = 'desert' | 'natural' | 'black' | 'white' | 'blue';

export const IPhone16Frame = ({
  children,
  activeAlert,
  budgetStatus,
  onCaptureScreen,
  onOpenDailySlip,
  onOpenSlipScanner,
  isCapturing = false,
  screenRef,
  isDeviceFramed,
  onToggleDeviceFrame,
}: IPhone16FrameProps) => {
  const [timeStr, setTimeStr] = useState('09:41');
  const [isDynamicIslandExpanded, setIsDynamicIslandExpanded] = useState(false);
  const [colorFinish, setColorFinish] = useState<TitaniumColor>('blue');
  const [showShutterFlash, setShowShutterFlash] = useState(false);

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

  // Listen for capture action to trigger shutter flash and show daily expense slip
  const handleCaptureClick = () => {
    setShowShutterFlash(true);
    setTimeout(() => setShowShutterFlash(false), 300);
    if (onOpenDailySlip) {
      onOpenDailySlip();
    } else if (onCaptureScreen) {
      onCaptureScreen();
    }
  };

  // Finish border and frame styles for iPhone 16 Pro Max
  const frameBorderStyles: Record<TitaniumColor, { ring: string; outerBg: string; name: string; dot: string }> = {
    blue: {
      ring: 'border-[#1e3a8a] shadow-[0_25px_60px_-15px_rgba(30,58,138,0.5)]',
      outerBg: 'bg-gradient-to-b from-[#2563eb] via-[#1e3a8a] to-[#0f172a]',
      name: 'Blue Titanium (สีน้ำเงินพรีเมียม)',
      dot: 'bg-gradient-to-br from-blue-500 to-indigo-900',
    },
    desert: {
      ring: 'border-[#cfb79f] shadow-[0_25px_60px_-15px_rgba(180,145,115,0.35)]',
      outerBg: 'bg-gradient-to-b from-[#e3d3c2] via-[#cfb79f] to-[#be9f83]',
      name: 'Desert Titanium',
      dot: 'bg-[#cfb79f]',
    },
    natural: {
      ring: 'border-[#9c9a96] shadow-[0_25px_60px_-15px_rgba(140,140,140,0.35)]',
      outerBg: 'bg-gradient-to-b from-[#bab7b2] via-[#9e9b96] to-[#888681]',
      name: 'Natural Titanium',
      dot: 'bg-[#9c9a96]',
    },
    black: {
      ring: 'border-[#3a393d] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.5)]',
      outerBg: 'bg-gradient-to-b from-[#48464b] via-[#2f2e32] to-[#1e1d21]',
      name: 'Black Titanium',
      dot: 'bg-[#2b2a2e]',
    },
    white: {
      ring: 'border-[#e3e3e4] shadow-[0_25px_60px_-15px_rgba(200,200,200,0.4)]',
      outerBg: 'bg-gradient-to-b from-[#f5f5f7] via-[#e5e5e7] to-[#d6d6d8]',
      name: 'White Titanium',
      dot: 'bg-[#f0f0f2]',
    },
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-start sm:justify-center sm:py-6 sm:px-4 selection:bg-blue-600/30">
      {/* Top Floating Device Control Bar (visible on sm/desktop) */}
      <div className="w-full max-w-2xl sm:max-w-4xl mb-2 sm:mb-3 px-3 py-1.5 rounded-2xl sm:rounded-full bg-slate-900/90 backdrop-blur-md border border-slate-800 text-xs text-slate-300 shadow-xl flex flex-wrap items-center justify-between gap-2 z-40">
        <div className="flex items-center gap-2">
          {/* App Brand & Icon preview */}
          <div className="flex items-center gap-1.5 p-1">
            <div className="relative">
              <img
                src="/apple-touch-icon.png"
                alt="กระเป๋าตังสีแดง"
                className="w-5 h-5 rounded-md object-cover shadow-sm"
                referrerPolicy="no-referrer"
              />
              <span className="absolute -bottom-0.5 -right-0.5 w-1.5 h-1.5 bg-rose-500 rounded-full" />
            </div>
            <span className="font-bold text-white text-xs tracking-tight">กระเป๋าตัง</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-blue-500/20 text-blue-300 font-semibold border border-blue-500/30">
              โอนเงิน & แคปสลิป
            </span>
          </div>

          <span className="text-slate-600 hidden sm:inline">|</span>

          {/* Mode Badge */}
          <div className="hidden sm:flex items-center gap-1 text-[11px] text-slate-400">
            {isDeviceFramed ? (
              <>
                <Smartphone className="w-3.5 h-3.5 text-blue-400" />
                <span className="text-slate-200 font-medium">iPhone 16 Pro Max</span>
              </>
            ) : (
              <>
                <Monitor className="w-3.5 h-3.5 text-sky-400" />
                <span className="text-slate-200 font-medium">Web View (เต็มจอ)</span>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 ml-auto">
          {/* Slip Scanner Quick Button */}
          {onOpenSlipScanner && (
            <button
              id="btn-topbar-slip-scanner"
              onClick={onOpenSlipScanner}
              className="flex items-center gap-1 text-[11px] font-semibold text-sky-200 hover:text-white bg-slate-800 hover:bg-slate-700 active:scale-95 px-2.5 py-1 rounded-full border border-sky-500/30 transition-all shadow-xs"
              title="จดบันทึกรายจ่ายอัตโนมัติจากสลิปโอนเงินผ่าน AI"
            >
              <Sparkles className="w-3 h-3 text-cyan-400" />
              <span>สแกนสลิปโอน</span>
            </button>
          )}

          {/* Daily Expense Slip Quick Shortcut Button */}
          <button
            id="btn-capture-screen-topbar"
            onClick={handleCaptureClick}
            disabled={isCapturing}
            className="flex items-center gap-1 text-[11px] font-semibold text-white bg-blue-600 hover:bg-blue-500 active:scale-95 px-2.5 py-1 rounded-full shadow-sm transition-all"
            title="ปุ่มลัด: แคปดูรูปสลิปสรุปรายจ่ายประจำวัน (หรือกดปุ่ม Camera Control ข้างเครื่อง / Ctrl+S)"
          >
            {isCapturing ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Camera className="w-3.5 h-3.5" />
            )}
            <span>แคปสลิปประจำวัน</span>
            <span className="hidden sm:inline text-[9px] bg-blue-800/80 px-1 py-0.2 rounded text-blue-200 ml-0.5">
              Ctrl+S
            </span>
          </button>

          {/* Titanium Colors (only when framed) */}
          {isDeviceFramed && (
            <div className="hidden sm:flex items-center gap-1 pl-1 border-l border-slate-700/80">
              {(['blue', 'desert', 'natural', 'black', 'white'] as TitaniumColor[]).map(c => (
                <button
                  key={c}
                  onClick={() => setColorFinish(c)}
                  title={frameBorderStyles[c].name}
                  className={`w-3.5 h-3.5 rounded-full transition-transform ${
                    colorFinish === c ? 'scale-125 ring-2 ring-blue-400' : 'opacity-70 hover:opacity-100'
                  } ${frameBorderStyles[c].dot}`}
                />
              ))}
            </div>
          )}

          {/* Toggle framed device vs fluid web view */}
          <button
            id="btn-toggle-frame-mode"
            onClick={onToggleDeviceFrame}
            className="flex items-center gap-1.5 text-[11px] font-medium text-slate-200 hover:text-white px-2.5 py-1 rounded-full bg-slate-800 hover:bg-slate-700 border border-slate-700/80 transition-colors"
            title="สลับมุมมองระหว่างกรอบ iPhone 16 Pro Max และหน้าจอเว็บเต็มตา"
          >
            {isDeviceFramed ? (
              <>
                <Monitor className="w-3 h-3 text-sky-400" />
                <span>โหมดหน้าเว็บ</span>
              </>
            ) : (
              <>
                <Smartphone className="w-3 h-3 text-blue-400" />
                <span>โหมด iPhone</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Container: Either iPhone 16 Pro Max Chassis or Full Responsive Web Layout */}
      <div
        className={`relative transition-all duration-300 ${
          isDeviceFramed
            ? `w-full sm:w-[436px] sm:h-[915px] sm:max-h-[95vh] sm:rounded-[56px] sm:p-[10px] ${frameBorderStyles[colorFinish].outerBg} sm:shadow-2xl shadow-black/80 ring-1 ring-blue-500/20`
            : 'w-full max-w-4xl min-h-[90vh] bg-slate-900 sm:rounded-3xl border border-slate-800 shadow-2xl p-0 sm:p-2'
        }`}
      >
        {/* Hardware side buttons (visible when framed on desktop) */}
        {isDeviceFramed && (
          <>
            {/* Top speaker ear piece slot */}
            <div className="hidden sm:block absolute top-[6px] left-1/2 -translate-x-1/2 w-14 h-[3px] bg-slate-900/90 rounded-full z-40" />

            {/* Left side: Action button */}
            <div className="hidden sm:block absolute -left-[4px] top-[125px] w-[4px] h-[30px] bg-slate-300 rounded-l-sm shadow-sm" />
            {/* Left side: Volume up */}
            <div className="hidden sm:block absolute -left-[4px] top-[175px] w-[4px] h-[54px] bg-slate-300 rounded-l-sm shadow-sm" />
            {/* Left side: Volume down */}
            <div className="hidden sm:block absolute -left-[4px] top-[242px] w-[4px] h-[54px] bg-slate-300 rounded-l-sm shadow-sm" />

            {/* Right side: Power / Side button */}
            <div className="hidden sm:block absolute -right-[4px] top-[190px] w-[4px] h-[78px] bg-slate-300 rounded-r-sm shadow-sm" />
            {/* Right side: iPhone 16 Pro Max Camera Control button (Interactive - triggers daily expense slip capture!) */}
            <button
              id="btn-iphone-camera-control"
              onClick={handleCaptureClick}
              disabled={isCapturing}
              className="hidden sm:block absolute -right-[4px] top-[590px] w-[4px] h-[50px] bg-blue-300 hover:bg-white rounded-r-sm shadow-inner cursor-pointer transition-colors active:scale-95"
              title="ปุ่มลัด Camera Control ของ iPhone 16 - แตะเพื่อเปิดสลิปสรุปรายจ่ายประจำวันทันที"
            />
          </>
        )}

        {/* Display Screen Container (Target of screenshot capture) */}
        <div
          ref={screenRef}
          className={`relative w-full h-full bg-slate-50 text-slate-900 overflow-hidden flex flex-col ${
            isDeviceFramed
              ? 'sm:rounded-[47px] sm:border-[4px] sm:border-black shadow-inner [transform:translateZ(0)]'
              : 'sm:rounded-2xl min-h-[85vh]'
          }`}
        >
          {/* iOS Shutter Flash Effect Animation */}
          {showShutterFlash && (
            <div className="absolute inset-0 z-50 bg-white opacity-80 pointer-events-none animate-out fade-out duration-300" />
          )}

          {/* iOS 18 Status Bar & Dynamic Island (Only in iPhone framed mode or mobile) */}
          {isDeviceFramed ? (
            <div className="sticky top-0 z-40 bg-slate-50/95 backdrop-blur-md pt-2.5 sm:pt-3 px-6 pb-2 select-none border-b border-slate-200/50">
              <div className="flex items-center justify-between h-7 relative">
                {/* Left: Time */}
                <div className="w-16 flex items-center text-[13px] font-semibold tracking-tight text-slate-900 font-sans pl-1">
                  <span>{timeStr}</span>
                </div>

                {/* Center: Dynamic Island */}
                <div
                  id="iphone-dynamic-island"
                  onClick={() => setIsDynamicIslandExpanded(!isDynamicIslandExpanded)}
                  className={`cursor-pointer transition-all duration-300 ease-spring bg-black text-white flex items-center justify-between px-3 py-1 rounded-full shadow-md select-none ${
                    isDynamicIslandExpanded
                      ? 'w-72 sm:w-80 h-11 ring-2 ring-blue-500/50 shadow-blue-950/30'
                      : 'w-28 sm:w-32 h-7.5 hover:scale-105'
                  }`}
                >
                  {/* Left side inside Dynamic Island */}
                  <div className="flex items-center gap-1.5 min-w-0">
                    <div className="w-2.5 h-2.5 rounded-full bg-slate-800 border border-slate-700/80 shrink-0 flex items-center justify-center">
                      <div className="w-1 h-1 rounded-full bg-blue-400 animate-ping" />
                    </div>
                    {isDynamicIslandExpanded ? (
                      <span className="text-[11px] font-medium text-slate-200 truncate">
                        {budgetStatus?.text || 'ระบบบันทึกรายรับรายจ่าย'}
                      </span>
                    ) : (
                      <span className="text-[10px] font-semibold text-sky-400 flex items-center gap-0.5">
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
                          budgetStatus?.isOver ? 'bg-rose-500 text-white' : 'bg-blue-500 text-white'
                        }`}
                      >
                        {budgetStatus?.isOver ? 'เตือนงบ' : 'ปกติ'}
                      </span>
                    ) : (
                      <div className="flex items-center gap-1">
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                      </div>
                    )}
                  </div>
                </div>

                {/* Right: Cellular, WiFi, Battery */}
                <div className="w-16 flex items-center justify-end gap-1.5 text-slate-800 pr-1">
                  <div className="flex items-end gap-[1.5px] h-2.5">
                    <div className="w-[2.5px] h-1 bg-slate-800 rounded-2xs" />
                    <div className="w-[2.5px] h-1.5 bg-slate-800 rounded-2xs" />
                    <div className="w-[2.5px] h-2 bg-slate-800 rounded-2xs" />
                    <div className="w-[2.5px] h-2.5 bg-slate-800 rounded-2xs" />
                  </div>
                  <Wifi className="w-3.5 h-3.5" />
                  <div className="flex items-center gap-0.5">
                    <span className="text-[10px] font-bold leading-none">94</span>
                    <Battery className="w-4 h-4 fill-slate-800" />
                  </div>
                </div>
              </div>

              {/* Dynamic Island Expanded Quick Menu */}
              {isDynamicIslandExpanded && (
                <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-600 animate-in fade-in">
                  <span className="flex items-center gap-1 text-slate-700 font-medium">
                    <Bell className="w-3.5 h-3.5 text-blue-600" />
                    <span>iPhone 16 Pro Max Dynamic Island</span>
                  </span>
                  <button
                    onClick={handleCaptureClick}
                    className="text-blue-600 font-bold hover:underline flex items-center gap-1"
                  >
                    <Receipt className="w-3 h-3" />
                    <span>สลิปรายจ่ายวันนี้</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* Web View Desktop Subheader */
            <div className="bg-slate-900 text-white px-4 py-2 border-b border-slate-800 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-blue-600/30 text-blue-300 font-bold border border-blue-500/30 text-[10px]">
                  Web Full View
                </span>
                <span className="text-slate-300 font-medium">มุมมองหน้าเว็บเต็มจอ</span>
              </div>
              <div className="flex items-center gap-3 text-slate-400 text-[11px]">
                {onOpenSlipScanner && (
                  <button
                    onClick={onOpenSlipScanner}
                    className="text-sky-300 hover:text-white flex items-center gap-1 font-medium transition-colors"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                    <span>สแกนสลิปโอนเงิน</span>
                  </button>
                )}
                <button
                  onClick={handleCaptureClick}
                  className="text-blue-400 hover:text-white flex items-center gap-1 font-medium transition-colors"
                  title="กดปุ่มลัด Ctrl+S หรือคลิกที่นี่เพื่อดูสลิปสรุปรายจ่ายประจำวัน"
                >
                  <Receipt className="w-3.5 h-3.5" />
                  <span>สลิปรายจ่ายประจำวัน (Ctrl+S)</span>
                </button>
              </div>
            </div>
          )}

          {/* Screen Content Scroll Area */}
          <div className="flex-1 overflow-y-auto no-scrollbar relative flex flex-col bg-slate-50">
            {children}

            {/* Bottom iOS Home Indicator Bar (in framed mode) */}
            {isDeviceFramed && (
              <div className="sticky bottom-0 z-30 pt-1 pb-2 bg-gradient-to-t from-white/95 via-white/80 to-transparent pointer-events-none flex justify-center items-center">
                <div className="w-32 sm:w-36 h-1 bg-slate-900/80 rounded-full" />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

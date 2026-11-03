import React, { useState, useEffect } from 'react';
import { 
  Wifi, Battery, Smartphone, Monitor, RotateCw, 
  Volume2, VolumeX, Sparkles, Radio
} from 'lucide-react';
import { Channel } from '../types/iptv';

interface IPhoneShellProps {
  children: React.ReactNode;
  activeChannel?: Channel | null;
  isPlaying?: boolean;
  onVolumeChange?: (delta: number) => void;
  isCinemaLandscape?: boolean;
  onToggleCinemaOrientation?: () => void;
}

export const IPhoneShell: React.FC<IPhoneShellProps> = ({
  children,
  activeChannel,
  isPlaying,
  onVolumeChange,
  isCinemaLandscape = false,
  onToggleCinemaOrientation
}) => {
  const [currentTime, setCurrentTime] = useState<string>('9:41');
  const [isDeviceFrameEnabled, setIsDeviceFrameEnabled] = useState<boolean>(true);
  const [scale, setScale] = useState<number>(0.92);

  // Sync clock to live local time
  useEffect(() => {
    const update = () => {
      const now = new Date();
      const hours = now.getHours();
      const mins = now.getMinutes().toString().padStart(2, '0');
      setCurrentTime(`${hours}:${mins}`);
    };
    update();
    const interval = setInterval(update, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-start text-slate-100 overflow-x-hidden selection:bg-purple-600 selection:text-white">
      {/* Top Device Bar (Simulator Controls) */}
      <header className="w-full bg-slate-900/90 border-b border-slate-800/80 px-4 py-2.5 flex items-center justify-between text-xs sticky top-0 z-40 backdrop-blur-md">
        {/* Brand Zone */}
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-purple-600 to-indigo-500 flex items-center justify-center font-black text-white text-[11px] shadow-sm">
            IP
          </div>
          <span className="font-extrabold tracking-tight text-white whitespace-nowrap">
            Smarters IPTV Pro
          </span>
          <span className="text-[10px] text-purple-400 font-mono hidden sm:inline">
            iOS Edition
          </span>
        </div>

        {/* Center / Right controls */}
        <div className="flex items-center gap-2">
          {/* Orientation Toggle */}
          {onToggleCinemaOrientation && (
            <button
              onClick={onToggleCinemaOrientation}
              className={`px-2.5 py-1.5 rounded-lg border flex items-center gap-1.5 text-xs font-semibold transition-all ${
                isCinemaLandscape
                  ? 'bg-purple-600 text-white border-purple-500'
                  : 'bg-slate-800 text-slate-300 border-slate-700 hover:text-white'
              }`}
              title="Toggle iPhone Orientation"
            >
              <RotateCw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{isCinemaLandscape ? 'Cinema 19.5:9' : 'Portrait'}</span>
            </button>
          )}

          {/* Device Frame vs Full Web Mode */}
          <div className="flex items-center bg-slate-800 p-0.5 rounded-lg border border-slate-700">
            <button
              onClick={() => setIsDeviceFrameEnabled(true)}
              className={`px-2.5 py-1 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                isDeviceFrameEnabled
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">iPhone 16 Pro</span>
            </button>
            <button
              onClick={() => setIsDeviceFrameEnabled(false)}
              className={`px-2.5 py-1 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                !isDeviceFrameEnabled
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Monitor className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Full Window</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="w-full flex-1 flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
        {isDeviceFrameEnabled ? (
          /* Realistic iPhone 16 Pro Titanium Frame */
          <div
            style={{ transform: `scale(${scale})`, transformOrigin: 'top center' }}
            className={`transition-all duration-300 relative my-2 ${
              isCinemaLandscape
                ? 'w-[844px] h-[390px] max-w-[95vw]'
                : 'w-[393px] h-[852px] max-w-[95vw]'
            }`}
          >
            {/* Outer Titanium Chassis */}
            <div className="w-full h-full rounded-[52px] p-[10px] bg-gradient-to-b from-slate-700 via-slate-800 to-slate-900 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9),0_0_0_1px_rgba(255,255,255,0.15)] relative">
              {/* Antenna bands */}
              <div className="absolute top-28 -left-[2px] w-[3px] h-3 bg-slate-600 rounded-sm" />
              <div className="absolute top-28 -right-[2px] w-[3px] h-3 bg-slate-600 rounded-sm" />

              {/* Physical Clickable Hardware Volume Buttons (Left) */}
              {!isCinemaLandscape && (
                <>
                  <button
                    onClick={() => onVolumeChange && onVolumeChange(0.1)}
                    className="absolute top-28 -left-[14px] w-[4px] h-12 bg-slate-600 hover:bg-purple-500 rounded-l-md transition-colors active:translate-x-0.5"
                    title="Hardware Volume Up"
                  />
                  <button
                    onClick={() => onVolumeChange && onVolumeChange(-0.1)}
                    className="absolute top-44 -left-[14px] w-[4px] h-12 bg-slate-600 hover:bg-purple-500 rounded-l-md transition-colors active:translate-x-0.5"
                    title="Hardware Volume Down"
                  />
                </>
              )}

              {/* Screen Bezel Frame */}
              <div className="w-full h-full rounded-[44px] bg-black overflow-hidden relative flex flex-col border-[4px] border-black">
                {/* iOS Dynamic Island & Status Bar (Portrait) */}
                {!isCinemaLandscape && (
                  <div className="pt-2 px-6 pb-1 bg-black text-white shrink-0 flex items-center justify-between z-30 select-none">
                    {/* Clock */}
                    <span className="text-[14px] font-semibold tracking-tight text-white pl-1 font-mono">
                      {currentTime}
                    </span>

                    {/* Dynamic Island */}
                    <div className="w-28 h-7 bg-black rounded-full px-2.5 flex items-center justify-between shadow-xs border border-white/5 relative group cursor-pointer">
                      <div className="flex items-center gap-1.5 truncate">
                        <span className={`w-2 h-2 rounded-full ${isPlaying ? 'bg-emerald-500 animate-pulse' : 'bg-slate-600'}`} />
                        <span className="text-[10px] font-bold text-slate-200 truncate max-w-[55px]">
                          {activeChannel ? activeChannel.name : 'IPTV'}
                        </span>
                      </div>
                      <Radio className="w-3 h-3 text-purple-400 shrink-0" />
                    </div>

                    {/* iOS Icons (Cellular, WiFi, Battery) */}
                    <div className="flex items-center gap-1.5 text-white pr-1">
                      {/* Signal bars */}
                      <div className="flex items-end gap-0.5 h-3">
                        <span className="w-[3px] h-1 bg-white rounded-xs" />
                        <span className="w-[3px] h-1.5 bg-white rounded-xs" />
                        <span className="w-[3px] h-2 bg-white rounded-xs" />
                        <span className="w-[3px] h-2.5 bg-white rounded-xs" />
                      </div>
                      <Wifi className="w-3.5 h-3.5" />
                      {/* Battery */}
                      <div className="w-5 h-2.5 border border-white/90 rounded-sm p-0.5 flex items-center relative">
                        <div className="h-full w-full bg-white rounded-xs" />
                        <div className="w-0.5 h-1 bg-white/90 absolute -right-1 top-0.5 rounded-r-xs" />
                      </div>
                    </div>
                  </div>
                )}

                {/* iPhone Screen Content */}
                <div className="flex-1 overflow-hidden flex flex-col relative bg-slate-950">
                  {children}
                </div>

                {/* iOS Home Indicator Bar */}
                <div className="h-5 bg-black w-full flex items-center justify-center shrink-0 z-30 select-none">
                  <div className="w-32 h-1 bg-white/60 rounded-full active:bg-white transition-colors" />
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Full Window Responsive View */
          <div className="w-full max-w-7xl h-[calc(100vh-65px)] bg-slate-950 rounded-2xl border border-slate-800 shadow-2xl overflow-hidden flex flex-col">
            {children}
          </div>
        )}
      </main>
    </div>
  );
};

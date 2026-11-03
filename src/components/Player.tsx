import React, { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';
import { 
  Play, Pause, Volume2, VolumeX, Maximize, Minimize, 
  RotateCcw, RotateCw, Cast, Tv, Radio, 
  Sliders, AlertCircle, ChevronLeft, ChevronRight, X, Clock
} from 'lucide-react';
import { Channel } from '../types/iptv';
import { getCurrentProgram } from '../utils/epgGenerator';
import { triggerNativeAirPlay } from '../utils/castManager';

interface PlayerProps {
  channel: Channel;
  channels: Channel[];
  onSelectChannel: (channel: Channel) => void;
  onOpenCastHub: () => void;
  onClose?: () => void;
}

export const Player: React.FC<PlayerProps> = ({
  channel,
  channels,
  onSelectChannel,
  onOpenCastHub,
  onClose
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const hlsRef = useRef<Hls | null>(null);

  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [volume, setVolume] = useState<number>(1);
  const [showControls, setShowControls] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [aspectRatio, setAspectRatio] = useState<'contain' | 'cover' | 'fill'>('contain');
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [showZapper, setShowZapper] = useState<boolean>(false);
  const [showSleepTimer, setShowSleepTimer] = useState<boolean>(false);
  const [sleepTimerMinutes, setSleepTimerMinutes] = useState<number | null>(null);

  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const currentProgram = channel.programs ? getCurrentProgram(channel.programs) : null;

  // Auto-hide controls after 4 seconds of inactivity
  const resetControlsTimeout = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying) {
        setShowControls(false);
      }
    }, 4000);
  };

  // Setup HLS or Native Video stream
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    setIsLoading(true);
    setError(null);

    // Destroy existing HLS instance if any
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    const streamUrl = channel.url;
    const isHls = streamUrl.includes('.m3u8') || streamUrl.includes('/hls/');

    if (isHls && Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        backBufferLength: 90
      });
      hlsRef.current = hls;

      hls.loadSource(streamUrl);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        setIsLoading(false);
        video.play().catch(() => {
          // Autoplay policy: mute and retry
          video.muted = true;
          setIsMuted(true);
          video.play().catch(e => console.warn('Autoplay blocked:', e));
        });
      });

      hls.on(Hls.Events.ERROR, (_event, data) => {
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              console.warn('HLS Network error, attempting recovery...', data);
              hls.startLoad();
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              console.warn('HLS Media error, attempting recovery...', data);
              hls.recoverMediaError();
              break;
            default:
              console.error('Fatal HLS error:', data);
              setError('Unable to load stream. The broadcaster may be offline.');
              setIsLoading(false);
              hls.destroy();
              break;
          }
        }
      });
    } else if (video.canPlayType('application/vnd.apple.mpegurl') || !isHls) {
      // Native Safari iOS HLS playback or direct MP4/stream
      video.src = streamUrl;
      video.addEventListener('loadedmetadata', () => {
        setIsLoading(false);
        video.play().catch(() => {
          video.muted = true;
          setIsMuted(true);
          video.play().catch(e => console.warn('Autoplay blocked:', e));
        });
      });
      video.addEventListener('error', () => {
        setError('Error loading video stream');
        setIsLoading(false);
      });
    } else {
      setError('HLS playback is not supported on this browser.');
      setIsLoading(false);
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, [channel.url]);

  // Handle Play / Pause toggle
  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play().then(() => setIsPlaying(true)).catch(console.warn);
    } else {
      video.pause();
      setIsPlaying(false);
    }
    resetControlsTimeout();
  };

  // Handle Mute toggle
  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    setIsMuted(video.muted);
  };

  // Handle volume change
  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    if (videoRef.current) {
      videoRef.current.volume = val;
      videoRef.current.muted = val === 0;
      setIsMuted(val === 0);
    }
  };

  // Skip 10s
  const handleSkip = (seconds: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime += seconds;
      resetControlsTimeout();
    }
  };

  // Picture in picture
  const togglePiP = async () => {
    const video = videoRef.current;
    if (!video) return;
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      } else if (document.pictureInPictureEnabled) {
        await video.requestPictureInPicture();
      }
    } catch (e) {
      console.warn('PiP not available', e);
    }
  };

  // Native AirPlay trigger
  const handleAirPlay = () => {
    const success = triggerNativeAirPlay(videoRef.current);
    if (!success) {
      onOpenCastHub();
    }
  };

  // Channel zapping (prev / next channel)
  const currentIndex = channels.findIndex(c => c.id === channel.id);
  const prevChannel = currentIndex > 0 ? channels[currentIndex - 1] : channels[channels.length - 1];
  const nextChannel = currentIndex < channels.length - 1 ? channels[currentIndex + 1] : channels[0];

  // Sleep timer handler
  useEffect(() => {
    if (!sleepTimerMinutes) return;
    const timer = setTimeout(() => {
      if (videoRef.current) {
        videoRef.current.pause();
        setIsPlaying(false);
      }
      setSleepTimerMinutes(null);
    }, sleepTimerMinutes * 60 * 1000);

    return () => clearTimeout(timer);
  }, [sleepTimerMinutes]);

  return (
    <div 
      ref={containerRef}
      onMouseMove={resetControlsTimeout}
      onClick={resetControlsTimeout}
      onTouchStart={resetControlsTimeout}
      className="relative w-full aspect-video bg-black overflow-hidden select-none group flex items-center justify-center"
    >
      {/* Video Element */}
      <video
        ref={videoRef}
        playsInline
        className={`w-full h-full ${
          aspectRatio === 'contain' ? 'object-contain' :
          aspectRatio === 'cover' ? 'object-cover' : 'object-fill'
        }`}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onWaiting={() => setIsLoading(true)}
        onPlaying={() => setIsLoading(false)}
      />

      {/* Loading Overlay */}
      {isLoading && !error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-xs z-10">
          <div className="w-12 h-12 border-3 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
          <span className="mt-3 text-xs font-medium text-slate-300">Connecting to stream...</span>
        </div>
      )}

      {/* Error Overlay */}
      {error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/90 p-4 text-center z-10">
          <AlertCircle className="w-10 h-10 text-rose-500 mb-2" />
          <h4 className="text-sm font-semibold text-white">Stream Unavailable</h4>
          <p className="text-xs text-slate-400 mt-1 max-w-xs">{error}</p>
          <div className="flex gap-2 mt-4">
            <button
              onClick={() => {
                setError(null);
                setIsLoading(true);
                if (videoRef.current) videoRef.current.load();
              }}
              className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-xs font-semibold text-white rounded-lg transition-colors"
            >
              Retry
            </button>
            <button
              onClick={() => onSelectChannel(nextChannel)}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 rounded-lg transition-colors"
            >
              Next Channel
            </button>
          </div>
        </div>
      )}

      {/* Channel Watermark / Badge (When controls are hidden) */}
      {!showControls && isPlaying && (
        <div className="absolute top-3 left-3 flex items-center gap-2 px-2.5 py-1 bg-black/50 backdrop-blur-md rounded-md pointer-events-none transition-opacity">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-semibold text-white truncate max-w-[150px]">{channel.name}</span>
          <span className="text-[10px] text-slate-400 font-mono">{channel.resolution || 'HD'}</span>
        </div>
      )}

      {/* Floating Controls Overlay */}
      <div 
        className={`absolute inset-0 flex flex-col justify-between p-3 bg-gradient-to-t from-black/85 via-black/25 to-black/85 transition-opacity duration-200 z-20 ${
          showControls ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      >
        {/* Top Bar Controls */}
        <div className="flex items-center justify-between text-white">
          <div className="flex items-center gap-2.5 truncate pr-2">
            {onClose && (
              <button 
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors shrink-0"
                title="Minimize player"
              >
                <X className="w-4 h-4" />
              </button>
            )}
            <div className="truncate">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                <h3 className="text-xs font-bold text-white truncate tracking-tight">{channel.name}</h3>
                <span className="text-[10px] px-1 py-0.2 bg-purple-500/20 text-purple-300 border border-purple-500/30 rounded font-mono shrink-0">
                  {channel.resolution || '1080p'}
                </span>
              </div>
              {currentProgram && (
                <p className="text-[10px] text-slate-300 truncate max-w-[200px]">
                  {currentProgram.title}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {/* Aspect Ratio Switcher */}
            <button
              onClick={() => {
                setAspectRatio(prev => prev === 'contain' ? 'cover' : prev === 'cover' ? 'fill' : 'contain');
              }}
              className="px-2 py-1 bg-white/10 hover:bg-white/20 rounded text-[10px] font-mono transition-colors"
              title="Aspect Ratio"
            >
              {aspectRatio.toUpperCase()}
            </button>

            {/* Sleep Timer */}
            <button
              onClick={() => setShowSleepTimer(!showSleepTimer)}
              className={`p-1.5 rounded-lg transition-colors ${
                sleepTimerMinutes ? 'bg-purple-600 text-white' : 'bg-white/10 hover:bg-white/20 text-slate-200'
              }`}
              title="Sleep Timer"
            >
              <Clock className="w-4 h-4" />
            </button>

            {/* Smart TV / AirPlay Cast Button */}
            <button
              onClick={handleAirPlay}
              className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors flex items-center gap-1"
              title="Cast to Smart TV or AirPlay"
            >
              <Cast className="w-4 h-4 text-purple-400" />
            </button>

            {/* Quick Zapper Toggle */}
            <button
              onClick={() => setShowZapper(!showZapper)}
              className={`p-1.5 rounded-lg transition-colors ${
                showZapper ? 'bg-purple-600 text-white' : 'bg-white/10 hover:bg-white/20 text-slate-200'
              }`}
              title="Channel Guide Quick Zapper"
            >
              <Sliders className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Center Play/Pause & Quick Skip */}
        <div className="flex items-center justify-center gap-8 text-white">
          <button
            onClick={() => handleSkip(-10)}
            className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 flex items-center justify-center transition-all"
            title="Rewind 10 seconds"
          >
            <RotateCcw className="w-4 h-4 text-slate-200" />
          </button>

          <button
            onClick={togglePlay}
            className="w-14 h-14 rounded-full bg-purple-600 hover:bg-purple-500 active:scale-90 shadow-lg shadow-purple-900/50 flex items-center justify-center transition-all"
            title={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? (
              <Pause className="w-6 h-6 text-white" />
            ) : (
              <Play className="w-6 h-6 text-white fill-white ml-0.5" />
            )}
          </button>

          <button
            onClick={() => handleSkip(10)}
            className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 flex items-center justify-center transition-all"
            title="Fast forward 10 seconds"
          >
            <RotateCw className="w-4 h-4 text-slate-200" />
          </button>
        </div>

        {/* Bottom Bar: Live Tracker, Volume, Fullscreen, PiP */}
        <div className="flex flex-col gap-1.5 text-white">
          {/* Live Progress Bar Indicator */}
          <div className="flex items-center justify-between text-[10px] text-slate-300">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
              <span className="font-bold text-white uppercase tracking-wider">LIVE</span>
            </div>
            <div className="text-slate-400 font-mono">
              {channel.group} · {channel.country || 'Global'}
            </div>
          </div>

          <div className="flex items-center justify-between gap-3 pt-1">
            {/* Left: Volume & Prev/Next */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => onSelectChannel(prevChannel)}
                className="p-1 rounded hover:bg-white/10 transition-colors"
                title={`Previous: ${prevChannel.name}`}
              >
                <ChevronLeft className="w-4 h-4 text-slate-300" />
              </button>

              <button
                onClick={toggleMute}
                className="p-1 rounded hover:bg-white/10 transition-colors"
                title={isMuted ? 'Unmute' : 'Mute'}
              >
                {isMuted || volume === 0 ? (
                  <VolumeX className="w-4 h-4 text-rose-400" />
                ) : (
                  <Volume2 className="w-4 h-4 text-slate-200" />
                )}
              </button>

              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                className="w-14 h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
              />

              <button
                onClick={() => onSelectChannel(nextChannel)}
                className="p-1 rounded hover:bg-white/10 transition-colors"
                title={`Next: ${nextChannel.name}`}
              >
                <ChevronRight className="w-4 h-4 text-slate-300" />
              </button>
            </div>

            {/* Right: PiP, Fullscreen, TV Cast */}
            <div className="flex items-center gap-2">
              <button
                onClick={togglePiP}
                className="p-1.5 rounded hover:bg-white/10 text-slate-300 hover:text-white transition-colors text-xs"
                title="Picture-in-Picture"
              >
                <Tv className="w-4 h-4" />
              </button>

              <button
                onClick={() => {
                  if (!document.fullscreenElement) {
                    containerRef.current?.requestFullscreen?.();
                    setIsFullscreen(true);
                  } else {
                    document.exitFullscreen?.();
                    setIsFullscreen(false);
                  }
                }}
                className="p-1.5 rounded hover:bg-white/10 text-slate-300 hover:text-white transition-colors"
                title="Toggle Fullscreen"
              >
                {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Sleep Timer Flyout */}
      {showSleepTimer && (
        <div className="absolute top-12 right-3 bg-slate-900/95 border border-slate-700/80 rounded-xl p-3 z-30 shadow-2xl backdrop-blur-md text-xs w-48 animate-in fade-in zoom-in-95">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800 font-semibold text-white">
            <span>Sleep Timer</span>
            <button onClick={() => setShowSleepTimer(false)}>
              <X className="w-3.5 h-3.5 text-slate-400" />
            </button>
          </div>
          <div className="flex flex-col gap-1.5 mt-2">
            {[15, 30, 45, 60, 90].map((mins) => (
              <button
                key={mins}
                onClick={() => {
                  setSleepTimerMinutes(mins);
                  setShowSleepTimer(false);
                }}
                className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left transition-colors ${
                  sleepTimerMinutes === mins ? 'bg-purple-600 text-white font-medium' : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                <span>{mins} minutes</span>
                {sleepTimerMinutes === mins && <span className="text-[10px] font-mono">Active</span>}
              </button>
            ))}
            {sleepTimerMinutes && (
              <button
                onClick={() => {
                  setSleepTimerMinutes(null);
                  setShowSleepTimer(false);
                }}
                className="mt-1 px-2.5 py-1 text-rose-400 hover:bg-rose-500/10 rounded-lg text-left"
              >
                Turn off timer
              </button>
            )}
          </div>
        </div>
      )}

      {/* Channel Quick Zapper Bar Overlay */}
      {showZapper && (
        <div className="absolute bottom-16 inset-x-2 bg-slate-950/95 border border-slate-800 rounded-xl p-2 z-30 shadow-2xl backdrop-blur-md max-h-40 overflow-y-auto custom-scrollbar">
          <div className="flex items-center justify-between px-2 py-1 mb-1 border-b border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            <span>Quick Channel Zapper</span>
            <button onClick={() => setShowZapper(false)}>
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            {channels.map((ch) => (
              <button
                key={ch.id}
                onClick={() => {
                  onSelectChannel(ch);
                  setShowZapper(false);
                }}
                className={`flex items-center gap-2 p-1.5 rounded-lg text-left transition-colors ${
                  ch.id === channel.id ? 'bg-purple-600/30 border border-purple-500/50 text-white' : 'hover:bg-slate-800/70 text-slate-300'
                }`}
              >
                <img
                  src={ch.logo}
                  alt={ch.name}
                  referrerPolicy="no-referrer"
                  className="w-7 h-7 rounded object-cover bg-slate-800 shrink-0"
                />
                <div className="truncate">
                  <div className="text-xs font-semibold truncate leading-tight">{ch.name}</div>
                  <div className="text-[10px] text-slate-400 truncate">{ch.group}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

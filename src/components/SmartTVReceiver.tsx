import React, { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';
import { 
  Tv, Volume2, VolumeX, Radio, Check, 
  ArrowLeft, Clock, Maximize2, ShieldCheck, Sparkles
} from 'lucide-react';
import { Channel } from '../types/iptv';
import { getCurrentProgram } from '../utils/epgGenerator';

interface SmartTVReceiverProps {
  initialChannel: Channel;
  channels: Channel[];
  onExit: () => void;
}

export const SmartTVReceiver: React.FC<SmartTVReceiverProps> = ({
  initialChannel,
  channels,
  onExit
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);

  const [currentChannel, setCurrentChannel] = useState<Channel>(initialChannel);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [volume, setVolume] = useState<number>(0.7);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [showOverlay, setShowOverlay] = useState<boolean>(true);
  const [remoteDeviceName, setRemoteDeviceName] = useState<string>('iPhone 16 Pro');
  const [currentTimeStr, setCurrentTimeStr] = useState<string>('');

  const currentProg = currentChannel.programs ? getCurrentProgram(currentChannel.programs) : null;

  // Real-time clock for TV overlay
  useEffect(() => {
    const updateTime = () => {
      const d = new Date();
      setCurrentTimeStr(d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Sync with iPhone controller via BroadcastChannel & LocalStorage
  useEffect(() => {
    let bc: BroadcastChannel | null = null;
    try {
      bc = new BroadcastChannel('iptv_remote_sync');
      bc.onmessage = (e) => {
        handleIncomingCommand(e.data);
      };
    } catch (err) {
      console.warn('BroadcastChannel error in TV receiver', err);
    }

    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'iptv_cast_event' && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          handleIncomingCommand(parsed);
        } catch (err) {
          // Ignore
        }
      }
    };
    window.addEventListener('storage', handleStorage);

    return () => {
      if (bc) bc.close();
      window.removeEventListener('storage', handleStorage);
    };
  }, [channels]);

  const handleIncomingCommand = (data: any) => {
    if (!data) return;
    const { type, payload } = data;
    
    // Briefly display the TV OSD overlay on any remote command
    setShowOverlay(true);

    switch (type) {
      case 'CHANNEL_CHANGE':
        if (payload?.channel) {
          setCurrentChannel(payload.channel);
          if (payload.deviceName) setRemoteDeviceName(payload.deviceName);
        }
        break;
      case 'PLAYBACK_TOGGLE':
        if (videoRef.current) {
          if (payload.isPlaying) {
            videoRef.current.play().catch(console.warn);
            setIsPlaying(true);
          } else {
            videoRef.current.pause();
            setIsPlaying(false);
          }
        }
        break;
      case 'VOLUME_CHANGE':
        if (videoRef.current && typeof payload.volume === 'number') {
          videoRef.current.volume = payload.volume;
          setVolume(payload.volume);
          setIsMuted(payload.volume === 0);
        }
        break;
      case 'MUTE_TOGGLE':
        if (videoRef.current && typeof payload.isMuted === 'boolean') {
          videoRef.current.muted = payload.isMuted;
          setIsMuted(payload.isMuted);
        }
        break;
      case 'SKIP':
        if (videoRef.current && typeof payload.seconds === 'number') {
          videoRef.current.currentTime += payload.seconds;
        }
        break;
    }
  };

  // Video Stream Loader
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    const streamUrl = currentChannel.url;
    const isHls = streamUrl.includes('.m3u8') || streamUrl.includes('/hls/');

    if (isHls && Hls.isSupported()) {
      const hls = new Hls({ enableWorker: true, lowLatencyMode: true });
      hlsRef.current = hls;
      hls.loadSource(streamUrl);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        video.play().catch(() => {
          video.muted = true;
          setIsMuted(true);
          video.play().catch(console.warn);
        });
      });
    } else {
      video.src = streamUrl;
      video.play().catch(() => {
        video.muted = true;
        setIsMuted(true);
        video.play().catch(console.warn);
      });
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [currentChannel.url]);

  // Auto-hide TV on-screen display overlay after 5 seconds
  useEffect(() => {
    if (showOverlay) {
      const t = setTimeout(() => setShowOverlay(false), 6000);
      return () => clearTimeout(t);
    }
  }, [showOverlay, currentChannel.id]);

  return (
    <div 
      className="relative w-screen h-screen bg-black overflow-hidden select-none cursor-default"
      onMouseMove={() => setShowOverlay(true)}
      onClick={() => setShowOverlay(true)}
    >
      {/* 4K/Full HD Video Feed */}
      <video
        ref={videoRef}
        playsInline
        autoPlay
        className="w-full h-full object-cover"
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
      />

      {/* Persistent Smart TV Watermark (Bottom Right) */}
      <div className="absolute top-6 right-8 flex items-center gap-3 bg-black/50 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/10 z-20 pointer-events-none">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs font-mono font-bold text-white uppercase tracking-wider">
            Smart TV Receiver
          </span>
        </div>
        <span className="text-slate-400">·</span>
        <span className="text-xs font-mono text-purple-300 font-bold">{currentTimeStr}</span>
      </div>

      {/* Top Left Exit Button */}
      <div className={`absolute top-6 left-8 z-30 transition-opacity duration-300 ${showOverlay ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        <button
          onClick={onExit}
          className="px-4 py-2 bg-slate-900/80 hover:bg-slate-800 text-white rounded-xl border border-slate-700 backdrop-blur-md text-xs font-bold flex items-center gap-2 shadow-xl active:scale-95 transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Exit to iPhone View</span>
        </button>
      </div>

      {/* Smart TV On-Screen Display (OSD) Banner */}
      <div
        className={`absolute bottom-8 inset-x-8 z-30 bg-gradient-to-t from-slate-950/95 via-slate-900/90 to-slate-900/80 border border-slate-700/80 rounded-3xl p-6 shadow-2xl backdrop-blur-xl transition-all duration-300 transform ${
          showOverlay ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0 pointer-events-none'
        }`}
      >
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          {/* Channel info */}
          <div className="flex items-center gap-5">
            <img
              src={currentChannel.logo}
              alt={currentChannel.name}
              referrerPolicy="no-referrer"
              className="w-16 h-16 rounded-2xl object-cover bg-slate-800 border-2 border-purple-500/50 shadow-lg shrink-0"
            />
            <div>
              <div className="flex items-center gap-3">
                <span className="px-2 py-0.5 bg-rose-600 text-white text-[11px] font-black rounded-md tracking-wider">
                  LIVE
                </span>
                <h1 className="text-xl md:text-2xl font-black text-white tracking-tight">
                  {currentChannel.name}
                </h1>
                <span className="text-xs font-mono px-2 py-0.5 bg-purple-500/20 text-purple-300 border border-purple-500/40 rounded-lg">
                  {currentChannel.resolution || '4K UHD'}
                </span>
              </div>

              {currentProg && (
                <div className="mt-1">
                  <div className="text-sm font-bold text-purple-300">
                    Now Playing: {currentProg.title}
                  </div>
                  <p className="text-xs text-slate-300 line-clamp-1 max-w-xl mt-0.5">
                    {currentProg.description}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Connected Device & TV status */}
          <div className="flex items-center gap-4 border-t md:border-t-0 md:border-l border-slate-800 pt-3 md:pt-0 md:pl-6 shrink-0">
            <div className="text-right">
              <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                Controlled by
              </div>
              <div className="text-xs font-bold text-white flex items-center justify-end gap-1.5 mt-0.5">
                <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                <span>{remoteDeviceName}</span>
              </div>
            </div>

            <div className="flex items-center gap-2 bg-slate-800/80 px-3 py-2 rounded-xl border border-slate-700/60 text-xs font-mono text-slate-200">
              {isMuted || volume === 0 ? (
                <VolumeX className="w-4 h-4 text-rose-400" />
              ) : (
                <Volume2 className="w-4 h-4 text-emerald-400" />
              )}
              <span>{isMuted ? 'MUTED' : `VOL ${Math.round(volume * 100)}%`}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

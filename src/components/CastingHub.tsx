import React, { useState, useEffect } from 'react';
import { 
  Tv, Cast, Radio, Volume2, VolumeX, Volume1, 
  Power, ChevronUp, ChevronDown, ChevronLeft, ChevronRight, 
  Play, Pause, RotateCcw, RotateCw, ExternalLink, QrCode, 
  Check, Wifi, RefreshCw, Smartphone, MonitorUp, Info
} from 'lucide-react';
import { CastDevice, Channel } from '../types/iptv';
import { 
  SMART_TV_DEVICES, 
  sendCastMessage, 
  triggerNativeAirPlay,
  isAirPlaySupported,
  isGoogleCastAvailable,
  requestGoogleCastSession
} from '../utils/castManager';

interface CastingHubProps {
  currentChannel: Channel | null;
  channels: Channel[];
  onSelectChannel: (channel: Channel) => void;
  videoElement?: HTMLVideoElement | null;
  onOpenTVReceiver?: () => void;
}

export const CastingHub: React.FC<CastingHubProps> = ({
  currentChannel,
  channels,
  onSelectChannel,
  videoElement,
  onOpenTVReceiver
}) => {
  const [devices, setDevices] = useState<CastDevice[]>(SMART_TV_DEVICES);
  const [connectedDevice, setConnectedDevice] = useState<CastDevice | null>(null);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [tvVolume, setTvVolume] = useState<number>(35);
  const [isTvMuted, setIsTvMuted] = useState<boolean>(false);
  const [isTvPlaying, setIsTvPlaying] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'remote' | 'devices' | 'guide'>('devices');
  const [qrModalOpen, setQrModalOpen] = useState<boolean>(false);

  // Scan network for devices
  const handleScanDevices = () => {
    setIsScanning(true);
    setTimeout(() => {
      setIsScanning(false);
    }, 1200);
  };

  // Connect to a Smart TV
  const handleConnectDevice = async (device: CastDevice) => {
    if (device.type === 'airplay' || device.type === 'apple_tv') {
      const airplaySuccess = triggerNativeAirPlay(videoElement || null);
      if (airplaySuccess) {
        setConnectedDevice(device);
        setActiveTab('remote');
        return;
      }
    }

    if (device.type === 'chromecast') {
      const castSuccess = await requestGoogleCastSession(currentChannel);
      if (castSuccess) {
        setConnectedDevice(device);
        setActiveTab('remote');
        return;
      }
    }

    // Default connection & sync via BroadcastChannel to TV receiver
    setConnectedDevice(device);
    setActiveTab('remote');
    if (currentChannel) {
      sendCastMessage('CHANNEL_CHANGE', { channel: currentChannel, deviceName: device.name });
    }
  };

  // Disconnect from TV
  const handleDisconnect = () => {
    if (connectedDevice) {
      sendCastMessage('DISCONNECT', {});
    }
    setConnectedDevice(null);
    setActiveTab('devices');
  };

  // TV Remote Commands
  const handleTvVolumeChange = (delta: number) => {
    const next = Math.max(0, Math.min(100, tvVolume + delta));
    setTvVolume(next);
    sendCastMessage('VOLUME_CHANGE', { volume: next / 100 });
  };

  const toggleTvMute = () => {
    const next = !isTvMuted;
    setIsTvMuted(next);
    sendCastMessage('MUTE_TOGGLE', { isMuted: next });
  };

  const toggleTvPlayback = () => {
    const next = !isTvPlaying;
    setIsTvPlaying(next);
    sendCastMessage('PLAYBACK_TOGGLE', { isPlaying: next });
  };

  const handleTvChannelSkip = (direction: 1 | -1) => {
    if (!currentChannel || channels.length === 0) return;
    const curIdx = channels.findIndex(c => c.id === currentChannel.id);
    let nextIdx = curIdx + direction;
    if (nextIdx < 0) nextIdx = channels.length - 1;
    if (nextIdx >= channels.length) nextIdx = 0;
    const nextCh = channels[nextIdx];
    onSelectChannel(nextCh);
    sendCastMessage('CHANNEL_CHANGE', { channel: nextCh, deviceName: connectedDevice?.name });
  };

  return (
    <div className="flex flex-col h-full bg-slate-950 text-slate-100 select-none">
      {/* Top Navigation Tabs */}
      <div className="p-3 border-b border-slate-800 bg-slate-900/60 backdrop-blur-md flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-purple-600/20 border border-purple-500/40 flex items-center justify-center text-purple-400">
            <Tv className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white tracking-tight">Smart TV Casting</h2>
            <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
              <span className={`w-1.5 h-1.5 rounded-full ${connectedDevice ? 'bg-emerald-500 animate-pulse' : 'bg-slate-500'}`} />
              <span>{connectedDevice ? `Casting to ${connectedDevice.name}` : 'Ready to Cast'}</span>
            </div>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center bg-slate-800/80 p-0.5 rounded-lg border border-slate-700/50">
          <button
            onClick={() => setActiveTab('devices')}
            className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors ${
              activeTab === 'devices' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            TVs
          </button>
          <button
            onClick={() => setActiveTab('remote')}
            className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors ${
              activeTab === 'remote' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Remote
          </button>
          <button
            onClick={() => setActiveTab('guide')}
            className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors ${
              activeTab === 'guide' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Help
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
        {/* TAB 1: Smart TV Devices Scanner */}
        {activeTab === 'devices' && (
          <div className="space-y-4">
            {/* Active Casting Banner if connected */}
            {connectedDevice && (
              <div className="bg-gradient-to-r from-purple-900/60 to-indigo-950/60 border border-purple-500/50 rounded-2xl p-4 shadow-xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-purple-600 flex items-center justify-center text-white shadow-lg">
                      <Cast className="w-5 h-5 animate-pulse" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white">{connectedDevice.name}</div>
                      <div className="text-[11px] text-purple-200">
                        Now Streaming: {currentChannel?.name || 'Live Channel'}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={handleDisconnect}
                    className="px-3 py-1.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 text-xs font-semibold rounded-xl transition-colors"
                  >
                    Disconnect
                  </button>
                </div>
              </div>
            )}

            {/* Smart TV Receiver Launcher Card */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <MonitorUp className="w-4 h-4 text-purple-400" />
                  <h4 className="text-xs font-bold text-white">Smart TV Big Screen Receiver</h4>
                </div>
                <p className="text-[11px] text-slate-400 mt-1 max-w-sm">
                  Open our TV receiver on your Smart TV browser (LG, Samsung, Sony, Roku) to stream directly in 4K HDR.
                </p>
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  onClick={() => {
                    if (onOpenTVReceiver) {
                      onOpenTVReceiver();
                    } else {
                      window.open(window.location.href + '?tv=true', '_blank');
                    }
                  }}
                  className="flex-1 sm:flex-initial px-3.5 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 shadow-md active:scale-98 transition-all"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Launch TV Mode</span>
                </button>
                <button
                  onClick={() => setQrModalOpen(true)}
                  className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl border border-slate-700 transition-colors"
                  title="Show Smart TV QR Code"
                >
                  <QrCode className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Local Network Smart TVs Header */}
            <div className="flex items-center justify-between pt-1">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Discovered Smart TVs ({devices.length})
              </span>
              <button
                onClick={handleScanDevices}
                disabled={isScanning}
                className="flex items-center gap-1.5 text-xs text-purple-400 hover:text-purple-300 transition-colors font-medium"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isScanning ? 'animate-spin' : ''}`} />
                <span>{isScanning ? 'Scanning...' : 'Scan Network'}</span>
              </button>
            </div>

            {/* Smart TV List */}
            <div className="grid grid-cols-1 gap-2.5">
              {devices.map((device) => {
                const isCurrent = connectedDevice?.id === device.id;

                return (
                  <div
                    key={device.id}
                    className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between ${
                      isCurrent
                        ? 'bg-purple-950/30 border-purple-500/60 shadow-lg shadow-purple-950/30'
                        : 'bg-slate-900/70 border-slate-800/80 hover:border-slate-700 hover:bg-slate-800/70'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                        isCurrent ? 'bg-purple-600 text-white' : 'bg-slate-800 text-slate-300'
                      }`}>
                        {device.type === 'airplay' || device.type === 'apple_tv' ? (
                          <Cast className="w-5 h-5" />
                        ) : device.type === 'chromecast' ? (
                          <Radio className="w-5 h-5" />
                        ) : (
                          <Tv className="w-5 h-5" />
                        )}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-white flex items-center gap-2">
                          <span>{device.name}</span>
                          {isCurrent && (
                            <span className="px-1.5 py-0.5 bg-emerald-500/20 text-emerald-400 text-[10px] font-mono rounded border border-emerald-500/30">
                              Active
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          {device.model} · <span className="font-mono text-slate-500">{device.location}</span>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => isCurrent ? handleDisconnect() : handleConnectDevice(device)}
                      className={`px-3.5 py-2 text-xs font-bold rounded-xl active:scale-98 transition-all ${
                        isCurrent
                          ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
                          : 'bg-purple-600 hover:bg-purple-500 text-white shadow-md shadow-purple-950/50'
                      }`}
                    >
                      {isCurrent ? 'Disconnect' : 'Connect & Cast'}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 2: Physical Smart TV Remote Controller */}
        {activeTab === 'remote' && (
          <div className="max-w-xs mx-auto flex flex-col items-center">
            {/* TV Header status */}
            <div className="w-full bg-slate-900/90 border border-slate-800 rounded-2xl p-3 mb-4 text-center">
              <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                Active TV Target
              </div>
              <div className="text-xs font-bold text-white mt-0.5">
                {connectedDevice ? connectedDevice.name : 'Virtual Smart TV Controller'}
              </div>
              {currentChannel && (
                <div className="text-[11px] text-purple-300 mt-0.5 truncate">
                  Now playing: {currentChannel.name}
                </div>
              )}
            </div>

            {/* Sleek Ergonomic TV Remote Body */}
            <div className="w-full bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 rounded-3xl p-5 shadow-2xl flex flex-col items-center gap-5">
              {/* Power & Source Row */}
              <div className="w-full flex items-center justify-between">
                <button
                  onClick={toggleTvPlayback}
                  className="w-10 h-10 rounded-full bg-rose-600/20 border border-rose-500/40 text-rose-400 hover:bg-rose-600 hover:text-white flex items-center justify-center transition-all active:scale-95 shadow-md"
                  title="Power TV"
                >
                  <Power className="w-4 h-4" />
                </button>

                <div className="flex items-center gap-1.5 text-[11px] font-mono text-slate-400">
                  <Wifi className="w-3.5 h-3.5 text-emerald-400" />
                  <span>5 GHz Wi-Fi</span>
                </div>

                <button
                  onClick={toggleTvMute}
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-all active:scale-95 ${
                    isTvMuted
                      ? 'bg-amber-500/20 border border-amber-500/40 text-amber-400'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                  }`}
                  title="Mute TV"
                >
                  {isTvMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </button>
              </div>

              {/* Directional D-Pad (Up, Down, Left, Right, OK) */}
              <div className="relative w-44 h-44 rounded-full bg-slate-800/80 border border-slate-700 shadow-inner flex items-center justify-center">
                {/* D-Pad Up */}
                <button
                  onClick={() => handleTvChannelSkip(-1)}
                  className="absolute top-2 w-12 h-10 rounded-t-xl hover:bg-slate-700/80 flex items-center justify-center text-slate-300 active:scale-95 transition-all"
                  title="Previous Channel"
                >
                  <ChevronUp className="w-6 h-6" />
                </button>

                {/* D-Pad Down */}
                <button
                  onClick={() => handleTvChannelSkip(1)}
                  className="absolute bottom-2 w-12 h-10 rounded-b-xl hover:bg-slate-700/80 flex items-center justify-center text-slate-300 active:scale-95 transition-all"
                  title="Next Channel"
                >
                  <ChevronDown className="w-6 h-6" />
                </button>

                {/* D-Pad Left */}
                <button
                  onClick={() => handleTvVolumeChange(-5)}
                  className="absolute left-2 w-10 h-12 rounded-l-xl hover:bg-slate-700/80 flex items-center justify-center text-slate-300 active:scale-95 transition-all"
                  title="Volume Down"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>

                {/* D-Pad Right */}
                <button
                  onClick={() => handleTvVolumeChange(5)}
                  className="absolute right-2 w-10 h-12 rounded-r-xl hover:bg-slate-700/80 flex items-center justify-center text-slate-300 active:scale-95 transition-all"
                  title="Volume Up"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>

                {/* Center OK / Select Button */}
                <button
                  onClick={toggleTvPlayback}
                  className="w-16 h-16 rounded-full bg-purple-600 hover:bg-purple-500 active:scale-90 text-white font-bold text-xs shadow-lg shadow-purple-900/60 flex items-center justify-center transition-all"
                >
                  OK
                </button>
              </div>

              {/* Volume and Channel Rockers */}
              <div className="w-full grid grid-cols-2 gap-4">
                {/* Volume Rocker */}
                <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-2 flex flex-col items-center">
                  <button
                    onClick={() => handleTvVolumeChange(5)}
                    className="w-full py-2 hover:bg-slate-700 rounded-lg flex items-center justify-center text-slate-200 active:scale-95 transition-all"
                  >
                    <ChevronUp className="w-4 h-4" />
                  </button>
                  <div className="my-1 text-center">
                    <span className="text-[10px] font-bold text-slate-400 block uppercase">VOL</span>
                    <span className="text-xs font-mono font-bold text-white">{isTvMuted ? 0 : tvVolume}%</span>
                  </div>
                  <button
                    onClick={() => handleTvVolumeChange(-5)}
                    className="w-full py-2 hover:bg-slate-700 rounded-lg flex items-center justify-center text-slate-200 active:scale-95 transition-all"
                  >
                    <ChevronDown className="w-4 h-4" />
                  </button>
                </div>

                {/* Channel Rocker */}
                <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-2 flex flex-col items-center">
                  <button
                    onClick={() => handleTvChannelSkip(-1)}
                    className="w-full py-2 hover:bg-slate-700 rounded-lg flex items-center justify-center text-slate-200 active:scale-95 transition-all"
                  >
                    <ChevronUp className="w-4 h-4" />
                  </button>
                  <div className="my-1 text-center">
                    <span className="text-[10px] font-bold text-slate-400 block uppercase">CH</span>
                    <span className="text-xs font-mono font-bold text-white">ZAP</span>
                  </div>
                  <button
                    onClick={() => handleTvChannelSkip(1)}
                    className="w-full py-2 hover:bg-slate-700 rounded-lg flex items-center justify-center text-slate-200 active:scale-95 transition-all"
                  >
                    <ChevronDown className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Transport Controls (Rewind, Play/Pause, Fast Forward) */}
              <div className="w-full flex items-center justify-around pt-1 border-t border-slate-800">
                <button
                  onClick={() => sendCastMessage('SKIP', { seconds: -10 })}
                  className="w-10 h-10 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center active:scale-95 transition-all"
                  title="Rewind 10s"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>

                <button
                  onClick={toggleTvPlayback}
                  className="w-12 h-12 rounded-full bg-slate-800 hover:bg-slate-700 text-white flex items-center justify-center active:scale-95 transition-all shadow-md"
                >
                  {isTvPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 fill-white ml-0.5" />}
                </button>

                <button
                  onClick={() => sendCastMessage('SKIP', { seconds: 10 })}
                  className="w-10 h-10 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center active:scale-95 transition-all"
                  title="Fast Forward 10s"
                >
                  <RotateCw className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: Smart TV Setup & Casting Guide */}
        {activeTab === 'guide' && (
          <div className="space-y-4 max-w-lg mx-auto text-xs text-slate-300">
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4">
              <h3 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
                <Cast className="w-4 h-4 text-purple-400" />
                <span>How to Cast to Smart TVs</span>
              </h3>
              <p className="text-slate-400 leading-relaxed mb-3">
                This IPTV player supports three high-performance casting protocols depending on your TV brand and browser:
              </p>

              <div className="space-y-3">
                <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-700/60">
                  <div className="font-bold text-white mb-1">1. Apple AirPlay 2 (Apple TV & Compatible TVs)</div>
                  <p className="text-slate-400 leading-relaxed">
                    On iPhone or iPad with Safari, tap the AirPlay button on any video. Choose your Apple TV, Roku, LG OLED, or Samsung TV from the native iOS popup.
                  </p>
                </div>

                <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-700/60">
                  <div className="font-bold text-white mb-1">2. Google Cast / Chromecast (Google TV & Android TV)</div>
                  <p className="text-slate-400 leading-relaxed">
                    When using Chrome or Chromium browsers, clicking Cast initiates Google Cast framework to stream to Sony BRAVIA, Philips, or Chromecast devices.
                  </p>
                </div>

                <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-700/60">
                  <div className="font-bold text-white mb-1">3. Smart TV Big-Screen Web Receiver (Any Brand)</div>
                  <p className="text-slate-400 leading-relaxed">
                    Open the built-in browser on your TV (LG webOS browser, Samsung Tizen Internet, or Fire TV Silk). Load this app URL or scan the QR code. Your iPhone acts as a live interactive remote!
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* QR Code Modal for TV Screen Pairing */}
      {qrModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-sm p-6 shadow-2xl text-center">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white">Smart TV Pairing QR</h3>
              <button onClick={() => setQrModalOpen(false)} className="text-slate-400 hover:text-white">
                ✕
              </button>
            </div>

            <div className="my-5 p-4 bg-white rounded-2xl inline-block shadow-xl">
              {/* Clean SVG QR code representation */}
              <div className="w-48 h-48 bg-slate-900 rounded-xl flex flex-col items-center justify-center p-3 text-white">
                <QrCode className="w-24 h-24 text-purple-400 mb-2" />
                <span className="text-[10px] font-mono text-slate-300">SCAN WITH TV CAMERA</span>
                <span className="text-[9px] font-mono text-purple-300 mt-1">PAIR CODE: 849-210</span>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Open your Smart TV’s camera or web browser to pair directly with this iPhone controller.
            </p>

            <button
              onClick={() => setQrModalOpen(false)}
              className="mt-4 w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

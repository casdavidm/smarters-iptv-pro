import React, { useState } from 'react';
import { 
  Tv, Play, Server, FolderUp, ListMusic, Users, Radio, 
  X, Check, AlertCircle, ArrowRight, Upload, Link, Sparkles
} from 'lucide-react';
import { Channel, PlaylistSource } from '../types/iptv';
import { parseM3U } from '../utils/m3uParser';
import { INITIAL_CHANNELS } from '../data/defaultChannels';

interface PlaylistSelectorProps {
  onAddChannels: (channels: Channel[], source: PlaylistSource) => void;
  savedPlaylists: PlaylistSource[];
  onSelectSavedPlaylist?: (source: PlaylistSource) => void;
  onClose?: () => void;
}

type ModalType = 'single' | 'xtream' | 'local' | 'm3u' | 'list' | 'one_stream' | null;

export const PlaylistSelector: React.FC<PlaylistSelectorProps> = ({
  onAddChannels,
  savedPlaylists,
  onSelectSavedPlaylist,
  onClose
}) => {
  const [activeModal, setActiveModal] = useState<ModalType>(null);
  
  // Single Stream Form
  const [singleStreamUrl, setSingleStreamUrl] = useState<string>('https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8');
  const [singleStreamName, setSingleStreamName] = useState<string>('Custom Live Stream');

  // M3U Playlist Form
  const [m3uName, setM3uName] = useState<string>('My IPTV Playlist');
  const [m3uUrl, setM3uUrl] = useState<string>('');
  const [m3uRawText, setM3uRawText] = useState<string>('');
  const [m3uInputMode, setM3uInputMode] = useState<'url' | 'raw'>('url');

  // Xtream Codes Form
  const [xtreamName, setXtreamName] = useState<string>('Premium Xtream');
  const [xtreamServer, setXtreamServer] = useState<string>('http://iptv-service.net:8080');
  const [xtreamUser, setXtreamUser] = useState<string>('demo_user');
  const [xtreamPass, setXtreamPass] = useState<string>('••••••••');

  // 1-Stream API Form
  const [oneStreamServer, setOneStreamServer] = useState<string>('https://portal.1stream.io');
  const [oneStreamMac, setOneStreamMac] = useState<string>('00:1A:79:B4:9C:E2');

  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Handle Single Stream Submit
  const handleSingleStreamSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!singleStreamUrl) return;

    const newChannel: Channel = {
      id: `ch-single-${Date.now()}`,
      name: singleStreamName || 'Custom Stream',
      url: singleStreamUrl,
      logo: 'https://images.unsplash.com/photo-1594909122845-11baa439b7bf?w=128&auto=format&fit=crop&q=80',
      group: 'Direct Stream',
      resolution: '1080p',
      isFavorite: true
    };

    const source: PlaylistSource = {
      id: `src-${Date.now()}`,
      name: singleStreamName,
      type: 'single_stream',
      url: singleStreamUrl,
      channelCount: 1,
      addedAt: new Date().toISOString()
    };

    onAddChannels([newChannel], source);
    setActiveModal(null);
    if (onClose) onClose();
  };

  // Handle M3U URL / Raw Submit
  const handleM3uSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      let content = m3uRawText;
      if (m3uInputMode === 'url') {
        if (!m3uUrl) {
          setError('Please provide a valid M3U playlist URL.');
          setLoading(false);
          return;
        }

        // Fetch remote M3U URL with fallback proxy if CORS restricted
        try {
          const res = await fetch(m3uUrl);
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          content = await res.text();
        } catch (fetchErr) {
          // Attempt via proxy
          const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(m3uUrl)}`;
          const proxyRes = await fetch(proxyUrl);
          if (!proxyRes.ok) throw new Error('CORS or network error fetching remote M3U playlist.');
          content = await proxyRes.text();
        }
      }

      if (!content || !content.includes('#EXTM3U') && !content.includes('http')) {
        throw new Error('Provided content does not contain valid M3U stream data.');
      }

      const parsed = parseM3U(content, `playlist-${Date.now()}`);
      if (parsed.length === 0) {
        throw new Error('No stream channels could be parsed from the playlist.');
      }

      const source: PlaylistSource = {
        id: `src-${Date.now()}`,
        name: m3uName || 'M3U Playlist',
        type: 'm3u_url',
        url: m3uInputMode === 'url' ? m3uUrl : undefined,
        channelCount: parsed.length,
        addedAt: new Date().toISOString()
      };

      onAddChannels(parsed, source);
      setActiveModal(null);
      if (onClose) onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to process M3U playlist.');
    } finally {
      setLoading(false);
    }
  };

  // Handle Local M3U File Upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setError(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = parseM3U(text, `file-${Date.now()}`);
        if (parsed.length === 0) {
          throw new Error('File does not contain valid M3U stream entries.');
        }

        const source: PlaylistSource = {
          id: `src-${Date.now()}`,
          name: file.name.replace(/\.[^/.]+$/, ""),
          type: 'm3u_file',
          channelCount: parsed.length,
          addedAt: new Date().toISOString()
        };

        onAddChannels(parsed, source);
        setActiveModal(null);
        if (onClose) onClose();
      } catch (err: any) {
        setError(err.message || 'Failed to parse local M3U file.');
      } finally {
        setLoading(false);
      }
    };

    reader.onerror = () => {
      setError('Error reading file.');
      setLoading(false);
    };

    reader.readAsText(file);
  };

  // Handle Xtream Codes Submit
  const handleXtreamSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Generate Xtream live M3U stream structure
    setTimeout(() => {
      // Connect to Xtream simulated gateway
      const cleanServer = xtreamServer.replace(/\/$/, '');
      const xtreamChannels: Channel[] = INITIAL_CHANNELS.map((ch, idx) => ({
        ...ch,
        id: `xtream-${idx}`,
        name: `[Xtream] ${ch.name}`,
        url: ch.url
      }));

      const source: PlaylistSource = {
        id: `src-xtream-${Date.now()}`,
        name: xtreamName,
        type: 'xtream',
        server: cleanServer,
        username: xtreamUser,
        channelCount: xtreamChannels.length,
        addedAt: new Date().toISOString()
      };

      onAddChannels(xtreamChannels, source);
      setLoading(false);
      setActiveModal(null);
      if (onClose) onClose();
    }, 600);
  };

  // Instant Load Sample Pack
  const handleLoadSamplePack = () => {
    const source: PlaylistSource = {
      id: 'src-sample-free',
      name: 'Global Free-to-Air Pack (12 Live Channels)',
      type: 'preset',
      channelCount: INITIAL_CHANNELS.length,
      addedAt: new Date().toISOString()
    };
    onAddChannels(INITIAL_CHANNELS, source);
    if (onClose) onClose();
  };

  return (
    <div className="relative min-h-full w-full bg-gradient-to-br from-[#120e29] via-[#241242] to-[#3b123d] text-white p-4 sm:p-6 flex flex-col justify-between select-none">
      {/* Top Header */}
      <div>
        <div className="flex items-center justify-between pb-4">
          <div className="flex items-center gap-2">
            <div className="w-9 h-7 rounded-lg border-2 border-white/80 flex items-center justify-center relative">
              <span className="text-[10px] font-black tracking-tighter">TV</span>
              <div className="absolute -top-1.5 -right-1 w-2 h-2 border-t-2 border-r-2 border-white/80 rotate-45" />
            </div>
            <div>
              <div className="text-sm font-extrabold tracking-tight leading-none">
                SMARTERS PLAYER <span className="text-purple-300 font-light text-xs">Lite</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono text-purple-300/70">v1.4.2</span>
            {onClose && (
              <button
                onClick={onClose}
                className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors text-slate-300"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Title Bar */}
        <div className="text-center my-3">
          <h1 className="text-sm sm:text-base font-extrabold tracking-widest text-slate-100 uppercase">
            CHOOSE PLAYLIST TYPE
          </h1>
        </div>
      </div>

      {/* Main 6-Card Smarters Grid */}
      <div className="my-auto py-2">
        <div className="bg-black/30 backdrop-blur-xl border border-white/10 rounded-2xl p-4 sm:p-5 shadow-2xl max-w-2xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Card 1: Play A Single Stream */}
            <button
              onClick={() => setActiveModal('single')}
              className="bg-white hover:bg-slate-100 text-slate-900 rounded-xl p-4 flex flex-col items-center justify-center text-center shadow-lg active:scale-97 transition-all group min-h-[90px]"
            >
              <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-1 text-purple-900">
                <Play className="w-6 h-6 fill-current" />
              </div>
              <span className="text-[11px] font-bold tracking-tight uppercase text-slate-900">
                PLAY A SINGLE STREAM
              </span>
            </button>

            {/* Card 2: Xtream Code */}
            <button
              onClick={() => setActiveModal('xtream')}
              className="bg-white hover:bg-slate-100 text-slate-900 rounded-xl p-4 flex flex-col items-center justify-center text-center shadow-lg active:scale-97 transition-all group min-h-[90px]"
            >
              <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-1 text-purple-900">
                <Server className="w-6 h-6" />
              </div>
              <span className="text-[11px] font-bold tracking-tight uppercase text-slate-900">
                XTREAM CODE
              </span>
            </button>

            {/* Card 3: Local Audio/Video Data */}
            <button
              onClick={() => setActiveModal('local')}
              className="bg-white hover:bg-slate-100 text-slate-900 rounded-xl p-4 flex flex-col items-center justify-center text-center shadow-lg active:scale-97 transition-all group min-h-[90px]"
            >
              <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-1 text-purple-900">
                <FolderUp className="w-6 h-6" />
              </div>
              <span className="text-[11px] font-bold tracking-tight uppercase text-slate-900">
                LOCAL AUDIO/VIDEO DATA
              </span>
            </button>

            {/* Card 4: M3U Playlist */}
            <button
              onClick={() => setActiveModal('m3u')}
              className="bg-white hover:bg-slate-100 text-slate-900 rounded-xl p-4 flex flex-col items-center justify-center text-center shadow-lg active:scale-97 transition-all group min-h-[90px]"
            >
              <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-1 text-purple-900">
                <ListMusic className="w-6 h-6" />
              </div>
              <span className="text-[11px] font-bold tracking-tight uppercase text-slate-900">
                M3U PLAYLIST
              </span>
            </button>

            {/* Card 5: List Playlist */}
            <button
              onClick={() => setActiveModal('list')}
              className="bg-white hover:bg-slate-100 text-slate-900 rounded-xl p-4 flex flex-col items-center justify-center text-center shadow-lg active:scale-97 transition-all group min-h-[90px]"
            >
              <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-1 text-purple-900">
                <Users className="w-6 h-6" />
              </div>
              <span className="text-[11px] font-bold tracking-tight uppercase text-slate-900">
                LIST PLAYLIST
              </span>
            </button>

            {/* Card 6: 1-Stream API */}
            <button
              onClick={() => setActiveModal('one_stream')}
              className="bg-white hover:bg-slate-100 text-slate-900 rounded-xl p-4 flex flex-col items-center justify-center text-center shadow-lg active:scale-97 transition-all group min-h-[90px]"
            >
              <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-1 text-purple-900">
                <Radio className="w-6 h-6" />
              </div>
              <span className="text-[11px] font-bold tracking-tight uppercase text-slate-900">
                1-STREAM API
              </span>
            </button>
          </div>

          {/* Quick Demo Live Test Action */}
          <div className="mt-4 pt-3 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-2">
            <span className="text-xs text-purple-200/80">Want to test live right away without an M3U file?</span>
            <button
              onClick={handleLoadSamplePack}
              className="px-3.5 py-1.5 bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-400 hover:to-indigo-400 text-white text-xs font-bold rounded-lg shadow-md flex items-center gap-1.5 active:scale-98 transition-all shrink-0"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Load 12 Free-to-Air Channels</span>
            </button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center pt-4">
        <p className="text-[10px] text-purple-200/60">
          By using this application, you agree to the <span className="underline cursor-pointer hover:text-white">Terms of Services</span>.
        </p>
      </div>

      {/* MODAL 1: Single Stream */}
      {activeModal === 'single' && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md p-5 shadow-2xl text-white">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Play className="w-4 h-4 text-purple-400 fill-purple-400" />
                <h3 className="text-sm font-bold">Play A Single Stream</h3>
              </div>
              <button onClick={() => setActiveModal(null)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSingleStreamSubmit} className="mt-4 space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Stream Name</label>
                <input
                  type="text"
                  value={singleStreamName}
                  onChange={(e) => setSingleStreamName(e.target.value)}
                  placeholder="e.g. My Live Camera / Channel"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Stream URL (HLS / M3U8 / MP4)</label>
                <input
                  type="url"
                  value={singleStreamUrl}
                  onChange={(e) => setSingleStreamUrl(e.target.value)}
                  placeholder="https://.../stream.m3u8"
                  required
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white placeholder-slate-500 font-mono text-[11px] focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold shadow-lg shadow-purple-900/30"
                >
                  Start Playback
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: M3U Playlist */}
      {activeModal === 'm3u' && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg p-5 shadow-2xl text-white">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <ListMusic className="w-4 h-4 text-purple-400" />
                <h3 className="text-sm font-bold">Add M3U Playlist</h3>
              </div>
              <button onClick={() => setActiveModal(null)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            {error && (
              <div className="mt-3 p-2.5 bg-rose-950/60 border border-rose-800/80 rounded-xl text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleM3uSubmit} className="mt-3 space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Playlist Name</label>
                <input
                  type="text"
                  value={m3uName}
                  onChange={(e) => setM3uName(e.target.value)}
                  placeholder="e.g. My Sports & Cinema"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              {/* Mode switch: URL vs Raw Text */}
              <div className="flex bg-slate-800 p-1 rounded-xl border border-slate-700/60">
                <button
                  type="button"
                  onClick={() => setM3uInputMode('url')}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                    m3uInputMode === 'url' ? 'bg-purple-600 text-white' : 'text-slate-400'
                  }`}
                >
                  M3U / M3U8 URL
                </button>
                <button
                  type="button"
                  onClick={() => setM3uInputMode('raw')}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                    m3uInputMode === 'raw' ? 'bg-purple-600 text-white' : 'text-slate-400'
                  }`}
                >
                  Paste M3U Content
                </button>
              </div>

              {m3uInputMode === 'url' ? (
                <div>
                  <label className="block text-slate-300 font-medium mb-1">M3U Playlist URL</label>
                  <input
                    type="url"
                    value={m3uUrl}
                    onChange={(e) => setM3uUrl(e.target.value)}
                    placeholder="https://provider.com/playlist.m3u"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono text-[11px] focus:outline-none focus:border-purple-500"
                  />
                  <div className="mt-1.5 flex gap-1 text-[11px] text-slate-400">
                    <span>Try sample:</span>
                    <button
                      type="button"
                      onClick={() => setM3uUrl('https://iptv-org.github.io/iptv/countries/us.m3u')}
                      className="text-purple-400 hover:underline"
                    >
                      US Public Channels M3U
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Paste Raw M3U Content</label>
                  <textarea
                    rows={5}
                    value={m3uRawText}
                    onChange={(e) => setM3uRawText(e.target.value)}
                    placeholder="#EXTM3U&#10;#EXTINF:-1 tvg-id=&quot;cnn&quot; group-title=&quot;News&quot;,CNN Live&#10;https://..."
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white font-mono text-[10px] focus:outline-none focus:border-purple-500"
                  />
                </div>
              )}

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold flex items-center gap-1.5 shadow-lg shadow-purple-900/30"
                >
                  {loading ? 'Processing M3U...' : 'Import Playlist'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: Local File Upload */}
      {activeModal === 'local' && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md p-5 shadow-2xl text-white">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <FolderUp className="w-4 h-4 text-purple-400" />
                <h3 className="text-sm font-bold">Local Audio / Video Data</h3>
              </div>
              <button onClick={() => setActiveModal(null)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            {error && (
              <div className="mt-3 p-2.5 bg-rose-950/60 border border-rose-800/80 rounded-xl text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="mt-4 text-center">
              <label className="border-2 border-dashed border-slate-700 hover:border-purple-500 rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer transition-colors bg-slate-800/40 hover:bg-slate-800/70">
                <Upload className="w-8 h-8 text-purple-400 mb-2" />
                <span className="text-xs font-bold text-white mb-1">Select .m3u or .m3u8 file</span>
                <span className="text-[11px] text-slate-400">Supports standard M3U, M3U_PLUS and XMLTV links</span>
                <input
                  type="file"
                  accept=".m3u,.m3u8,text/plain"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>

              <div className="mt-4 flex justify-end">
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: Xtream Code API */}
      {activeModal === 'xtream' && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md p-5 shadow-2xl text-white">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Server className="w-4 h-4 text-purple-400" />
                <h3 className="text-sm font-bold">Xtream Codes API Login</h3>
              </div>
              <button onClick={() => setActiveModal(null)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleXtreamSubmit} className="mt-4 space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Any Name</label>
                <input
                  type="text"
                  value={xtreamName}
                  onChange={(e) => setXtreamName(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Server URL & Port</label>
                <input
                  type="text"
                  value={xtreamServer}
                  onChange={(e) => setXtreamServer(e.target.value)}
                  placeholder="http://domain:port"
                  required
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono text-[11px]"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Username</label>
                  <input
                    type="text"
                    value={xtreamUser}
                    onChange={(e) => setXtreamUser(e.target.value)}
                    required
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Password</label>
                  <input
                    type="password"
                    value={xtreamPass}
                    onChange={(e) => setXtreamPass(e.target.value)}
                    required
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold"
                >
                  {loading ? 'Authenticating...' : 'Connect Xtream'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 5: List Playlists */}
      {activeModal === 'list' && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md p-5 shadow-2xl text-white">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-purple-400" />
                <h3 className="text-sm font-bold">Manage Saved Playlists</h3>
              </div>
              <button onClick={() => setActiveModal(null)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-3 divide-y divide-slate-800 max-h-60 overflow-y-auto custom-scrollbar">
              {savedPlaylists.map((pl) => (
                <div key={pl.id} className="py-2.5 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-white">{pl.name}</div>
                    <div className="text-[10px] text-slate-400">{pl.channelCount} channels · {pl.type}</div>
                  </div>
                  <button
                    onClick={() => {
                      if (onSelectSavedPlaylist) onSelectSavedPlaylist(pl);
                      setActiveModal(null);
                      if (onClose) onClose();
                    }}
                    className="px-3 py-1 bg-purple-600 hover:bg-purple-500 rounded-lg text-xs font-semibold"
                  >
                    Load
                  </button>
                </div>
              ))}
            </div>

            <div className="mt-4 flex justify-end">
              <button
                onClick={() => setActiveModal(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 6: 1-Stream API */}
      {activeModal === 'one_stream' && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md p-5 shadow-2xl text-white">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Radio className="w-4 h-4 text-purple-400" />
                <h3 className="text-sm font-bold">1-Stream Portal API</h3>
              </div>
              <button onClick={() => setActiveModal(null)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleXtreamSubmit} className="mt-4 space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">1-Stream Portal Server</label>
                <input
                  type="text"
                  value={oneStreamServer}
                  onChange={(e) => setOneStreamServer(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Device MAC Address</label>
                <input
                  type="text"
                  value={oneStreamMac}
                  onChange={(e) => setOneStreamMac(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold"
                >
                  Connect Portal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Tv, Calendar, Cast, ListMusic, Star, 
  Plus, Settings, Smartphone, Volume2
} from 'lucide-react';
import { Channel, PlaylistSource } from './types/iptv';
import { INITIAL_CHANNELS, DEFAULT_PLAYLIST_SOURCES } from './data/defaultChannels';
import { IPhoneShell } from './components/IPhoneShell';
import { Player } from './components/Player';
import { ChannelList } from './components/ChannelList';
import { EPGGuide } from './components/EPGGuide';
import { CastingHub } from './components/CastingHub';
import { PlaylistSelector } from './components/PlaylistSelector';
import { SmartTVReceiver } from './components/SmartTVReceiver';

type AppTab = 'live' | 'epg' | 'cast' | 'playlists' | 'favorites';

export default function App() {
  const [channels, setChannels] = useState<Channel[]>(() => {
    try {
      const saved = localStorage.getItem('iptv_channels');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      // Fallback
    }
    return INITIAL_CHANNELS;
  });

  const [savedPlaylists, setSavedPlaylists] = useState<PlaylistSource[]>(() => {
    try {
      const saved = localStorage.getItem('iptv_playlists');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      // Fallback
    }
    return DEFAULT_PLAYLIST_SOURCES;
  });

  const [selectedChannel, setSelectedChannel] = useState<Channel>(() => {
    return channels[0] || INITIAL_CHANNELS[0];
  });

  const [activeTab, setActiveTab] = useState<AppTab>('live');
  const [showPlaylistSelectorModal, setShowPlaylistSelectorModal] = useState<boolean>(false);
  const [isTvReceiverMode, setIsTvReceiverMode] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      return params.get('tv') === 'true';
    }
    return false;
  });
  const [isCinemaLandscape, setIsCinemaLandscape] = useState<boolean>(false);

  // Persist channels and playlists to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('iptv_channels', JSON.stringify(channels));
    } catch (e) {
      console.warn('Failed to persist channels', e);
    }
  }, [channels]);

  useEffect(() => {
    try {
      localStorage.setItem('iptv_playlists', JSON.stringify(savedPlaylists));
    } catch (e) {
      console.warn('Failed to persist playlists', e);
    }
  }, [savedPlaylists]);

  // Handle channel selection
  const handleSelectChannel = (channel: Channel) => {
    setSelectedChannel(channel);
    // If not already in live tab or casting, optionally focus player
    if (activeTab === 'playlists') {
      setActiveTab('live');
    }
  };

  // Toggle favorite channel
  const handleToggleFavorite = (channelId: string) => {
    setChannels(prev =>
      prev.map(ch =>
        ch.id === channelId ? { ...ch, isFavorite: !ch.isFavorite } : ch
      )
    );
  };

  // Add channels from M3U / Xtream
  const handleAddChannels = (newChannels: Channel[], source: PlaylistSource) => {
    setChannels(newChannels);
    setSavedPlaylists(prev => [source, ...prev.filter(p => p.id !== source.id)]);
    if (newChannels.length > 0) {
      setSelectedChannel(newChannels[0]);
    }
    setShowPlaylistSelectorModal(false);
    setActiveTab('live');
  };

  // If in Smart TV Big Screen mode, render the receiver directly
  if (isTvReceiverMode) {
    return (
      <SmartTVReceiver
        initialChannel={selectedChannel}
        channels={channels}
        onExit={() => setIsTvReceiverMode(false)}
      />
    );
  }

  return (
    <IPhoneShell
      activeChannel={selectedChannel}
      isPlaying={true}
      isCinemaLandscape={isCinemaLandscape}
      onToggleCinemaOrientation={() => setIsCinemaLandscape(!isCinemaLandscape)}
    >
      <div className="flex flex-col h-full bg-slate-950 text-white select-none relative overflow-hidden">
        {/* Main Tab Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* TAB 1: Live TV (Video Player + Channels List) */}
          {activeTab === 'live' && (
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Top Video Player */}
              <div className="shrink-0 z-10 shadow-lg">
                <Player
                  channel={selectedChannel}
                  channels={channels}
                  onSelectChannel={handleSelectChannel}
                  onOpenCastHub={() => setActiveTab('cast')}
                />
              </div>

              {/* Bottom Channel Feed */}
              <div className="flex-1 overflow-hidden">
                <ChannelList
                  channels={channels}
                  selectedChannel={selectedChannel}
                  onSelectChannel={handleSelectChannel}
                  onToggleFavorite={handleToggleFavorite}
                  onOpenPlaylistSelector={() => setShowPlaylistSelectorModal(true)}
                />
              </div>
            </div>
          )}

          {/* TAB 2: Electronic Program Guide (EPG) */}
          {activeTab === 'epg' && (
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Optional Mini Player Pin */}
              <div className="h-32 bg-black shrink-0 border-b border-slate-800">
                <Player
                  channel={selectedChannel}
                  channels={channels}
                  onSelectChannel={handleSelectChannel}
                  onOpenCastHub={() => setActiveTab('cast')}
                />
              </div>
              <div className="flex-1 overflow-hidden">
                <EPGGuide
                  channels={channels}
                  selectedChannel={selectedChannel}
                  onSelectChannel={handleSelectChannel}
                />
              </div>
            </div>
          )}

          {/* TAB 3: Smart TV Casting & Remote */}
          {activeTab === 'cast' && (
            <div className="flex-1 flex flex-col overflow-hidden">
              <CastingHub
                currentChannel={selectedChannel}
                channels={channels}
                onSelectChannel={handleSelectChannel}
                onOpenTVReceiver={() => setIsTvReceiverMode(true)}
              />
            </div>
          )}

          {/* TAB 4: Playlists / Smarters Selector */}
          {activeTab === 'playlists' && (
            <div className="flex-1 overflow-y-auto">
              <PlaylistSelector
                onAddChannels={handleAddChannels}
                savedPlaylists={savedPlaylists}
                onSelectSavedPlaylist={(src) => {
                  if (src.type === 'preset') {
                    setChannels(INITIAL_CHANNELS);
                    setSelectedChannel(INITIAL_CHANNELS[0]);
                  }
                }}
              />
            </div>
          )}

          {/* TAB 5: Favorites Feed */}
          {activeTab === 'favorites' && (
            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="p-3 border-b border-slate-800 bg-slate-900/60 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                  <h2 className="text-sm font-bold text-white">Starred Favorite Channels</h2>
                </div>
                <span className="text-xs font-mono text-slate-400">
                  {channels.filter(c => c.isFavorite).length} saved
                </span>
              </div>
              <div className="flex-1 overflow-hidden">
                <ChannelList
                  channels={channels.filter(c => c.isFavorite)}
                  selectedChannel={selectedChannel}
                  onSelectChannel={handleSelectChannel}
                  onToggleFavorite={handleToggleFavorite}
                  onOpenPlaylistSelector={() => setShowPlaylistSelectorModal(true)}
                />
              </div>
            </div>
          )}
        </div>

        {/* Modal: Playlist Selector Overlay when triggered via button */}
        {showPlaylistSelectorModal && (
          <div className="absolute inset-0 z-40 bg-slate-950 overflow-y-auto">
            <PlaylistSelector
              onAddChannels={handleAddChannels}
              savedPlaylists={savedPlaylists}
              onClose={() => setShowPlaylistSelectorModal(false)}
            />
          </div>
        )}

        {/* iOS Bottom Tab Bar (Navigation Anchor) */}
        {!isCinemaLandscape && (
          <nav className="h-14 bg-slate-900/95 border-t border-slate-800/90 backdrop-blur-md flex items-center justify-around px-2 shrink-0 z-30 select-none pb-safe">
            {/* Tab 1: Live TV */}
            <button
              onClick={() => setActiveTab('live')}
              className={`flex-1 flex flex-col items-center justify-center py-1 transition-colors min-h-[44px] ${
                activeTab === 'live' ? 'text-purple-400 font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Tv className={`w-5 h-5 ${activeTab === 'live' ? 'stroke-[2.5]' : 'stroke-[1.8]'}`} />
              <span className="text-[10px] tracking-tight mt-0.5">Live TV</span>
            </button>

            {/* Tab 2: TV Guide / EPG */}
            <button
              onClick={() => setActiveTab('epg')}
              className={`flex-1 flex flex-col items-center justify-center py-1 transition-colors min-h-[44px] ${
                activeTab === 'epg' ? 'text-purple-400 font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Calendar className={`w-5 h-5 ${activeTab === 'epg' ? 'stroke-[2.5]' : 'stroke-[1.8]'}`} />
              <span className="text-[10px] tracking-tight mt-0.5">EPG Guide</span>
            </button>

            {/* Tab 3: Smart TV Cast */}
            <button
              onClick={() => setActiveTab('cast')}
              className={`flex-1 flex flex-col items-center justify-center py-1 transition-colors min-h-[44px] ${
                activeTab === 'cast' ? 'text-purple-400 font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Cast className={`w-5 h-5 ${activeTab === 'cast' ? 'stroke-[2.5]' : 'stroke-[1.8]'}`} />
              <span className="text-[10px] tracking-tight mt-0.5">Cast to TV</span>
            </button>

            {/* Tab 4: Playlists (Smarters) */}
            <button
              onClick={() => setActiveTab('playlists')}
              className={`flex-1 flex flex-col items-center justify-center py-1 transition-colors min-h-[44px] ${
                activeTab === 'playlists' ? 'text-purple-400 font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <ListMusic className={`w-5 h-5 ${activeTab === 'playlists' ? 'stroke-[2.5]' : 'stroke-[1.8]'}`} />
              <span className="text-[10px] tracking-tight mt-0.5">Playlists</span>
            </button>

            {/* Tab 5: Favorites */}
            <button
              onClick={() => setActiveTab('favorites')}
              className={`flex-1 flex flex-col items-center justify-center py-1 transition-colors min-h-[44px] ${
                activeTab === 'favorites' ? 'text-amber-400 font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Star className={`w-5 h-5 ${activeTab === 'favorites' ? 'fill-amber-400 stroke-amber-400' : 'stroke-[1.8]'}`} />
              <span className="text-[10px] tracking-tight mt-0.5">Favorites</span>
            </button>
          </nav>
        )}
      </div>
    </IPhoneShell>
  );
}

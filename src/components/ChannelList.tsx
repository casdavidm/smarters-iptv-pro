import React, { useState, useMemo } from 'react';
import { 
  Search, Star, Tv, LayoutGrid, List, Play, 
  Sparkles, X, ChevronRight, SlidersHorizontal
} from 'lucide-react';
import { Channel } from '../types/iptv';
import { getCurrentProgram } from '../utils/epgGenerator';

interface ChannelListProps {
  channels: Channel[];
  selectedChannel: Channel | null;
  onSelectChannel: (channel: Channel) => void;
  onToggleFavorite: (channelId: string) => void;
  onOpenPlaylistSelector: () => void;
}

export const ChannelList: React.FC<ChannelListProps> = ({
  channels,
  selectedChannel,
  onSelectChannel,
  onToggleFavorite,
  onOpenPlaylistSelector
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedGroup, setSelectedGroup] = useState<string>('All');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [onlyFavorites, setOnlyFavorites] = useState<boolean>(false);

  // Group categories
  const categories = useMemo(() => {
    const set = new Set<string>();
    channels.forEach(ch => {
      if (ch.group) set.add(ch.group);
    });
    return ['All', ...Array.from(set)];
  }, [channels]);

  // Filtered list
  const filteredChannels = useMemo(() => {
    return channels.filter(ch => {
      if (onlyFavorites && !ch.isFavorite) return false;
      if (selectedGroup !== 'All' && ch.group !== selectedGroup) return false;
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchName = ch.name.toLowerCase().includes(query);
        const matchGroup = ch.group.toLowerCase().includes(query);
        const matchProg = ch.programs?.some(p => p.title.toLowerCase().includes(query));
        return matchName || matchGroup || matchProg;
      }
      return true;
    });
  }, [channels, selectedGroup, searchQuery, onlyFavorites]);

  return (
    <div className="flex flex-col h-full bg-slate-950 text-slate-100 select-none">
      {/* Search & Filter Header */}
      <div className="p-3 border-b border-slate-800 bg-slate-900/60 backdrop-blur-md shrink-0 flex flex-col gap-2.5">
        {/* Search Input Bar */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search channels & live programs..."
              className="w-full bg-slate-800/80 border border-slate-700/60 rounded-xl pl-9 pr-8 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-purple-500 transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* View mode toggle (List vs Grid) */}
          <div className="flex items-center bg-slate-800/80 p-0.5 rounded-xl border border-slate-700/50">
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-lg transition-colors ${
                viewMode === 'list' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
              title="List View"
            >
              <List className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition-colors ${
                viewMode === 'grid' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
              title="Grid View"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Category Filter Pills & Favorites Button */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
          {/* Favorites Filter button */}
          <button
            onClick={() => setOnlyFavorites(!onlyFavorites)}
            className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 shrink-0 transition-colors ${
              onlyFavorites
                ? 'bg-amber-500 text-slate-950 font-bold'
                : 'bg-slate-800/80 text-slate-300 hover:text-white border border-slate-700/50'
            }`}
          >
            <Star className={`w-3 h-3 ${onlyFavorites ? 'fill-slate-950' : 'text-amber-400'}`} />
            <span>Favorites</span>
          </button>

          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => {
                setSelectedGroup(cat);
                setOnlyFavorites(false);
              }}
              className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors shrink-0 ${
                !onlyFavorites && selectedGroup === cat
                  ? 'bg-purple-600 text-white font-semibold'
                  : 'bg-slate-800/80 text-slate-400 hover:text-slate-200 border border-slate-700/40'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Channels Feed */}
      <div className="flex-1 overflow-y-auto p-3 custom-scrollbar">
        {filteredChannels.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center text-center p-4">
            <Tv className="w-12 h-12 text-slate-600 mb-2 stroke-1" />
            <h3 className="text-sm font-bold text-white">No Channels Found</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-xs">
              Try adjusting your search query, clearing filters, or importing an M3U playlist.
            </p>
            <button
              onClick={onOpenPlaylistSelector}
              className="mt-4 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-xl shadow-md transition-all active:scale-98"
            >
              Add New Playlist
            </button>
          </div>
        ) : viewMode === 'list' ? (
          /* List View Rows */
          <div className="divide-y divide-slate-800/60">
            {filteredChannels.map((ch, idx) => {
              const isSelected = selectedChannel?.id === ch.id;
              const currentProg = ch.programs ? getCurrentProgram(ch.programs) : null;

              return (
                <div
                  key={ch.id}
                  onClick={() => onSelectChannel(ch)}
                  className={`py-2.5 px-3 rounded-xl transition-all cursor-pointer flex items-center justify-between group ${
                    isSelected
                      ? 'bg-purple-950/40 border border-purple-500/50 shadow-sm'
                      : 'hover:bg-slate-900/60'
                  }`}
                >
                  <div className="flex items-center gap-3 truncate min-w-0 pr-2">
                    {/* Channel Number */}
                    <span className="text-[10px] font-mono text-slate-500 w-4 shrink-0">
                      {(idx + 1).toString().padStart(2, '0')}
                    </span>

                    {/* Channel Logo */}
                    <div className="relative shrink-0">
                      <img
                        src={ch.logo}
                        alt={ch.name}
                        referrerPolicy="no-referrer"
                        className="w-10 h-10 rounded-xl object-cover bg-slate-800 border border-slate-700/60 shadow-xs"
                      />
                      {isSelected && (
                        <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-purple-600 text-white flex items-center justify-center">
                          <Play className="w-2 h-2 fill-white ml-0.5" />
                        </div>
                      )}
                    </div>

                    {/* Metadata & EPG Snippet */}
                    <div className="truncate">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white truncate tracking-tight">
                          {ch.name}
                        </span>
                        <span className="text-[10px] font-mono text-purple-400 bg-purple-950/60 px-1 rounded border border-purple-800/40 shrink-0">
                          {ch.resolution || 'HD'}
                        </span>
                      </div>

                      {currentProg ? (
                        <div className="text-[11px] text-slate-400 truncate mt-0.5 flex items-center gap-1.5">
                          <span className="text-slate-300 font-medium truncate">{currentProg.title}</span>
                          <span className="text-[10px] text-slate-500 shrink-0">· {currentProg.category}</span>
                        </div>
                      ) : (
                        <div className="text-[10px] text-slate-500 truncate mt-0.5">
                          {ch.group} · {ch.country || 'Global'}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right Actions: Favorite Toggle & Chevron */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleFavorite(ch.id);
                      }}
                      className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                      title={ch.isFavorite ? 'Remove Favorite' : 'Add to Favorites'}
                    >
                      <Star
                        className={`w-4 h-4 ${
                          ch.isFavorite ? 'fill-amber-400 text-amber-400' : 'text-slate-500 hover:text-slate-300'
                        }`}
                      />
                    </button>
                    <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-slate-300 transition-colors" />
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Grid View Cards */
          <div className="grid grid-cols-2 gap-2.5">
            {filteredChannels.map((ch) => {
              const isSelected = selectedChannel?.id === ch.id;
              const currentProg = ch.programs ? getCurrentProgram(ch.programs) : null;

              return (
                <div
                  key={ch.id}
                  onClick={() => onSelectChannel(ch)}
                  className={`p-3 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between relative overflow-hidden group ${
                    isSelected
                      ? 'bg-purple-950/40 border-purple-500/70 shadow-lg shadow-purple-950/50'
                      : 'bg-slate-900/60 border-slate-800/80 hover:border-slate-700 hover:bg-slate-900'
                  }`}
                >
                  {/* Top: Logo & Favorite */}
                  <div className="flex items-start justify-between mb-2">
                    <img
                      src={ch.logo}
                      alt={ch.name}
                      referrerPolicy="no-referrer"
                      className="w-10 h-10 rounded-xl object-cover bg-slate-800 border border-slate-700/60"
                    />
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleFavorite(ch.id);
                      }}
                      className="p-1 rounded-lg hover:bg-white/10 transition-colors"
                    >
                      <Star
                        className={`w-4 h-4 ${
                          ch.isFavorite ? 'fill-amber-400 text-amber-400' : 'text-slate-500 hover:text-slate-300'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Channel Title */}
                  <div>
                    <div className="text-xs font-bold text-white truncate">{ch.name}</div>
                    <div className="text-[10px] text-purple-400 font-mono mt-0.5">
                      {ch.group} · {ch.resolution || 'HD'}
                    </div>
                  </div>

                  {/* EPG snippet */}
                  {currentProg && (
                    <div className="mt-2 pt-2 border-t border-slate-800 text-[10px] text-slate-400 truncate">
                      <span className="text-white font-medium truncate block">{currentProg.title}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

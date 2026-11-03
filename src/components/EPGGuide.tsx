import React, { useState, useMemo } from 'react';
import { 
  Calendar, Clock, Search, Play, Bell, 
  ChevronRight, X, Info, Sparkles, Check
} from 'lucide-react';
import { Channel, EPGProgram } from '../types/iptv';
import { getCurrentProgram } from '../utils/epgGenerator';

interface EPGGuideProps {
  channels: Channel[];
  selectedChannel: Channel | null;
  onSelectChannel: (channel: Channel) => void;
}

export const EPGGuide: React.FC<EPGGuideProps> = ({
  channels,
  selectedChannel,
  onSelectChannel
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeDateOffset, setActiveDateOffset] = useState<number>(0); // 0 = Today, 1 = Tomorrow
  const [inspectedProgram, setInspectedProgram] = useState<{ program: EPGProgram; channel: Channel } | null>(null);
  const [reminders, setReminders] = useState<string[]>([]);
  const [reminderToast, setReminderToast] = useState<string | null>(null);

  // Categories list
  const categories = useMemo(() => {
    const set = new Set<string>();
    channels.forEach(ch => {
      if (ch.group) set.add(ch.group);
    });
    return ['All', ...Array.from(set)];
  }, [channels]);

  // Filtered channels
  const filteredChannels = useMemo(() => {
    return channels.filter(ch => {
      const matchCat = selectedCategory === 'All' || ch.group === selectedCategory;
      const matchQuery = !searchQuery || 
        ch.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ch.programs?.some(p => p.title.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchCat && matchQuery;
    });
  }, [channels, selectedCategory, searchQuery]);

  // Reference current time
  const now = new Date();
  
  // Format hours for timeline header (e.g. 17:00, 17:30, 18:00...)
  const timeHeaders = useMemo(() => {
    const headers: { label: string; date: Date }[] = [];
    const base = new Date(now.getTime() - 2 * 60 * 60 * 1000);
    base.setMinutes(base.getMinutes() < 30 ? 0 : 30, 0, 0);

    for (let i = 0; i < 12; i++) {
      const d = new Date(base.getTime() + i * 30 * 60 * 1000);
      const hours = d.getHours().toString().padStart(2, '0');
      const minutes = d.getMinutes().toString().padStart(2, '0');
      headers.push({ label: `${hours}:${minutes}`, date: d });
    }
    return headers;
  }, []);

  const toggleReminder = (programId: string, title: string) => {
    if (reminders.includes(programId)) {
      setReminders(prev => prev.filter(id => id !== programId));
      showToast(`Reminder removed for "${title}"`);
    } else {
      setReminders(prev => [...prev, programId]);
      showToast(`Reminder set for "${title}". We will notify you before broadcast.`);
    }
  };

  const showToast = (msg: string) => {
    setReminderToast(msg);
    setTimeout(() => setReminderToast(null), 3000);
  };

  return (
    <div className="flex flex-col h-full bg-slate-950 text-slate-100 select-none">
      {/* Toast Notification */}
      {reminderToast && (
        <div className="fixed top-14 left-1/2 -translate-x-1/2 z-50 bg-purple-600 text-white text-xs font-semibold px-4 py-2 rounded-full shadow-xl flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
          <Check className="w-3.5 h-3.5" />
          <span>{reminderToast}</span>
        </div>
      )}

      {/* Guide Header Controls */}
      <div className="p-3 border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md shrink-0 flex flex-col gap-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-purple-400" />
            <h2 className="text-sm font-bold text-white tracking-tight">Electronic Program Guide</h2>
          </div>

          {/* Date Selector Segmented Buttons */}
          <div className="flex items-center bg-slate-800/80 p-0.5 rounded-lg border border-slate-700/50">
            {['Yesterday', 'Today', 'Tomorrow'].map((day, idx) => {
              const offset = idx - 1;
              return (
                <button
                  key={day}
                  onClick={() => setActiveDateOffset(offset)}
                  className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                    activeDateOffset === offset
                      ? 'bg-purple-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {day}
                </button>
              );
            })}
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search TV guide by show or channel..."
            className="w-full bg-slate-800/80 border border-slate-700/60 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-purple-500 transition-colors"
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

        {/* Category Filter Horizontal Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors shrink-0 ${
                selectedCategory === cat
                  ? 'bg-purple-600 text-white font-semibold'
                  : 'bg-slate-800/80 text-slate-400 hover:text-slate-200 border border-slate-700/40'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Interactive EPG Timeline Grid */}
      <div className="flex-1 overflow-x-auto overflow-y-auto custom-scrollbar relative">
        <div className="min-w-[920px]">
          {/* Time Header Axis */}
          <div className="sticky top-0 z-20 flex bg-slate-900 border-b border-slate-800 shadow-md">
            {/* Channel Column Corner */}
            <div className="w-48 sticky left-0 z-30 bg-slate-900 border-r border-slate-800 px-3 py-2 text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
              <span>Channel</span>
              <Clock className="w-3.5 h-3.5 text-purple-400" />
            </div>

            {/* Time Slots */}
            <div className="flex-1 flex">
              {timeHeaders.map((th, i) => (
                <div
                  key={i}
                  className="w-40 border-r border-slate-800/70 px-2.5 py-2 text-[11px] font-mono text-slate-400 shrink-0 flex items-center justify-between"
                >
                  <span>{th.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Channel Program Rows */}
          <div className="divide-y divide-slate-800/60">
            {filteredChannels.map((ch, chIdx) => {
              const isSelected = selectedChannel?.id === ch.id;
              const currentProg = ch.programs ? getCurrentProgram(ch.programs) : null;

              return (
                <div 
                  key={ch.id} 
                  className={`flex group transition-colors ${
                    isSelected ? 'bg-purple-950/20' : 'hover:bg-slate-900/40'
                  }`}
                >
                  {/* Sticky Channel Column */}
                  <div 
                    onClick={() => onSelectChannel(ch)}
                    className="w-48 sticky left-0 z-10 bg-slate-950/95 group-hover:bg-slate-900/95 border-r border-slate-800 px-3 py-2.5 flex items-center gap-2.5 cursor-pointer backdrop-blur-md shrink-0 transition-colors"
                  >
                    <span className="text-[10px] font-mono text-slate-500 w-4 shrink-0">
                      {(chIdx + 1).toString().padStart(2, '0')}
                    </span>
                    <img
                      src={ch.logo}
                      alt={ch.name}
                      referrerPolicy="no-referrer"
                      className="w-8 h-8 rounded-lg object-cover bg-slate-800 shrink-0 border border-slate-700/60"
                    />
                    <div className="truncate">
                      <div className="text-xs font-bold text-white truncate flex items-center gap-1">
                        <span className="truncate">{ch.name}</span>
                        {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse shrink-0" />}
                      </div>
                      <div className="text-[10px] text-slate-400 truncate">
                        {ch.group}
                      </div>
                    </div>
                  </div>

                  {/* Horizontal Programs Timeline */}
                  <div className="flex-1 flex relative items-center py-1.5 px-1 overflow-hidden">
                    {ch.programs && ch.programs.length > 0 ? (
                      ch.programs.map((prog) => {
                        const isNowPlaying = currentProg?.id === prog.id;
                        const hasReminder = reminders.includes(prog.id);

                        const startTime = new Date(prog.startTime);
                        const endTime = new Date(prog.endTime);
                        const durationMins = Math.round((endTime.getTime() - startTime.getTime()) / (1000 * 60));

                        // 30 mins = 160px width
                        const widthPx = Math.max(120, (durationMins / 30) * 160);

                        return (
                          <div
                            key={prog.id}
                            style={{ width: `${widthPx}px` }}
                            onClick={() => setInspectedProgram({ program: prog, channel: ch })}
                            className={`h-14 mx-0.5 p-2 rounded-xl border text-left cursor-pointer transition-all flex flex-col justify-between shrink-0 relative overflow-hidden group/item ${
                              isNowPlaying
                                ? 'bg-purple-900/35 border-purple-500/60 shadow-sm shadow-purple-900/20'
                                : 'bg-slate-900/70 border-slate-800/80 hover:border-slate-700 hover:bg-slate-800/70'
                            }`}
                          >
                            {/* Top info */}
                            <div className="flex items-center justify-between gap-1">
                              <span className="text-[10px] font-mono text-slate-400 truncate">
                                {startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {endTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                              {isNowPlaying && (
                                <span className="text-[9px] font-bold uppercase tracking-wider px-1 py-0.2 bg-purple-600 text-white rounded">
                                  LIVE
                                </span>
                              )}
                              {hasReminder && (
                                <Bell className="w-3 h-3 text-amber-400 fill-amber-400 shrink-0" />
                              )}
                            </div>

                            {/* Program title */}
                            <div className="text-xs font-semibold text-slate-100 truncate group-hover/item:text-purple-300">
                              {prog.title}
                            </div>

                            {/* Category & Episode */}
                            <div className="flex items-center gap-1.5 text-[9px] text-slate-400 truncate">
                              <span>{prog.category}</span>
                              {prog.rating && (
                                <>
                                  <span>·</span>
                                  <span className="font-mono text-slate-400">{prog.rating}</span>
                                </>
                              )}
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="px-4 py-2 text-xs text-slate-500">
                        EPG schedule syncing...
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Program Details Bottom Sheet / Inspector */}
      {inspectedProgram && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end justify-center animate-in fade-in duration-150">
          <div className="bg-slate-900 border-t border-slate-700 rounded-t-3xl w-full max-w-lg p-5 shadow-2xl animate-in slide-in-from-bottom duration-200">
            {/* Grab Handle */}
            <div className="w-12 h-1.5 bg-slate-700 rounded-full mx-auto mb-4" />

            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 text-xs text-purple-400 font-semibold mb-1">
                  <span>{inspectedProgram.channel.name}</span>
                  <span>·</span>
                  <span>{inspectedProgram.program.category}</span>
                  {inspectedProgram.program.rating && (
                    <>
                      <span>·</span>
                      <span className="px-1 py-0.5 bg-slate-800 rounded font-mono text-[10px] text-slate-300">
                        {inspectedProgram.program.rating}
                      </span>
                    </>
                  )}
                </div>
                <h3 className="text-base font-bold text-white tracking-tight">
                  {inspectedProgram.program.title}
                </h3>
              </div>
              <button
                onClick={() => setInspectedProgram(null)}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Time and Duration */}
            <div className="flex items-center gap-2 text-xs font-mono text-slate-400 my-3">
              <Clock className="w-3.5 h-3.5 text-purple-400" />
              <span>
                {new Date(inspectedProgram.program.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} – {new Date(inspectedProgram.program.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
              <span>·</span>
              <span>
                {Math.round((new Date(inspectedProgram.program.endTime).getTime() - new Date(inspectedProgram.program.startTime).getTime()) / 60000)} minutes
              </span>
            </div>

            {/* Description */}
            <p className="text-xs text-slate-300 leading-relaxed mb-5 bg-slate-950/50 p-3 rounded-xl border border-slate-800/80">
              {inspectedProgram.program.description}
            </p>

            {/* Actions */}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => {
                  onSelectChannel(inspectedProgram.channel);
                  setInspectedProgram(null);
                }}
                className="h-11 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-purple-900/40 active:scale-98 transition-all"
              >
                <Play className="w-4 h-4 fill-white" />
                <span>Watch Channel Live</span>
              </button>

              <button
                onClick={() => {
                  toggleReminder(inspectedProgram.program.id, inspectedProgram.program.title);
                }}
                className={`h-11 border text-xs font-semibold rounded-xl flex items-center justify-center gap-2 active:scale-98 transition-all ${
                  reminders.includes(inspectedProgram.program.id)
                    ? 'bg-amber-500/20 border-amber-500/50 text-amber-300'
                    : 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700'
                }`}
              >
                <Bell className={`w-4 h-4 ${reminders.includes(inspectedProgram.program.id) ? 'fill-amber-400 text-amber-400' : ''}`} />
                <span>{reminders.includes(inspectedProgram.program.id) ? 'Reminder Saved' : 'Remind Me'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

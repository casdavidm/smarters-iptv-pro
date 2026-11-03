import { Channel } from '../types/iptv';
import { generateProgramsForChannel } from './epgGenerator';

/**
 * Parses raw M3U or M3U8 string content into a structured Channel array
 */
export function parseM3U(content: string, playlistId: string = 'custom'): Channel[] {
  const lines = content.split(/\r?\n/);
  const channels: Channel[] = [];
  
  let currentChannel: Partial<Channel> | null = null;
  let count = 0;

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const line = rawLine.trim();

    if (!line) continue;

    // Check for #EXTINF tag
    if (line.startsWith('#EXTINF:')) {
      currentChannel = {};
      
      // Parse tvg-id
      const tvgIdMatch = line.match(/tvg-id="([^"]*)"/i);
      if (tvgIdMatch) currentChannel.tvgId = tvgIdMatch[1];

      // Parse tvg-name
      const tvgNameMatch = line.match(/tvg-name="([^"]*)"/i);
      if (tvgNameMatch) currentChannel.tvgName = tvgNameMatch[1];

      // Parse tvg-logo
      const tvgLogoMatch = line.match(/tvg-logo="([^"]*)"/i);
      if (tvgLogoMatch) currentChannel.logo = tvgLogoMatch[1];

      // Parse group-title (Category)
      const groupMatch = line.match(/group-title="([^"]*)"/i);
      if (groupMatch) {
        currentChannel.group = groupMatch[1];
      } else {
        currentChannel.group = 'General';
      }

      // Parse tvg-country
      const countryMatch = line.match(/tvg-country="([^"]*)"/i);
      if (countryMatch) currentChannel.country = countryMatch[1];

      // Parse tvg-language
      const langMatch = line.match(/tvg-language="([^"]*)"/i);
      if (langMatch) currentChannel.language = langMatch[1];

      // Parse Channel Name (everything after the last comma)
      const commaIndex = line.lastIndexOf(',');
      if (commaIndex !== -1) {
        const name = line.substring(commaIndex + 1).trim();
        if (name) currentChannel.name = name;
      }

      // Fallback name from tvg-name or default
      if (!currentChannel.name) {
        currentChannel.name = currentChannel.tvgName || `Channel ${count + 1}`;
      }
    } else if (line.startsWith('#')) {
      // Other metadata directives like #EXTGRP
      if (line.startsWith('#EXTGRP:') && currentChannel) {
        currentChannel.group = line.replace('#EXTGRP:', '').trim();
      }
    } else if (line.startsWith('http://') || line.startsWith('https://') || line.startsWith('rtmp://') || line.startsWith('/')) {
      // Stream URL
      const streamUrl = line;
      
      const id = `${playlistId}-ch-${count++}`;
      const channelName = currentChannel?.name || `Live Stream ${count}`;
      const category = currentChannel?.group || inferCategory(channelName);
      
      const channel: Channel = {
        id,
        name: channelName,
        url: streamUrl,
        logo: currentChannel?.logo || getCategoryPlaceholderLogo(category),
        group: category,
        tvgId: currentChannel?.tvgId || id,
        tvgName: currentChannel?.tvgName || channelName,
        resolution: inferResolution(channelName, streamUrl),
        country: currentChannel?.country || 'Global',
        language: currentChannel?.language || 'English',
        isFavorite: false,
        programs: generateProgramsForChannel(id, category)
      };

      channels.push(channel);
      currentChannel = null;
    }
  }

  return channels;
}

/**
 * Infer category from channel title keywords
 */
function inferCategory(name: string): string {
  const lower = name.toLowerCase();
  if (lower.includes('news') || lower.includes('cnn') || lower.includes('bbc') || lower.includes('dw') || lower.includes('weather')) return 'News';
  if (lower.includes('sport') || lower.includes('espn') || lower.includes('football') || lower.includes('racing') || lower.includes('red bull')) return 'Sports';
  if (lower.includes('movie') || lower.includes('cinema') || lower.includes('film') || lower.includes('hbo') || lower.includes('action')) return 'Cinema';
  if (lower.includes('music') || lower.includes('mtv') || lower.includes('hits') || lower.includes('beats') || lower.includes('radio')) return 'Music';
  if (lower.includes('kid') || lower.includes('cartoon') || lower.includes('disney') || lower.includes('toon') || lower.includes('anime')) return 'Kids';
  if (lower.includes('doc') || lower.includes('geo') || lower.includes('discovery') || lower.includes('nature') || lower.includes('planet')) return 'Documentary';
  if (lower.includes('space') || lower.includes('nasa') || lower.includes('science')) return 'Space';
  return 'Entertainment';
}

/**
 * Infer resolution tag from channel title
 */
function inferResolution(name: string, url: string): string {
  const lower = (name + ' ' + url).toLowerCase();
  if (lower.includes('4k') || lower.includes('uhd')) return '4K UHD';
  if (lower.includes('fhd') || lower.includes('1080')) return '1080p';
  if (lower.includes('hd') || lower.includes('720')) return '720p';
  return 'HD';
}

/**
 * Reliable category fallback artwork
 */
function getCategoryPlaceholderLogo(category: string): string {
  switch (category) {
    case 'News':
      return 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=128&auto=format&fit=crop&q=80';
    case 'Sports':
      return 'https://images.unsplash.com/photo-1517649763962-0c623266ddc0?w=128&auto=format&fit=crop&q=80';
    case 'Cinema':
      return 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=128&auto=format&fit=crop&q=80';
    case 'Music':
      return 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=128&auto=format&fit=crop&q=80';
    case 'Space':
      return 'https://images.unsplash.com/photo-1614728894747-a83421e2b9c9?w=128&auto=format&fit=crop&q=80';
    case 'Documentary':
      return 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=128&auto=format&fit=crop&q=80';
    default:
      return 'https://images.unsplash.com/photo-1594909122845-11baa439b7bf?w=128&auto=format&fit=crop&q=80';
  }
}

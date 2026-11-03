export interface EPGProgram {
  id: string;
  channelId: string;
  title: string;
  description: string;
  startTime: string; // ISO string
  endTime: string;   // ISO string
  category: string;
  rating?: string;
  episode?: string;
  thumbnail?: string;
}

export interface Channel {
  id: string;
  name: string;
  logo: string;
  group: string;
  url: string;
  tvgId?: string;
  tvgName?: string;
  resolution?: string;
  country?: string;
  language?: string;
  isFavorite?: boolean;
  programs?: EPGProgram[];
}

export interface PlaylistSource {
  id: string;
  name: string;
  type: 'm3u_url' | 'm3u_file' | 'xtream' | 'single_stream' | 'preset' | 'one_stream';
  url?: string;
  epgUrl?: string;
  server?: string;
  username?: string;
  password?: string;
  channelCount: number;
  addedAt: string;
  lastUpdated?: string;
}

export type CastDeviceType = 
  | 'airplay' 
  | 'chromecast' 
  | 'samsung_tizen' 
  | 'lg_webos' 
  | 'sony_bravia' 
  | 'apple_tv' 
  | 'roku' 
  | 'fire_tv';

export interface CastDevice {
  id: string;
  name: string;
  type: CastDeviceType;
  model: string;
  status: 'available' | 'connecting' | 'connected';
  location: string;
  ip?: string;
}

export interface CastSession {
  active: boolean;
  device: CastDevice | null;
  channel: Channel | null;
  volume: number;
  isMuted: boolean;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
}

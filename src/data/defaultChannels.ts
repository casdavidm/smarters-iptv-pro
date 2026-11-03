import { Channel } from '../types/iptv';
import { generateProgramsForChannel } from '../utils/epgGenerator';

export const INITIAL_CHANNELS: Channel[] = [
  {
    id: 'ch-nasa-hd',
    name: 'NASA TV HD Live',
    logo: 'https://images.unsplash.com/photo-1614728894747-a83421e2b9c9?w=128&auto=format&fit=crop&q=80',
    group: 'Space',
    url: 'https://ntv1.akamaized.net/hls/live/2014075/NASA-NTV1-HLS/master.m3u8',
    tvgId: 'nasa.gov',
    tvgName: 'NASA TV',
    resolution: '1080p',
    country: 'USA',
    language: 'English',
    isFavorite: true,
    programs: generateProgramsForChannel('ch-nasa-hd', 'Space')
  },
  {
    id: 'ch-bloomberg',
    name: 'Bloomberg Quicktake',
    logo: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=128&auto=format&fit=crop&q=80',
    group: 'News',
    url: 'https://liveproduseast.akamaized.net/us/Channel-News-AWS-virginia-1/master.m3u8',
    tvgId: 'bloomberg.com',
    tvgName: 'Bloomberg News',
    resolution: '1080p',
    country: 'USA',
    language: 'English',
    isFavorite: true,
    programs: generateProgramsForChannel('ch-bloomberg', 'News')
  },
  {
    id: 'ch-france24',
    name: 'France 24 English',
    logo: 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=128&auto=format&fit=crop&q=80',
    group: 'News',
    url: 'https://france24-en-hls.siliconweb.com/france24-en-hls/master.m3u8',
    tvgId: 'france24.en',
    tvgName: 'France 24',
    resolution: '1080p',
    country: 'France',
    language: 'English',
    isFavorite: false,
    programs: generateProgramsForChannel('ch-france24', 'News')
  },
  {
    id: 'ch-dw-news',
    name: 'DW News World',
    logo: 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=128&auto=format&fit=crop&q=80',
    group: 'News',
    url: 'https://dwamdstream102.akamaized.net/hls/live/2015525/dwstream102/index.m3u8',
    tvgId: 'dw.de',
    tvgName: 'DW English',
    resolution: '720p',
    country: 'Germany',
    language: 'English',
    isFavorite: false,
    programs: generateProgramsForChannel('ch-dw-news', 'News')
  },
  {
    id: 'ch-redbull-tv',
    name: 'Red Bull TV Live',
    logo: 'https://images.unsplash.com/photo-1517649763962-0c623266ddc0?w=128&auto=format&fit=crop&q=80',
    group: 'Sports',
    url: 'https://rbmn-live.akamaized.net/hls/live/590964/BoRB-AT/master.m3u8',
    tvgId: 'redbull.tv',
    tvgName: 'Red Bull TV',
    resolution: '1080p',
    country: 'Austria',
    language: 'English',
    isFavorite: true,
    programs: generateProgramsForChannel('ch-redbull-tv', 'Sports')
  },
  {
    id: 'ch-euronews',
    name: 'Euronews Live HD',
    logo: 'https://images.unsplash.com/photo-1495020689067-958852a7765e?w=128&auto=format&fit=crop&q=80',
    group: 'News',
    url: 'https://rakuten-euronews-1-gb.samsung.wurl.tv/manifest/playlist.m3u8',
    tvgId: 'euronews.com',
    tvgName: 'Euronews',
    resolution: '1080p',
    country: 'EU',
    language: 'English',
    isFavorite: false,
    programs: generateProgramsForChannel('ch-euronews', 'News')
  },
  {
    id: 'ch-weathernation',
    name: 'WeatherNation Live',
    logo: 'https://images.unsplash.com/photo-1592210454359-9043f067919b?w=128&auto=format&fit=crop&q=80',
    group: 'News',
    url: 'https://weathernation.tubi.video/index.m3u8',
    tvgId: 'weathernation.tv',
    tvgName: 'WeatherNation',
    resolution: '720p',
    country: 'USA',
    language: 'English',
    isFavorite: false,
    programs: generateProgramsForChannel('ch-weathernation', 'News')
  },
  {
    id: 'ch-sintel-cinema',
    name: 'Cinema World: Sintel HD',
    logo: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=128&auto=format&fit=crop&q=80',
    group: 'Cinema',
    url: 'https://bitdash-a.akamaihd.net/content/sintel/hls/playlist.m3u8',
    tvgId: 'cinema.sintel',
    tvgName: 'Sintel Stream',
    resolution: '1080p',
    country: 'International',
    language: 'English',
    isFavorite: true,
    programs: generateProgramsForChannel('ch-sintel-cinema', 'Cinema')
  },
  {
    id: 'ch-tears-of-steel',
    name: 'Sci-Fi Channel: 4K Tears',
    logo: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=128&auto=format&fit=crop&q=80',
    group: 'Cinema',
    url: 'https://demo.unified-streaming.com/k8s/features/stable/video/tears-of-steel/tears-of-steel.ism/.m3u8',
    tvgId: 'cinema.tears',
    tvgName: 'Tears of Steel',
    resolution: '4K UHD',
    country: 'Netherlands',
    language: 'English',
    isFavorite: false,
    programs: generateProgramsForChannel('ch-tears-of-steel', 'Cinema')
  },
  {
    id: 'ch-bunny-animation',
    name: 'Animation Plus: Big Bunny',
    logo: 'https://images.unsplash.com/photo-1534809027769-b00d750a6bac?w=128&auto=format&fit=crop&q=80',
    group: 'Cinema',
    url: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
    tvgId: 'animation.bunny',
    tvgName: 'Big Buck Bunny',
    resolution: '1080p',
    country: 'USA',
    language: 'English',
    isFavorite: false,
    programs: generateProgramsForChannel('ch-bunny-animation', 'Cinema')
  },
  {
    id: 'ch-nature-doc',
    name: 'Discovery Blue: Ocean Life',
    logo: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=128&auto=format&fit=crop&q=80',
    group: 'Documentary',
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    tvgId: 'doc.nature',
    tvgName: 'Discovery Nature',
    resolution: '1080p',
    country: 'UK',
    language: 'English',
    isFavorite: false,
    programs: generateProgramsForChannel('ch-nature-doc', 'Documentary')
  },
  {
    id: 'ch-lofi-chill',
    name: 'Lo-Fi Chill & Lounge TV',
    logo: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=128&auto=format&fit=crop&q=80',
    group: 'Music',
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4',
    tvgId: 'music.lofi',
    tvgName: 'Lo-Fi Lounge',
    resolution: '1080p',
    country: 'Japan',
    language: 'Instrumental',
    isFavorite: true,
    programs: generateProgramsForChannel('ch-lofi-chill', 'Music')
  }
];

export const DEFAULT_PLAYLIST_SOURCES = [
  {
    id: 'src-default-freetv',
    name: 'Free-to-Air Global Stream Pack',
    type: 'preset' as const,
    channelCount: INITIAL_CHANNELS.length,
    addedAt: '2026-11-02T12:00:00Z',
    url: 'https://iptv-org.github.io/iptv/index.m3u'
  }
];

import { EPGProgram } from '../types/iptv';

// Curated show templates per channel category
const SHOW_TEMPLATES: Record<string, { titles: string[]; descriptions: string[] }> = {
  News: {
    titles: [
      'Global News Hour Live',
      'The Evening Briefing with David Vance',
      'Market Pulse & Financial Markets',
      'Breaking Perspectives & In-Depth Analysis',
      'World Weather Roundup',
      'Prime Time Special Report',
      'Morning Headlines & Breakfast Show',
      'Insight: Geopolitics Today'
    ],
    descriptions: [
      'Live coverage of international headlines, business developments, and top investigative journalism from around the globe.',
      'Comprehensive evening analysis of today’s defining news stories, political debates, and pressing economic events.',
      'Wall Street updates, macroeconomic forecasts, and expert commentary on commodities, crypto, and equities.',
      'Special panel discussion featuring foreign correspondents and geopolitical analysts dissecting pressing conflicts.',
      'Comprehensive regional and global meteorological forecasts, severe weather tracking, and climate perspectives.',
      'An investigative deep-dive examining supply chains, technological disruption, and energy policies.',
      'Your morning briefing covering breaking overnight dispatches, sports highlights, and commute insights.',
      'Interviews with international diplomats, scholars, and policy leaders examining global alliances.'
    ]
  },
  Sports: {
    titles: [
      'Red Bull Cliff Diving Championship',
      'Extreme Downhill MTB World Series',
      'Formula Apex: Race Highlights',
      'UFC / MMA Fight Night Rewind',
      'European Champions Football Recap',
      'Pro Surfing Tour: Pipeline Masters',
      'X-Games Mountain Freestyle Special',
      'Global Sports Center Daily'
    ],
    descriptions: [
      'Daredevil divers leap from towering sea cliffs in Italy reaching speeds over 85 km/h in world tour action.',
      'High-speed downhill mountain biking through rugged alpine terrains with helmet-cam telemetry.',
      'Full post-race debrief, telemetry breakdown, and podium interviews from the latest Grand Prix thriller.',
      'Relive the most thrilling knockouts, submission battles, and coach tactical breakdowns in combat sports.',
      'Tactical breakdown, highlight reels, and locker room reaction from elite continental club football clashes.',
      'World-class wave riders battle monstrous barrels at Hawaii’s famous Banzai Pipeline.',
      'Big air, slopestyle, and superpipe aerial acrobatics from winter extreme sports champions.',
      'The complete daily roundup of scores, league tables, breaking trades, and locker room reaction.'
    ]
  },
  Space: {
    titles: [
      'Artemis: Return to the Moon',
      'ISS Expedition Live Feed & Spacewalk',
      'James Webb Deep Field Discoveries',
      'Mars Perseverance Rover Diary',
      'Rocket Launch Countdown & Telemetry',
      'Cosmic Wonders: Neutron Stars',
      'Hubble 35-Year Anniversary Special',
      'Solar Storms & The Northern Lights'
    ],
    descriptions: [
      'Engineering chronicles and astronaut crew updates for humanity’s next giant leap to the lunar south pole.',
      'Live HD views of Earth from the cupola module on the International Space Station with astronaut mission audio.',
      'Astrophysicists interpret revolutionary infrared images revealing galaxies formed near the dawn of time.',
      'High-resolution Martian terrain scans, rock core sampling updates, and Ingenuity drone telemetry review.',
      'Orbital vehicle roll-out, propellant cryogenic loading, and live launch sequence broadcast.',
      'Exploration of magnetars, pulsars, and gravitational waves shaping the fabric of spacetime.',
      'A tribute to the telescope that transformed human cosmology, featuring restored iconic nebula deep-shots.',
      'Coronal mass ejections, solar flares, and high-latitude geomagnetic auroral displays filmed in 4K.'
    ]
  },
  Cinema: {
    titles: [
      'Sintel: The Dragon’s Call (Remastered)',
      'Tears of Steel: Neo Amsterdam 2048',
      'Big Buck Bunny & The Woodland Mischief',
      'Classic Film Noir: Midnight Alley',
      'Independent Cinema Showcase',
      'Golden Age Comedy Marathon',
      'Director’s Cut: Sci-Fi Visions',
      'Behind the Screen: Practical Visual FX'
    ],
    descriptions: [
      'An epic fantasy quest of a lone warrior searching across desolate peaks for her stolen companion.',
      'Dystopian science-fiction thrill following resistance fighters defending Amsterdam against rogue biomechanical units.',
      'A legendary open-source animated adventure featuring hilarious forest antics and vibrant animation.',
      'A private investigator uncovers a syndicate conspiracy beneath the rain-slicked boulevards of 1940s Chicago.',
      'Award-winning festival selections, thought-provoking screenplays, and breakout filmmaker spotlights.',
      'Buster Keaton, Charlie Chaplin, and timeless slapstick classics restored in high-definition clarity.',
      'Cult cinematic masterpieces analyzed with director commentary and alternate ending retrospectives.',
      'How Hollywood’s greatest stunt coordinators and miniature artists crafted impossible illusions.'
    ]
  },
  Music: {
    titles: [
      'Lo-Fi Study & Chill Beats 24/7',
      'Acoustic Sunset Sessions Live',
      'Electronic Underground: Club Berlin',
      'Jazz Lounge: Midnight Standards',
      'Vinyl Revival: Rock Legends',
      'Global Ambient Chillout Experience'
    ],
    descriptions: [
      'Mellow beats, soothing hip-hop instrumentals, and smooth jazz chords to relax, work, or study to.',
      'Intimate acoustic guitar and vocal performances recorded live against golden hour ocean horizons.',
      'Non-stop progressive techno, melodic house, and synthwave sets from underground European soundstages.',
      'Timeless modal jazz, upright bass solos, and vintage saxophone grooves recorded in historic clubs.',
      'Mastered straight from analog tape: iconic guitar riffs, studio master recordings, and rock retrospectives.',
      'Immersive soundscapes, ethereal drones, and binaural nature audio designed for mindful listening.'
    ]
  },
  Documentary: {
    titles: [
      'Planet Earth: Deep Oceanic Trenches',
      'Ancient Engineering: Lost Citadels',
      'The Cyber Frontier: AI & Neural Nets',
      'Wild Serengeti: The Great Migration',
      'Culinary Odyssey: Street Food of Kyoto'
    ],
    descriptions: [
      'Bioluminescent predators and hydrothermal vents discovered in the Mariana Trench at 11,000 meters.',
      'Archaeological LiDAR scans reveal monumental stone architecture concealed beneath tropical jungle canopies.',
      'The architects of modern deep learning discuss artificial intelligence, autonomous systems, and humanity’s future.',
      'Two million wildebeest braving crocodile-infested rivers across Tanzania’s vast savannah.',
      'Centuries of culinary perfection: charcoal yakitori, handmade buckwheat soba, and matcha ceremony secrets.'
    ]
  }
};

/**
 * Generates dynamic 24-hour EPG programs for a channel centered around the current time
 */
export function generateProgramsForChannel(channelId: string, category: string = 'News'): EPGProgram[] {
  const templates = SHOW_TEMPLATES[category] || SHOW_TEMPLATES['News'];
  const programs: EPGProgram[] = [];
  
  const now = new Date();
  // Start from 4 hours ago, generate until 20 hours ahead
  const startWindow = new Date(now.getTime() - 4 * 60 * 60 * 1000);
  
  // Align start to top or bottom of the hour
  const startMinutes = startWindow.getMinutes() < 30 ? 0 : 30;
  startWindow.setMinutes(startMinutes, 0, 0);

  let currentStartTime = new Date(startWindow);

  // Generate 16 consecutive program blocks (30-60 mins each)
  for (let i = 0; i < 16; i++) {
    // 30, 45, or 60 minute duration
    const durationMinutes = [30, 60, 45, 60][(i + channelId.charCodeAt(0)) % 4];
    const endTime = new Date(currentStartTime.getTime() + durationMinutes * 60 * 1000);

    const titleIndex = (i + channelId.charCodeAt(channelId.length - 1)) % templates.titles.length;
    const descIndex = (i + channelId.charCodeAt(0)) % templates.descriptions.length;

    const title = templates.titles[titleIndex];
    const desc = templates.descriptions[descIndex];

    programs.push({
      id: `${channelId}-epg-${i}`,
      channelId,
      title,
      description: desc,
      startTime: currentStartTime.toISOString(),
      endTime: endTime.toISOString(),
      category,
      rating: ['TV-G', 'TV-PG', 'TV-14', 'TV-MA'][(i + 1) % 4],
      episode: i % 2 === 0 ? `S${1 + (i % 4)} E${1 + (i % 12)}` : undefined,
      thumbnail: `https://images.unsplash.com/photo-1594909122845-11baa439b7bf?w=400&auto=format&fit=crop&q=80`
    });

    currentStartTime = endTime;
  }

  return programs;
}

/**
 * Finds the currently running program for a channel
 */
export function getCurrentProgram(programs: EPGProgram[]): EPGProgram | null {
  const now = new Date().getTime();
  const found = programs.find(p => {
    const start = new Date(p.startTime).getTime();
    const end = new Date(p.endTime).getTime();
    return now >= start && now < end;
  });
  return found || programs[0] || null;
}

/**
 * Finds the upcoming program after the current one
 */
export function getNextProgram(programs: EPGProgram[]): EPGProgram | null {
  const current = getCurrentProgram(programs);
  if (!current) return programs[1] || null;
  const idx = programs.findIndex(p => p.id === current.id);
  return idx >= 0 && idx < programs.length - 1 ? programs[idx + 1] : null;
}

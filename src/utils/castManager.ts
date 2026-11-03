import { CastDevice, Channel } from '../types/iptv';

export const SMART_TV_DEVICES: CastDevice[] = [
  {
    id: 'tv-apple-living',
    name: 'Apple TV 4K (Living Room)',
    type: 'apple_tv',
    model: 'Apple TV 4K A2843 (tvOS 18)',
    status: 'available',
    location: 'Living Room',
    ip: '192.168.1.114'
  },
  {
    id: 'tv-lg-oled',
    name: 'LG OLED C3 65"',
    type: 'lg_webos',
    model: 'LG OLED65C3PUA (webOS 24)',
    status: 'available',
    location: 'Master Bedroom',
    ip: '192.168.1.142'
  },
  {
    id: 'tv-samsung-qled',
    name: 'Samsung Neo QLED 75"',
    type: 'samsung_tizen',
    model: 'QN75QN90C (Tizen 8.0)',
    status: 'available',
    location: 'Media Lounge',
    ip: '192.168.1.168'
  },
  {
    id: 'tv-chromecast-ultra',
    name: 'Chromecast with Google TV',
    type: 'chromecast',
    model: 'Google TV 4K HDR',
    status: 'available',
    location: 'Guest Suite',
    ip: '192.168.1.189'
  },
  {
    id: 'tv-sony-bravia',
    name: 'Sony BRAVIA XR OLED',
    type: 'sony_bravia',
    model: 'XR-65A80L Google TV',
    status: 'available',
    location: 'Home Cinema',
    ip: '192.168.1.205'
  },
  {
    id: 'tv-roku-streaming',
    name: 'Roku Streaming Stick 4K',
    type: 'roku',
    model: 'Roku 3820R (Roku OS 13)',
    status: 'available',
    location: 'Kitchen Island',
    ip: '192.168.1.221'
  }
];

// Broadcast channel for multi-screen sync (iPhone controller <-> Smart TV receiver window)
let broadcastChannel: BroadcastChannel | null = null;
try {
  if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
    broadcastChannel = new BroadcastChannel('iptv_remote_sync');
  }
} catch (e) {
  console.warn('BroadcastChannel not available', e);
}

export function sendCastMessage(type: string, payload: any) {
  const message = { type, payload, timestamp: Date.now() };
  if (broadcastChannel) {
    broadcastChannel.postMessage(message);
  }
  try {
    localStorage.setItem('iptv_cast_event', JSON.stringify(message));
  } catch (e) {
    // Ignore storage errors
  }
}

/**
 * Triggers native Apple AirPlay playback target picker on iOS Safari
 */
export function triggerNativeAirPlay(videoElement: HTMLVideoElement | null): boolean {
  if (!videoElement) return false;
  
  // WebKit AirPlay API check
  const anyVideo = videoElement as any;
  if (typeof anyVideo.webkitShowPlaybackTargetPicker === 'function') {
    try {
      anyVideo.webkitShowPlaybackTargetPicker();
      return true;
    } catch (e) {
      console.warn('AirPlay target picker invocation failed', e);
    }
  }
  return false;
}

/**
 * Checks if AirPlay is supported on the current device / browser
 */
export function isAirPlaySupported(): boolean {
  if (typeof window === 'undefined') return false;
  return 'WebKitPlaybackTargetAvailabilityEvent' in window;
}

/**
 * Checks if Google Cast framework is available
 */
export function isGoogleCastAvailable(): boolean {
  if (typeof window === 'undefined') return false;
  const anyWin = window as any;
  return !!(anyWin.cast && anyWin.cast.framework);
}

/**
 * Request Google Cast session
 */
export function requestGoogleCastSession(channel: Channel | null): Promise<boolean> {
  return new Promise((resolve) => {
    const anyWin = window as any;
    if (anyWin.cast && anyWin.cast.framework) {
      try {
        const castContext = anyWin.cast.framework.CastContext.getInstance();
        castContext.requestSession().then(
          () => {
            if (channel) {
              sendCastMessage('CHANNEL_CHANGE', channel);
            }
            resolve(true);
          },
          (errorCode: any) => {
            console.log('Cast session cancelled or failed', errorCode);
            resolve(false);
          }
        );
      } catch (err) {
        console.warn('Cast framework error', err);
        resolve(false);
      }
    } else {
      resolve(false);
    }
  });
}

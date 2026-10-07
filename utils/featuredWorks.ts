import { GroupedSong } from './dataProcessor';

// Original MVs linked from https://rkmusic.jp/release/610/.
export const featuredWorks: GroupedSong[] = [
  { songName: 'デマデーモン', artist: 'CULUA', versions: [{ date: '2025/05/17', streamUrl: 'https://youtu.be/IdiznKoZBnQ', streamTitle: 'デマデーモン — Official MV', timestamp: '0:00', timestampSeconds: 0, songLink: 'https://rkmusic.jp/release/610/' }] },
  { songName: 'スペクトロライト', artist: 'CULUA', versions: [{ date: '2025/05/03', streamUrl: 'https://youtu.be/AqTecLnlcOA', streamTitle: 'スペクトロライト — Official MV', timestamp: '0:00', timestampSeconds: 0, songLink: 'https://rkmusic.jp/release/610/' }] },
  { songName: 'ハレバレ', artist: 'CULUA', versions: [{ date: '2025/05/17', streamUrl: 'https://youtu.be/tXPQo3HHAi4', streamTitle: 'ハレバレ — Official MV', timestamp: '0:00', timestampSeconds: 0, songLink: 'https://rkmusic.jp/release/610/' }] },
  { songName: 'ベビ・デビ', artist: 'CULUA', versions: [{ date: '2024/05/18', streamUrl: 'https://youtu.be/Hx1KAdapT1M', streamTitle: 'ベビ・デビ — Official MV', timestamp: '0:00', timestampSeconds: 0, songLink: 'https://rkmusic.jp/release/610/' }] },
];

export function videoId(url: string): string {
  try {
    const parsed = new URL(url);
    if (parsed.hostname === 'youtu.be') return parsed.pathname.slice(1).split('/')[0];
    if (['youtube.com', 'www.youtube.com', 'm.youtube.com', 'www.youtube-nocookie.com'].includes(parsed.hostname)) {
      return parsed.searchParams.get('v') || parsed.pathname.match(/\/(?:embed|shorts|live)\/([^/]+)/)?.[1] || '';
    }
  } catch { /* An invalid URL has no playable video. */ }
  return '';
}

import { videoId } from '@/utils/featuredWorks';
import type { GroupedSong, SongVersion } from '@/utils/dataProcessor';

export const moods = ['neutral', 'calm', 'ballad', 'bright', 'energy', 'mystery'] as const;
export type Mood = typeof moods[number];
export const themes = ['stars', 'rain', 'forest', 'neon', 'halloween'] as const;
export type Theme = typeof themes[number];
export type StageMode = 'mood' | 'text' | 'image';
export const appearances = ['generic', 'meda', 'culua', 'neun'] as const;
export type Appearance = typeof appearances[number];
export interface Performer { id: string; name: string; source: string; color: string; avatar: string | null; appearance: Appearance; }
export interface LiveTrack {
  id: string; title: string; artist: string; performerId: string; guests: string[];
  videoUrl: string; start: number; end: number | null; mood: Mood;
}
export interface StageSettings {
  mode: StageMode; theme: Theme; prompt: string; color: string; accent: string;
  intensity: number; seed: number; reference: string | null;
}
export interface LiveHouseProject {
  version: 2; title: string; performers: Performer[]; tracks: LiveTrack[]; stage: StageSettings;
}
export type ReadyLiveTrack = LiveTrack & { end: number };
export type ReadyLiveProject = Omit<LiveHouseProject, 'tracks'> & { tracks: ReadyLiveTrack[] };
export type LiveCheck = { ok: true; project: ReadyLiveProject } | { ok: false; ids: string[] };
export interface LiveSession { project: ReadyLiveProject; index: number; finished: boolean; }
export const MAX_IMPORT_BYTES = 10 * 1024 * 1024;
export const moodColors: Record<Mood, [string, string]> = {
  neutral: ['#a78bfa', '#67e8f9'], calm: ['#67e8f9', '#93c5fd'], ballad: ['#f9a8d4', '#c4b5fd'],
  bright: ['#fde047', '#fb923c'], energy: ['#fb7185', '#c084fc'], mystery: ['#818cf8', '#c084fc'],
};
export const themeColors: Record<Theme, [string, string]> = {
  stars: ['#a78bfa', '#67e8f9'], rain: ['#60a5fa', '#a5b4fc'],
  forest: ['#6ee7b7', '#fde68a'], neon: ['#e879f9', '#22d3ee'], halloween: ['#b875ff', '#ff962f'],
};
export function emptyProject(): LiveHouseProject {
  return { version: 2, title: '', performers: [], tracks: [], stage: {
    mode: 'mood', theme: 'stars', prompt: '', color: '#a78bfa', accent: '#67e8f9', intensity: 1, seed: 1, reference: null,
  } };
}
export function parseTime(value: string): number | null {
  if (!/^\d+(?::[0-5]\d){0,2}$/.test(value.trim())) return null;
  return value.trim().split(':').reduce((total, part) => total * 60 + Number(part), 0);
}
export function formatTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  return `${minutes}:${String(seconds % 60).padStart(2, '0')}`;
}
export function youtubeUrl(value: string): string | null {
  const id = videoId(value);
  return /^[A-Za-z0-9_-]{11}$/.test(id) ? `https://www.youtube.com/watch?v=${id}` : null;
}
export function archiveTrack(song: GroupedSong, version: SongVersion, performerId: string, id: string): LiveTrack {
  const url = youtubeUrl(version.streamUrl);
  if (!url) throw new Error('video');
  return { id, title: song.songName, artist: version.artist || song.artist, performerId, guests: [],
    videoUrl: url, start: version.timestampSeconds, end: null, mood: 'neutral' };
}
export function trackSong(track: LiveTrack): GroupedSong {
  return { songName: track.title, artist: track.artist, versions: [{ date: '', streamTitle: track.title,
    streamUrl: track.videoUrl, timestamp: formatTime(track.start), timestampSeconds: track.start,
    songLink: `${track.videoUrl}&t=${track.start}s` }] };
}
export function moveTrack(tracks: LiveTrack[], index: number, direction: -1 | 1): LiveTrack[] {
  const destination = index + direction;
  if (destination < 0 || destination >= tracks.length) return tracks;
  const result = [...tracks];
  [result[index], result[destination]] = [result[destination], result[index]];
  return result;
}
export function matchTheme(text: string): Theme | null {
  if (/萬聖|万圣|ハロウィン|halloween/i.test(text)) return 'halloween';
  if (/星|宇宙|star|space|galaxy/i.test(text)) return 'stars';
  if (/雨|rain/i.test(text)) return 'rain';
  if (/森|forest|wood/i.test(text)) return 'forest';
  if (/霓虹|ネオン|neon|熱血|熱い|energy/i.test(text)) return 'neon';
  return null;
}
// Stable positions: regenerating changes the seed, rerendering does not.
export function stagePoints(seed: number): { x: number; y: number; size: number }[] {
  let state = seed >>> 0;
  const random = () => { state = (Math.imul(state, 1664525) + 1013904223) >>> 0; return state / 4294967296; };
  return Array.from({ length: 32 }, () => ({ x: random() * 100, y: random() * 75, size: 1 + random() * 2 }));
}
export function paletteFromPixels(pixels: ArrayLike<number>): [string, string] {
  const buckets = new Map<string, number>();
  for (let i = 0; i < pixels.length; i += 4) {
    if (pixels[i + 3] < 128) continue;
    const channels = [pixels[i], pixels[i + 1], pixels[i + 2]].map(v => Math.min(255, Math.round(v / 32) * 32));
    if (Math.max(...channels) < 48) continue;
    const hex = '#' + channels.map(v => v.toString(16).padStart(2, '0')).join('');
    buckets.set(hex, (buckets.get(hex) || 0) + 1);
  }
  const sorted = [...buckets].sort((a, b) => b[1] - a[1]);
  return [sorted[0]?.[0] || '#a78bfa', sorted[1]?.[0] || '#67e8f9'];
}
export function safeSource(value: string): boolean {
  if (!value) return true;
  try { const url = new URL(value); return url.protocol === 'https:' && !url.username && !url.password; } catch { return false; }
}

// Parse both imported files and IndexedDB values at their boundary.
export function parseProject(value: unknown): LiveHouseProject {
  function object(v: unknown): Record<string, unknown> {
    if (!v || typeof v !== 'object' || Array.isArray(v)) throw new Error('format');
    return Object.fromEntries(Object.entries(v));
  }
  function text(v: unknown, max = 300): string {
    if (typeof v !== 'string' || v.length > max) throw new Error('format');
    return v;
  }
  function number(v: unknown, min: number, max: number): number {
    if (typeof v !== 'number' || !Number.isFinite(v) || v < min || v > max) throw new Error('format');
    return v;
  }
  function image(v: unknown): string | null {
    if (v === null) return null;
    const s = text(v, 1500000);
    if (!/^data:image\/(?:png|jpeg);base64,[A-Za-z0-9+/]+={0,2}$/.test(s)) throw new Error('image');
    return s;
  }
  const p = object(value), stage = object(p.stage);
  if (p.version !== 1 && p.version !== 2 || !Array.isArray(p.performers) || !Array.isArray(p.tracks) || p.performers.length > 12 || p.tracks.length > 200) throw new Error('format');
  const performers = p.performers.map(v => {
    const a = object(v), source = text(a.source, 2000), color = text(a.color);
    if (!safeSource(source) || !/^#[\da-f]{6}$/i.test(color)) throw new Error('format');
    const name = text(a.name, 100), id = text(a.id, 100);
    if (!name.trim() || !id) throw new Error('format');
    const appearance = p.version === 1 ? 'generic' : appearances.find(kind => kind === a.appearance);
    if (!appearance) throw new Error('format');
    return { id, name, source, color, avatar: image(a.avatar), appearance };
  });
  const ids = new Set(performers.map(a => a.id));
  if (ids.size !== performers.length) throw new Error('format');
  const tracks = p.tracks.map(v => {
    const t = object(v), start = number(t.start, 0, 604800), end = t.end === null ? null : number(t.end, 0, 604800);
    const url = youtubeUrl(text(t.videoUrl, 2000)), performerId = text(t.performerId, 100);
    const mood = moods.find(m => m === t.mood);
    if (!url || !ids.has(performerId) || !mood || end !== null && end <= start || !Array.isArray(t.guests)) throw new Error('format');
    const guests = t.guests.map(g => text(g, 100));
    if (guests.length > 11 || new Set(guests).size !== guests.length || guests.some(g => !ids.has(g) || g === performerId)) throw new Error('format');
    const title = text(t.title), id = text(t.id, 100);
    if (!title.trim() || !id || !Number.isInteger(start) || end !== null && !Number.isInteger(end)) throw new Error('format');
    return { id, title, artist: text(t.artist), performerId, guests, videoUrl: url, start, end, mood };
  });
  if (new Set(tracks.map(t => t.id)).size !== tracks.length) throw new Error('format');
  const mode = ['mood', 'text', 'image'].find(m => m === stage.mode);
  const theme = themes.find(t => t === stage.theme);
  if (mode !== 'mood' && mode !== 'text' && mode !== 'image' || !theme) throw new Error('format');
  const color = text(stage.color), accent = text(stage.accent);
  if (!/^#[\da-f]{6}$/i.test(color) || !/^#[\da-f]{6}$/i.test(accent)) throw new Error('format');
  const seed = number(stage.seed, 0, 4294967295);
  if (!Number.isInteger(seed)) throw new Error('format');
  return { version: 2, title: text(p.title, 100), performers, tracks, stage: {
    mode, theme, prompt: text(stage.prompt), color, accent, intensity: number(stage.intensity, 0, 2), seed, reference: image(stage.reference),
  } };
}
export function checkLive(project: LiveHouseProject): LiveCheck {
  let parsed: LiveHouseProject;
  try { parsed = parseProject(project); } catch { return { ok: false, ids: project.tracks.map(t => t.id) }; }
  const missing = parsed.tracks.filter(t => t.end === null);
  if (!parsed.tracks.length || missing.length) return { ok: false, ids: missing.map(t => t.id) };
  const tracks = parsed.tracks.flatMap(t => t.end === null ? [] : [{ ...t, end: t.end }]);
  return { ok: true, project: { ...parsed, tracks } };
}
export function exportProject(project: LiveHouseProject): string {
  const json = JSON.stringify(parseProject(project));
  if (new TextEncoder().encode(json).length > MAX_IMPORT_BYTES) throw new Error('size');
  return json;
}

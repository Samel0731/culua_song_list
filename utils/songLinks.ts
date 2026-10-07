import type { SongVersion } from './dataProcessor';
import { videoId } from './featuredWorks';
export function songNameFromParam(value: string) {
  try { return decodeURIComponent(value).trim(); } catch { return value.trim(); }
}
export function songPath(title: string, version?: SongVersion) {
  const path = `/songs/${encodeURIComponent(title)}`;
  return version ? `${path}?video=${encodeURIComponent(videoId(version.streamUrl))}&t=${version.timestampSeconds}` : path;
}

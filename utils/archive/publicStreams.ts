import type { GroupedSong, SongVersion } from '@/utils/dataProcessor';

export type PublicPerformance = { id: string; position: number; name: string; artist: string; version: SongVersion };
export type PublicStream = { videoId: string; title: string; date: string; count: number; songs: PublicPerformance[] };
export type PublicArchive = { streams: PublicStream[]; songs: GroupedSong[]; stale: boolean; checkedAt: string | null };
export type PublicArchiveIndex = Omit<PublicArchive, 'streams'> & { streams: Omit<PublicStream, 'songs'>[] };

// Explicit projection: never serialize database rows or private operational fields.
export function projectStreams(streams: { video_id: string; title: string; stream_date: string }[], performances: { id: string; video_id: string; position: number; song_id: string; timestamp_seconds: number; song_link: string; published: boolean }[], songs: { id: string; name: string; artist: string }[]): PublicStream[] {
  const bySong = new Map(songs.map(s => [s.id, s]));
  const byStream = new Map<string, typeof performances>();
  for (const p of performances) if (p.published) {
    const rows = byStream.get(p.video_id) || [];
    rows.push(p); byStream.set(p.video_id, rows);
  }
  return streams.map(s => {
    const published = (byStream.get(s.video_id) || []).sort((a, b) => a.position - b.position || a.id.localeCompare(b.id)).flatMap(p => {
      const song = bySong.get(p.song_id);
      if (!song) return [];
      return [{ id: p.id, position: p.position, name: song.name, artist: song.artist, version: { artist: song.artist, date: s.stream_date, streamUrl: `https://www.youtube.com/watch?v=${s.video_id}`, streamTitle: s.title, timestamp: `${Math.floor(p.timestamp_seconds / 60)}:${String(p.timestamp_seconds % 60).padStart(2, '0')}`, timestampSeconds: p.timestamp_seconds, songLink: p.song_link } }];
    });
    return { videoId: s.video_id, title: s.title, date: s.stream_date, count: published.length, songs: published };
  }).sort((a, b) => b.date.localeCompare(a.date) || a.videoId.localeCompare(b.videoId));
}

export function streamsFromSongs(songs: GroupedSong[]): PublicStream[] {
  const streams = new Map<string, PublicStream>();
  for (const song of songs) for (const v of song.versions) {
    let id: string | null = null;
    try { const u = new URL(v.streamUrl); id = u.searchParams.get('v') || u.pathname.split('/').at(-1) || null; } catch { continue; }
    if (!id) continue;
    const s = streams.get(id) || { videoId: id, title: v.streamTitle, date: v.date, count: 0, songs: [] };
    s.songs.push({ id: `${id}:${s.count++}`, position: 0, name: song.songName, artist: v.artist || song.artist, version: v });
    streams.set(id, s);
  }
  return [...streams.values()].map(s => ({ ...s, songs: s.songs.sort((a, b) => a.version.timestampSeconds - b.version.timestampSeconds).map((p, i) => ({ ...p, position: i + 1 })) })).sort((a, b) => b.date.localeCompare(a.date) || a.videoId.localeCompare(b.videoId));
}

import 'server-only';
import { unstable_cache } from 'next/cache';
import { serviceClient } from './supabaseServer';
import { readAll } from './readAll';
import { projectStreams, streamsFromSongs, type PublicArchive } from './publicStreams';
import { fetchArchiveSnapshot } from '@/utils/fetchSongsServer';
import type { Stream, Performance, Song } from './types';

const readRows = unstable_cache(async () => {
  const db = serviceClient();
  const [streams, performances, songs] = await Promise.all([
    readAll<Pick<Stream, 'video_id' | 'title' | 'stream_date'>>((a, b) => db.from('archive_streams').select('video_id,title,stream_date').order('video_id').range(a, b)),
    readAll<Omit<Performance, 'version'>>((a, b) => db.from('archive_performances').select('id,video_id,position,song_id,timestamp_seconds,song_link,published').eq('published', true).order('id').range(a, b)),
    readAll<Pick<Song, 'id' | 'name' | 'artist'>>((a, b) => db.from('archive_songs').select('id,name,artist').order('id').range(a, b)),
  ]);
  return { streams, performances, songs, checkedAt: new Date().toISOString() };
}, ['public-stream-source-rows-v2'], { revalidate: 300, tags: ['song-archive'] });

async function read(): Promise<PublicArchive> {
  if (process.env.ARCHIVE_DATA_SOURCE !== 'supabase') {
    const snapshot = await fetchArchiveSnapshot();
    return { streams: streamsFromSongs(snapshot.songs), songs: snapshot.songs, stale: true, checkedAt: null };
  }
  const { streams, performances, songs, checkedAt } = await readRows();
  const result = projectStreams(streams, performances, songs);
  const grouped = new Map<string, import('@/utils/dataProcessor').GroupedSong>();
  for (const stream of result) for (const p of stream.songs) {
    const song = grouped.get(p.name) || { songName: p.name, artist: p.artist, versions: [] };
    if (!song.artist.split(' / ').includes(p.artist)) song.artist += ` / ${p.artist}`;
    song.versions.push(p.version); grouped.set(p.name, song);
  }
  return { streams: result, songs: [...grouped.values()], stale: false, checkedAt };
}

export async function readPublicArchive(): Promise<PublicArchive> {
  try { return await read(); }
  catch {
    const snapshot = await fetchArchiveSnapshot();
    return { streams: streamsFromSongs(snapshot.songs), songs: snapshot.songs, stale: true, checkedAt: null };
  }
}

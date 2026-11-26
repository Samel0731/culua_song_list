import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/utils/seo';
import { fetchSongsServer } from '@/utils/fetchSongsServer';
import { songPath } from '@/utils/songLinks';
export const revalidate = 1800;
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const main: MetadataRoute.Sitemap = ['/', '/songs', '/discography', '/news', '/timeline', '/fanart', '/about'].map(path => ({ url: SITE_URL + (path === '/' ? '' : path), changeFrequency: path === '/about' ? 'monthly' : 'daily', priority: path === '/' ? 1 : path === '/songs' ? .9 : .8 }));
  const songs = await fetchSongsServer();
  return [...main, ...songs.map(song => ({ url: SITE_URL + songPath(song.songName), changeFrequency: 'weekly' as const, priority: .6 }))];
}

import { notFound, redirect } from 'next/navigation';
import { fetchSongsServer, resolveSongName } from '@/utils/fetchSongsServer';
import { pageMetadata, SITE_URL, jsonLd } from '@/utils/seo';
import { songPath, songNameFromParam } from '@/utils/songLinks';
import { videoId } from '@/utils/featuredWorks';
import SongDetail from '@/app/components/SongDetail';
type Props = { params: Promise<{ name: string }>; searchParams: Promise<{ video?: string; t?: string }> };
export async function generateMetadata({ params }: Props) {
  const name = await resolveSongName(songNameFromParam((await params).name));
  const song = (await fetchSongsServer()).find(s => s.songName.trim() === name);
  return pageMetadata(`${name}｜CULUA 歌回・翻唱紀錄`, song ? `CULUA 演唱 ${name}（原唱：${song.artist}）的 ${song.versions.length} 筆歌回紀錄。查看演唱日期與 YouTube 時間戳，直接播放並分享。` : `CULUA 的 ${name} 歌回紀錄與演唱時間戳。`, songPath(name));
}
export default async function Page({ params, searchParams }: Props) {
  const [route, query, songs] = await Promise.all([params, searchParams, fetchSongsServer()]);
  const name = songNameFromParam(route.name);
  const canonical = await resolveSongName(name);
  if (canonical !== name) {
    const search = new URLSearchParams();
    if(query.video)search.set('video',query.video);
    if(query.t)search.set('t',query.t);
    redirect(songPath(canonical)+(search.size?`?${search}`:''));
  }
  const song = songs.find(s => s.songName.trim() === name);
  if (!song) { if (!songs.length) throw new Error('Song archive is temporarily unavailable'); notFound(); }
  const selected = Math.max(0, song.versions.findIndex(v => videoId(v.streamUrl) === query.video && v.timestampSeconds === Number(query.t)));
  const structured = { '@context': 'https://schema.org', '@type': 'WebPage', name: `${song.songName} — CULUA performance archive`, url: SITE_URL + songPath(name), mainEntity: { '@type': 'ItemList', itemListElement: song.versions.map((v, i) => ({ '@type': 'ListItem', position: i + 1, name: `${v.streamTitle} · ${v.timestamp}`, url: v.streamUrl })) } };
  return <><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(structured) }}/><SongDetail song={song} selected={selected}/></>;
}

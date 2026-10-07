import ArchiveTabs from '@/app/components/archive/ArchiveTabs';
import Link from 'next/link';
import { fetchSongsServer } from '@/utils/fetchSongsServer';
import { songPath } from '@/utils/songLinks';
export default async function Page({ searchParams }: { searchParams: Promise<{ tab?: string; q?: string }> }) {
  const { tab, q } = await searchParams;
  const songs = await fetchSongsServer();
  return <><ArchiveTabs tab={tab === 'artists' || tab === 'stats' ? tab : 'songs'} query={q || ''}/><details className="song-directory"><summary>歌曲索引 / 歌枠セトリ / Song index ({songs.length})</summary><div>{songs.map(s => <Link key={s.songName} href={songPath(s.songName)}>{s.songName}<small>{s.artist}</small></Link>)}</div></details></>;
}

// app/page.tsx
import { fetchSongsServer } from '@/utils/fetchSongsServer'; // ✅ 修正這裡的名稱
import HomeContent from './components/HomeContent';

export default async function Page() {
  // 1. 在伺服器端抓取所有歌曲資料
  const groupedSongs = await fetchSongsServer();

  // 2. 將 GroupedSong[] 攤平成圖表需要的格式 { date, artist }
  // 因為圖表需要計算「每次」唱的次數，所以要把 versions 拆解開來
  const flatSongsForChart = groupedSongs.flatMap(song => 
    song.versions.map(version => ({
      date: version.date,
      artist: song.artist
    }))
  );

  return (
    <div className="h-full w-full overflow-y-auto custom-scrollbar bg-slate-900 text-slate-100">
      <HomeContent />
    </div>
  );
}
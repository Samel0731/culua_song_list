// utils/fetchSongsServer.ts
import Papa from 'papaparse';
import { GroupedSong, SongVersion, CsvRow } from '@/utils/dataProcessor';

// 您的 Google Sheet CSV 連結
const SHEET_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTQdBtem90otSSCpAHO7Al5fz2F0dx-ReDDpgbEfuioiOlkbT5uyfdWbDqPNZvG6YXI0PSab_ge6nE1/pub?gid=0&single=true&output=csv';

const timeToSeconds = (timeStr: string): number => {
  if (!timeStr) return 0;
  const str = String(timeStr).trim();
  const parts = str.split(':').map(part => parseFloat(part));
  
  let seconds = 0;
  if (parts.length === 3) {
    seconds = parts[0] * 3600 + parts[1] * 60 + parts[2];
  } else if (parts.length === 2) {
    seconds = parts[0] * 60 + parts[1];
  } else {
    seconds = parseFloat(str) || 0;
  }
  return Math.floor(seconds);
};

export async function fetchSongsServer(): Promise<GroupedSong[]> {
  try {
    console.log('Server fetching songs from Google Sheet...');
    
    // ✨ 修改重點：將快取時間從 3600 (1小時) 改為 1800 (30分鐘)
    const res = await fetch(SHEET_URL, { 
      next: { revalidate: 1800 } 
    });
    
    if (!res.ok) throw new Error(`Failed to fetch CSV: ${res.statusText}`);
    
    const csvText = await res.text();

    const lines = csvText.split('\n');
    const headerIndex = lines.findIndex(line => line.includes('日付'));
    
    if (headerIndex === -1) {
      console.warn('Server fetch: Cannot find header row "日付"');
      return [];
    }

    const cleanCsv = lines.slice(headerIndex).join('\n');

    const parseResult = Papa.parse<CsvRow>(cleanCsv, {
      header: true,
      skipEmptyLines: true,
    });

    const rows = parseResult.data;
    const songMap = new Map<string, GroupedSong>();

    rows.forEach((row) => {
      if (!row.曲名 || !row.日付) return;
      const songName = row.曲名.trim();
      
      const version: SongVersion = {
        date: row.日付,
        streamUrl: row.配信URL,
        streamTitle: row.配信タイトル,
        timestamp: row.タイムスタンプ,
        timestampSeconds: timeToSeconds(row.タイムスタンプ),
        songLink: row.曲リンク || row.曲URL || "" 
      };

      if (songMap.has(songName)) {
        songMap.get(songName)?.versions.push(version);
      } else {
        songMap.set(songName, {
          songName: row.曲名,
          artist: row.アーティスト,
          versions: [version],
        });
      }
    });

    const allSongs = Array.from(songMap.values()).map(song => {
      song.versions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      return song;
    });

    console.log(`Server fetch success: ${allSongs.length} songs loaded.`);
    return allSongs;

  } catch (error) {
    console.error('Server fetch error:', error);
    return [];
  }
}
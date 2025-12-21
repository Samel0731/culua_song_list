// utils/fetchSongsServer.ts
import Papa from 'papaparse';
// 引入原本定義好的型別，確保資料結構一致
import { GroupedSong, SongVersion, CsvRow } from '@/utils/dataProcessor';

// 您的 Google Sheet CSV 連結
const SHEET_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTQdBtem90otSSCpAHO7Al5fz2F0dx-ReDDpgbEfuioiOlkbT5uyfdWbDqPNZvG6YXI0PSab_ge6nE1/pub?gid=0&single=true&output=csv';

// 輔助函式：時間轉秒數 (從 dataProcessor 搬過來，因為原本沒 export)
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

// ✨ 核心函式：Server 端抓取歌單
export async function fetchSongsServer(): Promise<GroupedSong[]> {
  try {
    console.log('Server fetching songs from Google Sheet...');
    
    // 1. Server 端 Fetch，設定 revalidate
    // 這代表：資料至少會快取 3600 秒 (1小時)。
    // 1小時內的請求會拿到同一份資料 (速度快)，1小時後有人訪問會自動觸發更新 (保持資料新)。
    const res = await fetch(SHEET_URL, { 
      next: { revalidate: 3600 } 
    });
    
    if (!res.ok) throw new Error(`Failed to fetch CSV: ${res.statusText}`);
    
    const csvText = await res.text();

    // 2. 處理 CSV 標題行 (邏輯同 dataProcessor)
    const lines = csvText.split('\n');
    // 尋找包含 "日付" 的那一行當作標題
    const headerIndex = lines.findIndex(line => line.includes('日付'));
    
    if (headerIndex === -1) {
      console.warn('Server fetch: Cannot find header row "日付"');
      return [];
    }

    const cleanCsv = lines.slice(headerIndex).join('\n');

    // 3. 解析 CSV
    // 注意：PapaParse 在 Node.js 環境也是同步運作的，這裡可以直接用
    const parseResult = Papa.parse<CsvRow>(cleanCsv, {
      header: true,
      skipEmptyLines: true,
    });

    const rows = parseResult.data;
    const songMap = new Map<string, GroupedSong>();

    // 4. 資料轉換與分組 (邏輯同 fetchAndProcessSongs)
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

    // 轉回陣列並依照日期排序
    const allSongs = Array.from(songMap.values()).map(song => {
      song.versions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      return song;
    });

    console.log(`Server fetch success: ${allSongs.length} songs loaded.`);
    return allSongs;

  } catch (error) {
    console.error('Server fetch error:', error);
    // 發生錯誤時回傳空陣列，避免頁面壞掉
    return [];
  }
}
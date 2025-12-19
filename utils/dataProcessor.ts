// utils/dataProcessor.ts
import Papa from 'papaparse';

// --- 共用：更聰明的 CSV 抓取函式 ---
// 這個函式會自動跳過 CSV 前面的無關說明，直到找到包含 keyColumn 的那一行標題
const fetchCsvWithHeaderSearch = async <T>(csvUrl: string, keyColumn: string): Promise<T[]> => {
  try {
    const response = await fetch(csvUrl);
    const text = await response.text();
    
    // 將文字分行
    const lines = text.split('\n');
    
    // 尋找標題行在哪裡 (只要該行包含我們指定的關鍵欄位名稱，就當作是標題行)
    // 對於「アーティスト一覧」，因為第一欄標題可能是空的，我們改找 "曲数" 或 "備考"
    const headerIndex = lines.findIndex(line => line.includes(keyColumn));
    
    if (headerIndex === -1) {
      console.warn(`在 CSV 中找不到關鍵欄位: ${keyColumn}，將嘗試直接解析。`);
      return [];
    }

    // 只保留標題行以後的內容進行解析
    const cleanCsv = lines.slice(headerIndex).join('\n');

    return new Promise((resolve, reject) => {
      Papa.parse(cleanCsv, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => resolve(results.data as T[]),
        error: (err: any) => reject(err),
      });
    });
  } catch (error) {
    console.error("CSV Download Error:", error);
    return [];
  }
};

// ==========================================
// 1. 歌った曲一覧 (Song List)
// ==========================================
export interface CsvRow {
  日付: string;
  配信URL: string;
  配信タイトル: string;
  タイムスタンプ: string;
  曲名: string;
  アーティスト: string;
  曲URL: string;
  曲リンク: string;
}

export interface SongVersion {
  date: string;
  streamUrl: string;
  streamTitle: string;
  timestamp: string;
  timestampSeconds: number;
  songLink: string;
}

export interface GroupedSong {
  songName: string;
  artist: string;
  versions: SongVersion[];
}

// 強化版時間轉換
const timeToSeconds = (timeStr: string): number => {
  if (!timeStr) return 0;
  
  // 轉成字串並移除空白
  const str = String(timeStr).trim();
  
  // 如果是純數字 (例如 Excel 的序列值 0.5 這種)，通常 CSV 轉出來會是文字
  // 但我們假設它是 "H:M:S" 或 "M:S" 格式
  
  const parts = str.split(':').map(part => parseFloat(part));
  
  let seconds = 0;
  if (parts.length === 3) {
    // H:M:S
    seconds = parts[0] * 3600 + parts[1] * 60 + parts[2];
  } else if (parts.length === 2) {
    // M:S
    seconds = parts[0] * 60 + parts[1];
  } else {
    // 只有秒數 或 格式無法辨識
    seconds = parseFloat(str) || 0;
  }
  
  return Math.floor(seconds); // 取整數
};

export const fetchAndProcessSongs = async (csvUrl: string): Promise<GroupedSong[]> => {
  // 尋找包含 "日付" 的那一行當作標題
  const rows = await fetchCsvWithHeaderSearch<CsvRow>(csvUrl, '日付');
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

  return Array.from(songMap.values()).map(song => {
    song.versions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return song;
  });
};

// ==========================================
// 2. 曲名一覧 (Song Name Stats)
// ==========================================
export interface SongStatRow {
  曲名: string;
  アーティスト: string;
  回数: string;
  備考: string;
}

export interface SongStat {
  songName: string;
  artist: string;
  count: number;
  note: string;
}

export const fetchSongStats = async (csvUrl: string): Promise<SongStat[]> => {
  // 尋找包含 "回数" 的那一行當作標題
  const rows = await fetchCsvWithHeaderSearch<SongStatRow>(csvUrl, '回数');
  const stats: SongStat[] = [];

  rows.forEach((row) => {
    if (!row.曲名 || row.曲名.includes('合計')) return;
    stats.push({
      songName: row.曲名,
      artist: row.アーティスト,
      count: Number(row.回数) || 0,
      note: row.備考 || '',
    });
  });

  return stats.sort((a, b) => b.count - a.count);
};

// ==========================================
// 3. アーティスト一覧 (Artist Stats) - 新增功能
// ==========================================
// 注意：根據你的檔案，這張表的標題行可能是 ",,曲数,備考" (第一欄空白)
// PapaParse 如果遇到空白標題，通常會把它命名為類似 "" 或 "__parsed_extra"
export interface ArtistStatRow {
  ""?: string; // 可能的空標題
  アーティスト?: string; // 如果你有手動加標題
  曲数: string;
  備考: string;
}

export interface ArtistStat {
  artist: string;
  count: number;
  note: string;
}

export const fetchArtistStats = async (csvUrl: string): Promise<ArtistStat[]> => {
  // 尋找包含 "曲数" 的那一行當作標題
  const rows = await fetchCsvWithHeaderSearch<ArtistStatRow>(csvUrl, '曲数');
  const stats: ArtistStat[] = [];

  rows.forEach((row) => {
    // 試著抓取歌手名稱，可能是 "アーティスト" 欄位，也可能是空白欄位(CSV第一欄)
    // @ts-ignore: 忽略動態存取屬性的型別檢查
    const name = row['アーティスト'] || row[''] || row[Object.keys(row)[0]];

    if (!name || name.includes('合計') || name.includes('注意喚起')) return;

    stats.push({
      artist: name,
      count: Number(row.曲数) || 0,
      note: row.備考 || '',
    });
  });

  return stats.sort((a, b) => b.count - a.count);
};
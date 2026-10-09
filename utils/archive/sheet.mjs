import Papa from 'papaparse';
import { parseTimestamp, videoIdFromUrl, normalizeDate } from './ingestion.mjs';
export const SHEET_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTQdBtem90otSSCpAHO7Al5fz2F0dx-ReDDpgbEfuioiOlkbT5uyfdWbDqPNZvG6YXI0PSab_ge6nE1/pub?gid=0&single=true&output=csv';

export function parseSheet(csv) {
  const lines = csv.replace(/^\uFEFF/, '').split('\n');
  const header = lines.findIndex(line => line.includes('日付') && line.includes('曲名'));
  if (header < 0) throw new Error('CSV 缺少日付／曲名標題');
  const parsed = Papa.parse(lines.slice(header).join('\n'), { header: true, skipEmptyLines: true });
  if (parsed.errors.some(e => e.code !== 'TooFewFields')) throw new Error('CSV 欄位格式錯誤');
  const errors = [], unavailable = [], rows = [], seen = new Set(), positions = new Map();
  for (const [index, row] of parsed.data.entries()) {
    if (!row['曲名']?.trim() || !row['日付']?.trim()) continue;
    if (row['配信URL']?.trim()==='非公開') { unavailable.push({ ...row, reason: '非公開直播，影片與時間待補' }); continue; }
    const video_id = videoIdFromUrl(row['配信URL']?.trim() || '');
    const timestamp_seconds = parseTimestamp(row['タイムスタンプ'] || '');
    const date=normalizeDate(row['日付']);
    if (!video_id || timestamp_seconds === null || !row['アーティスト']?.trim() || !date) {
      errors.push(`第 ${header + index + 2} 行：影片、時間、日期或歌手不完整`); continue;
    }
    const item = { video_id, name: row['曲名'].trim(), artist: row['アーティスト'].trim(),
      timestamp_seconds, date, stream_title: row['配信タイトル']?.trim() || video_id,
      song_link: [row['曲リンク']?.trim(),row['曲URL']?.trim()].find(value=>value&&/^https:\/\/\S+$/.test(value)) || '' };
    const key = `${video_id}\0${item.name}\0${item.artist}\0${timestamp_seconds}`;
    if (seen.has(key)) continue;
    seen.add(key);
    rows.push(item);
  }
  rows.sort((a,b) => a.video_id.localeCompare(b.video_id) || a.timestamp_seconds-b.timestamp_seconds);
  const positioned = rows.map(row => { const position = (positions.get(row.video_id) || 0)+1; positions.set(row.video_id,position); return { ...row, position }; });
  return { rows: positioned, unavailable, errors, counts: { songs: new Set(rows.map(r => `${r.name}\0${r.artist}`)).size, performances: rows.length, streams: positions.size, unavailable: unavailable.length } };
}

export function groupSheetRows(rows) {
  const groups = new Map();
  for (const row of rows) {
    const key = row.name;
    if (!groups.has(key)) groups.set(key, { songName: row.name, artist: row.artist, versions: [], artists: new Set() });
    groups.get(key).artists.add(row.artist);
    groups.get(key).versions.push({ date: row.date, streamUrl: `https://www.youtube.com/watch?v=${row.video_id}`,
      streamTitle: row.stream_title, timestamp: `${Math.floor(row.timestamp_seconds/3600)}:${String(Math.floor(row.timestamp_seconds/60)%60).padStart(2,'0')}:${String(row.timestamp_seconds%60).padStart(2,'0')}`,
      timestampSeconds: row.timestamp_seconds, songLink: row.song_link, artist: row.artist });
  }
  return [...groups.values()].map(({artists,...s}) => ({ ...s, artist: [...artists].sort().join(' / '), versions: s.versions.sort((a,b) => b.date.localeCompare(a.date)) }));
}

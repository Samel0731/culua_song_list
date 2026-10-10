/** Pure parsing and consensus rules shared by the worker, migration and tests. */
export function videoIdFromUrl(value) {
  if (/^[\w-]{11}$/.test(value)) return value;
  try {
    const url = new URL(value);
    if (url.protocol !== 'https:') return null;
    const host = url.hostname.toLowerCase();
    const id = host === 'youtu.be' ? url.pathname.slice(1) : ['youtube.com', 'www.youtube.com', 'm.youtube.com'].includes(host)
      ? (url.searchParams.get('v') || url.pathname.match(/^\/(?:live|shorts)\/([\w-]{11})$/)?.[1]) : null;
    return id && /^[\w-]{11}$/.test(id) ? id : null;
  } catch { return null; }
}

export function parseTimestamp(value) {
  const text = String(value).normalize('NFKC').trim();
  if (!/^\d{1,3}:\d{2}(?::\d{2})?$/.test(text)) return null;
  const parts = text.split(':').map(Number);
  if (parts.at(-1) >= 60 || (parts.length === 3 && parts[1] >= 60)) return null;
  return parts.reduce((sum, part) => sum * 60 + part, 0);
}

export function parseSetlist(text) {
  const songs = [];
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.normalize('NFKC').trim();
    const match = line.match(/(?:^|\s|[【[(])(\d{1,3}:\d{2}(?::\d{2})?)(?=$|\s|[】)\]])/);
    if (!match) continue;
    const timestamp = parseTimestamp(match[1]);
    if (timestamp === null) continue;
    let body = line.replace(match[0], ' ').replace(/^[\s【】[\]()]+/, '').trim();
    body = body.replace(/^\d{1,2}(?:\s*[.)、:-]\s*|\s+)/, '').trim();
    if (/^(?:OP|ED|START|END|配信開始|配信終了|開始|終了|雑談|トーク|MC|待機|お知らせ|告知)(?:$|\s|[:：(（『「【])/i.test(body)) continue;
    const pieces = body.split(/\s*\/\s*/);
    const name = pieces.shift()?.trim();
    if (!name) continue;
    songs.push({ position: songs.length + 1, name, artist: pieces.join('/').trim(), timestamp_seconds: timestamp });
  }
  return songs;
}

export function normalizeName(value) { return String(value).normalize('NFKC').trim(); }
export function normalizeDate(value) {
  const match=String(value).normalize('NFKC').trim().match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/);
  if(!match)return null;
  const [year,month,day]=match.slice(1).map(Number),date=new Date(Date.UTC(year,month-1,day));
  if(date.getUTCFullYear()!==year||date.getUTCMonth()!==month-1||date.getUTCDate()!==day)return null;
  return `${year}-${String(month).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
}

/** Unknown spellings never become aliases automatically. Each position is independently reviewed. */
export function reconcileSetlists(comments, catalog, aliases, duration, scanComplete) {
  const lookup = new Map();
  for (const s of catalog) lookup.set(`${normalizeName(s.name)}\0${normalizeName(s.artist)}`, s.id);
  for (const a of aliases) lookup.set(`${normalizeName(a.name)}\0${normalizeName(a.artist)}`, a.song_id);
  const lists = comments.map(c => ({ ...c, songs: parseSetlist(c.text) })).filter(c => c.songs.length >= 2);
  if (!lists.length) return [];
  // One vote per author. Duplicate comments cannot manufacture consensus.
  const unique = [...new Map(lists.map(c => [c.author_id, c])).values()];
  const max = Math.max(...unique.map(c => c.songs.length));
  return Array.from({ length: max }, (_, index) => {
    const rows = unique.map(c => ({ author_id: c.author_id, comment_id: c.id, row: c.songs[index], length: c.songs.length })).filter(c => c.row);
    const votes = rows.map(c => ({ ...c, song_id: lookup.get(`${normalizeName(c.row.name)}\0${normalizeName(c.row.artist)}`) }));
    const first = votes[0];
    const reasons = [];
    if (!scanComplete) reasons.push('留言掃描尚未完成');
    if (unique.length < 2 || votes.length < 2) reasons.push('需要兩位不同作者');
    if (new Set(unique.map(c => c.songs.length)).size !== 1) reasons.push('曲目順序或數量不一致');
    if (votes.some(v => !v.song_id)) reasons.push('曲名或歌手尚未核准');
    if (new Set(votes.map(v => v.song_id)).size !== 1) reasons.push('曲目存在衝突');
    const times = votes.map(v => v.row.timestamp_seconds);
    if (Math.max(...times) - Math.min(...times) > 3) reasons.push('時間差超過三秒');
    if (!Number.isInteger(duration) || times.some(t => t >= duration)) reasons.push('時間超出影片或長度未知');
    const canonical = catalog.find(s => s.id === first.song_id);
    return { ...first.row, name: canonical?.name || first.row.name, artist: canonical?.artist || first.row.artist,
      timestamp_seconds: Math.min(...times), song_id: first.song_id || null, reasons,
      auto_publish: reasons.length === 0, evidence: votes.map(v => v.comment_id),
      votes: votes.map(v=>({comment_id:v.comment_id,name:v.row.name,artist:v.row.artist,timestamp_seconds:v.row.timestamp_seconds})) };
  });
}

export function validateImageUrl(value) {
  const url = new URL(value);
  if (url.protocol !== 'https:' || url.hostname !== 'pbs.twimg.com' || url.port || url.username || url.password) throw new Error('只接受 pbs.twimg.com 的 HTTPS 圖片直連');
  return url.toString();
}

export function validateXPost(value) {
  const url = new URL(value);
  if (url.protocol !== 'https:' || !['x.com', 'twitter.com'].includes(url.hostname) || url.port || url.username || url.password
    || !/^\/[\w]+\/status\/\d+(?:\/photo\/\d+)?$/.test(url.pathname)) throw new Error('請提供有效的 X 貼文網址');
  return `https://x.com${url.pathname.replace(/\/photo\/\d+$/, '')}`;
}

export function imageMime(bytes) {
  if (bytes.length >= 8 && [137,80,78,71,13,10,26,10].every((b,i) => bytes[i] === b)) return 'image/png';
  if (bytes.length >= 3 && bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255) return 'image/jpeg';
  throw new Error('圖片必須是 PNG 或 JPEG');
}

import * as cheerio from 'cheerio';
import Papa from 'papaparse';
import type { NewsItem, OfficialWork, TimelineItem, FanPost, WorkSelection, CohortArtist } from './contentTypes';

const clean = (s: string) => s.replace(/\s+/g, ' ').trim();
export function artistsFromText(text: string): CohortArtist[] {
  return (['CULUA', 'NEUN', 'MEDA'] as const).filter(artist => new RegExp(`\\b${artist}\\b|${{ CULUA: 'カルア', NEUN: 'ノイン', MEDA: 'メダ' }[artist]}`, 'i').test(text));
}
export function safeUrl(value: string, hosts: string[], base?: string): string | null {
  try { const u = new URL(value, base); return u.protocol === 'https:' && !u.username && !u.password && !u.port && hosts.includes(u.hostname) ? u.href : null; } catch { return null; }
}
export function dateFromText(text: string): string | null {
  const m = text.match(/(20\d{2})[年./-](\d{1,2})[月./-](\d{1,2})/);
  if (!m) return null;
  const date = `${m[1]}-${m[2].padStart(2, '0')}-${m[3].padStart(2, '0')}`;
  const parsed = new Date(`${date}T00:00:00Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === date ? date : null;
}
export function parseNewsList(html: string, taggedArtist?: CohortArtist): NewsItem[] {
  const $ = cheerio.load(html);
  if (!$('.cmn_info_list').length) throw new Error('Official news layout changed');
  return $('.cmn_info_list .cmn_info_rack').toArray().flatMap(el => {
    const title = clean($(el).find('.title').text());
    const sourceUrl = safeUrl($(el).attr('href') || '', ['rkmusic.jp']);
    const publishedDate = dateFromText($(el).find('.cmn_date_tag_box').text());
    const artists = [...new Set([...artistsFromText(title), ...(taggedArtist ? [taggedArtist] : [])])];
    if (!title || !sourceUrl || !publishedDate || !artists.length) return [];
    return [{ id: sourceUrl, title, sourceUrl, publishedDate, artists, category: clean($(el).find('.c_fill_white').text()) || 'NEWS' }];
  });
}
export function pageLinks(html: string, base: string): string[] {
  const $ = cheerio.load(html);
  return [...new Set($('.cmn_pagination a').toArray().flatMap(el => {
    const url = safeUrl($(el).attr('href') || '', ['rkmusic.jp'], base);
    return url ? [url] : [];
  }))];
}
export function releaseLinks(html: string): string[] {
  const $ = cheerio.load(html);
  if (!$('.cmn_release_list').length) throw new Error('Official release layout changed');
  return [...new Set($('.cmn_release_box a.text_box').toArray().flatMap(el => {
    const url = safeUrl($(el).attr('href') || '', ['rkmusic.jp']); return url ? [url] : [];
  }))];
}
export function parseRelease(html: string, sourceUrl: string): OfficialWork | null {
  const $ = cheerio.load(html);
  const article = $('.release_article');
  if (!article.length) throw new Error('Official release article layout changed');
  const artists = artistsFromText(article.find('.artist_name').text());
  if (!artists.length) return null;
  const title = clean(article.find('h1').text());
  if (!title) throw new Error('Missing release title');
  const text = clean(article.text());
  const releaseDate = dateFromText(text.match(/(?:配信開始日|デジタル配信|リリース日)[\s\S]{0,70}/)?.[0] || '');
  const stream = article.find('a').toArray().map(el => safeUrl($(el).attr('href') || '', ['linkco.re'])).find(Boolean);
  const streamingUrl = stream ? `https://linkco.re${new URL(stream).pathname}` : undefined;
  const videos = article.find('iframe').toArray().flatMap(el => {
    const url = safeUrl($(el).attr('src') || '', ['www.youtube.com', 'youtube.com', 'www.youtube-nocookie.com']);
    const id = url && new URL(url).pathname.match(/^\/embed\/([\w-]{11})/)?.[1];
    return id ? [{ title: clean($(el).attr('title') || title), url: `https://www.youtube.com/watch?v=${id}` }] : [];
  });
  return { id: sourceUrl, title, sourceUrl, releaseDate, streamingUrl, videos, artists };
}
export function parseEvent(html: string, news: NewsItem): TimelineItem | null {
  const $ = cheerio.load(html);
  const main = $('main');
  if (!main.find('h1').length) throw new Error('Official event layout changed');
  // Only use an explicit schedule row, never ticket dates or the announcement date.
  const row = main.find('tr').toArray().find(el => /^(日時|開催日時|公演日|開催日)$/.test(clean($(el).find('th,td').first().text())));
  const detail = row ? clean($(row).find('td').last().text()) : '';
  const date = dateFromText(detail);
  if (!date) return null;
  return { id: news.id, title: news.title, date, kind: 'event', sourceUrl: news.sourceUrl, publishedDate: news.publishedDate, detail, artists: news.artists };
}
export function parseTuneCore(html: string): OfficialWork[] {
  const $ = cheerio.load(html);
  if (!$('h1').text().includes('CULUA')) throw new Error('Artist page layout changed');
  const works = new Map<string, OfficialWork>();
  $('main a').each((_, el) => {
    const url = safeUrl($(el).attr('href') || '', ['linkco.re']);
    const text = clean($(el).text());
    if (!url || !text) return;
    const sourceUrl = `https://linkco.re${new URL(url).pathname}`;
    const title = text.replace(/^20\d{2}-\d{2}-\d{2}/, '').replace(/(?:シングル|アルバム|EP)\s*•.*$/, '').replace(/20\d{2}\s*年$/, '').trim();
    if (!title) return;
    const old = works.get(sourceUrl);
    works.set(sourceUrl, { id: sourceUrl, title, sourceUrl, releaseDate: dateFromText(text) || old?.releaseDate || null, streamingUrl: sourceUrl, videos: [], artists: ['CULUA'] });
  });
  if (!works.size) throw new Error('No artist releases found');
  return [...works.values()];
}
export function parseLinkCore(html: string, work: OfficialWork): OfficialWork {
  const $ = cheerio.load(html); $('script,style').remove();
  if (!/CULUA/i.test($('h2.name').text())) throw new Error('Unexpected release artist');
  const releaseDate = dateFromText($('body').text().match(/リリース日\s*[:：][\s\S]{0,30}/)?.[0] || '');
  return { ...work, releaseDate: releaseDate || work.releaseDate };
}
export function parseOfficialVideos(xml: string): { title: string; url: string; songTitle: string }[] {
  const $ = cheerio.load(xml, { xml: true });
  if (!$('feed').length || $('feed > title').text() !== 'CULUA') throw new Error('Unexpected YouTube channel feed');
  return $('entry').toArray().flatMap(el => {
    const title = $(el).find('title').first().text();
    const id = $(el).find('yt\\:videoId').text();
    const channel = $(el).find('yt\\:channelId').text();
    const songTitle = title.match(/CULUA\s*[「『](.+?)[」』]/i)?.[1];
    return channel === 'UCn1Zf28m6WbhMDjMjdIjOIA' && /^[\w-]{11}$/.test(id) && songTitle && /Official\s+(?:Music\s+Video|MV)/i.test(title) ? [{ title, songTitle, url: `https://www.youtube.com/watch?v=${id}` }] : [];
  });
}
export function attachOfficialVideos(works: OfficialWork[], videos: ReturnType<typeof parseOfficialVideos>): OfficialWork[] {
  const normalize = (s: string) => s.normalize('NFKC').replace(/\s+/g, '').toLowerCase();
  return works.map(work => {
    const extra = work.artists.includes('CULUA') ? videos.filter(v => normalize(v.songTitle) === normalize(work.title)) : [];
    return { ...work, videos: [...new Map([...work.videos, ...extra.map(({ title, url }) => ({ title, url }))].map(v => [v.url, v])).values()] };
  });
}
export function mergeWorks(primary: OfficialWork[], extra: OfficialWork[]): OfficialWork[] {
  const normalize = (w: OfficialWork) => w.title.replace(/(?:\d+st|\d+nd|\d+rd|\d+th)?\s*EP|[「」\s]/gi, '').toLowerCase();
  const result = [...primary];
  for (const work of extra) {
    const existing = result.find(w => (normalize(w) === normalize(work) && w.artists.some(a => work.artists.includes(a))) || (w.streamingUrl && w.streamingUrl === work.streamingUrl));
    if (existing) { existing.releaseDate ||= work.releaseDate; existing.streamingUrl ||= work.streamingUrl; }
    else result.push(work);
  }
  return result.sort((a, b) => (b.releaseDate || '').localeCompare(a.releaseDate || ''));
}
function csvRows(csv: string, required: string[]) {
  const parsed = Papa.parse<Record<string, string>>(csv, { header: true, skipEmptyLines: true, transformHeader: h => h.trim().toLowerCase() });
  if (parsed.errors.length || required.some(key => !parsed.meta.fields?.includes(key))) throw new Error('Invalid curation CSV columns');
  return parsed.data.filter(row => !['false', '0', 'no'].includes((row.enabled || '').trim().toLowerCase()));
}
export function parseFanPosts(csv: string): FanPost[] {
  const result = new Map<string, FanPost>();
  for (const row of csvRows(csv, ['url'])) {
    const url = safeUrl(row.url.trim(), ['x.com', 'twitter.com', 'www.x.com', 'www.twitter.com']);
    const match = url && new URL(url).pathname.match(/^\/[\w]+\/status\/(\d+)\/?$/);
    const artists = artistsFromText(row.artists || 'CULUA');
    if (match && artists.length) result.set(match[1], { id: match[1], url: `https://x.com${new URL(url!).pathname}`, order: Number(row.order) || 0, artists });
  }
  return [...result.values()].sort((a, b) => a.order - b.order);
}
export function parseSelections(csv: string): WorkSelection[] {
  return csvRows(csv, ['source_url']).flatMap(row => {
    const sourceUrl = safeUrl(row.source_url.trim(), ['rkmusic.jp', 'linkco.re']);
    return sourceUrl ? [{ sourceUrl: sourceUrl.split('?')[0], pinned: ['true', '1', 'yes'].includes((row.pinned || '').toLowerCase()), order: Number(row.order) || 0 }] : [];
  });
}

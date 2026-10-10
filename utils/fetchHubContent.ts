import 'server-only';
import { unstable_cache } from 'next/cache';
import { cache } from 'react';
import type { HubContent, SourceState } from './contentTypes';
import { parseNewsList, pageLinks, releaseLinks, parseRelease, parseEvent, parseTuneCore, parseLinkCore, mergeWorks, parseFanPosts, parseSelections, safeUrl, parseOfficialVideos, attachOfficialVideos } from './contentParsers';

const NEWS = 'https://rkmusic.jp/info/';
const RELEASES = 'https://rkmusic.jp/release/?release_cat=fused';
const TUNECORE = 'https://www.tunecore.co.jp/artists/culua';
const VIDEOS = 'https://www.youtube.com/feeds/videos.xml?channel_id=UCn1Zf28m6WbhMDjMjdIjOIA';
async function read(url: string) {
  if (!safeUrl(url, ['rkmusic.jp', 'www.tunecore.co.jp', 'linkco.re', 'docs.google.com', 'www.youtube.com'])) throw new Error('Unsupported content source');
  const response = await fetch(url, { cache: 'no-store', signal: AbortSignal.timeout(12000) });
  if (!response.ok) throw new Error(`Content source returned ${response.status}`);
  return response.text();
}
async function mapLimited<T, R>(items: T[], fn: (item: T) => Promise<R>): Promise<R[]> {
  const result: R[] = new Array(items.length);
  let next = 0;
  await Promise.all(Array.from({ length: Math.min(4, items.length) }, async () => {
    while (next < items.length) { const index = next++; result[index] = await fn(items[index]); }
  }));
  return result;
}
async function listPages(url: string) {
  const first = await read(url);
  const seen = new Set([url]); const pages = [first]; let queue = pageLinks(first, url);
  while (queue.length) {
    const batch = queue.filter(u => !seen.has(u));
    if (!batch.length) break;
    if (seen.size + batch.length > 20) throw new Error('Official pagination exceeded crawl limit');
    batch.forEach(u => seen.add(u));
    const html = await mapLimited(batch, read); pages.push(...html);
    queue = html.flatMap((h, i) => pageLinks(h, batch[i]));
  }
  return pages;
}
const getNews = unstable_cache(async () => {
  const [all, culua, meda] = await Promise.all([listPages(NEWS), listPages(`${NEWS}?tag=culua`), listPages(`${NEWS}?tag=meda`)]);
  const byId = new Map<string, ReturnType<typeof parseNewsList>[number]>();
  for (const n of [...all.flatMap(h => parseNewsList(h)), ...culua.flatMap(h => parseNewsList(h, 'CULUA')), ...meda.flatMap(h => parseNewsList(h, 'MEDA'))]) {
    const old = byId.get(n.id); byId.set(n.id, { ...n, artists: [...new Set([...n.artists, ...(old?.artists || [])])] });
  }
  const news = [...byId.values()].sort((a, b) => b.publishedDate.localeCompare(a.publishedDate));
  const events = (await mapLimited(news.filter(n => n.category === 'EVENT'), async n => parseEvent(await read(n.sourceUrl), n))).filter(n => n !== null);
  return { news, events, updatedAt: new Date().toISOString() };
}, ['culua-cohort-news-v2'], { revalidate: 1800 });
const getReleases = unstable_cache(async () => {
  const lists = await Promise.all([listPages(RELEASES), listPages('https://rkmusic.jp/release/?release_cat=meda'), listPages('https://rkmusic.jp/release/?release_cat=neun')]);
  const links = [...new Set(lists.flat().flatMap(releaseLinks))];
  const works = (await mapLimited(links, async url => parseRelease(await read(url), url))).filter(w => w !== null);
  if (!works.length) throw new Error('No official CULUA releases found');
  return { works, updatedAt: new Date().toISOString() };
}, ['culua-cohort-releases-v2'], { revalidate: 1800 });
const getDistributor = unstable_cache(async () => {
  const list = parseTuneCore(await read(TUNECORE));
  const works = await mapLimited(list, async w => parseLinkCore(await read(`${w.sourceUrl}?lang=ja`), w));
  return { works, updatedAt: new Date().toISOString() };
}, ['culua-distributor-v2'], { revalidate: 1800 });
let lastVideos: ReturnType<typeof parseOfficialVideos> = [];
const getVideos = unstable_cache(async () => {
  try {lastVideos=parseOfficialVideos(await read(VIDEOS));return {videos:lastVideos,updatedAt:new Date().toISOString(),error:null};}
  catch(error){return {videos:lastVideos,updatedAt:null,error:error instanceof Error?error.message:'fetch failed'};}
}, ['culua-official-videos-v2'], {revalidate:1800});
const getCuration = unstable_cache(async (url: string, kind: 'fanart' | 'works') => {
  const allowed = safeUrl(url, ['docs.google.com']);
  if (!allowed || !new URL(allowed).pathname.startsWith('/spreadsheets/d/e/')) throw new Error('Use a published Google Sheets CSV URL');
  const csv = await read(allowed);
  return { fanPosts: kind === 'fanart' ? parseFanPosts(csv) : [], selections: kind === 'works' ? parseSelections(csv) : [], updatedAt: new Date().toISOString() };
}, ['culua-curation-v1'], { revalidate: 1800 });

export const fetchHubContent = cache(async (): Promise<HubContent> => {
  const fanUrl = process.env.FANART_SHEET_CSV_URL?.trim() || '';
  const worksUrl = process.env.FEATURED_WORKS_SHEET_CSV_URL?.trim() || '';
  const results = await Promise.allSettled([getNews(), getReleases(), getDistributor(), fanUrl ? getCuration(fanUrl, 'fanart') : Promise.resolve(null), worksUrl ? getCuration(worksUrl, 'works') : Promise.resolve(null), getVideos()]);
  const [news, releases, distributor, fans, selections, videos] = results;
  const sources: SourceState[] = results.map((r, i) => {
    const names = ['RK Music · News', 'RK Music · Releases', 'TuneCore · CULUA', 'X · Selection', 'Music · Selection', 'YouTube · CULUA'];
    const urls = [NEWS, RELEASES, TUNECORE, fanUrl, worksUrl, VIDEOS];
    const updatedAt = r.status === 'fulfilled' ? r.value?.updatedAt || null : null;
    const failed = r.status === 'rejected' || (r.value && 'error' in r.value && !!r.value.error);
    if (r.status === 'rejected') console.warn(`[CULUA content] ${names[i]}`, r.reason instanceof Error ? r.reason.message : 'fetch failed');
    return { name: names[i], url: urls[i], updatedAt, status: !urls[i] ? 'unconfigured' : failed ? 'error' : updatedAt && Date.now() - Date.parse(updatedAt) > 3600000 ? 'stale' : 'ready' };
  });
  const works = attachOfficialVideos(mergeWorks(releases.status === 'fulfilled' ? releases.value.works : [], distributor.status === 'fulfilled' ? distributor.value.works : []), videos.status === 'fulfilled' ? videos.value.videos : []);
  const timeline = [...(news.status === 'fulfilled' ? news.value.events : []), ...works.flatMap(w => w.releaseDate ? [{ id: `release:${w.id}`, title: w.title, date: w.releaseDate, kind: 'release' as const, sourceUrl: w.sourceUrl, artists: w.artists }] : [])].sort((a, b) => b.date.localeCompare(a.date));
  return { news: news.status === 'fulfilled' ? news.value.news : [], works, timeline, fanPosts: fans.status === 'fulfilled' ? fans.value?.fanPosts || [] : [], selections: selections.status === 'fulfilled' ? selections.value?.selections || [] : [], sources };
});

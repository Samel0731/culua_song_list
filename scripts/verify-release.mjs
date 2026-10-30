import assert from 'node:assert/strict';
import { load } from 'cheerio';

// Read-only checks for a running local build or a deployed release. No credentials.
const base = new URL(process.argv[2] || 'http://localhost:3000');
assert.ok(['http:', 'https:'].includes(base.protocol), 'Use an HTTP(S) site URL');
const canonicalOrigin = process.argv[3] || 'https://culuasonglist.netlify.app';
const read = async path => fetch(new URL(path, base), { signal: AbortSignal.timeout(60000), redirect: 'manual' });
const keys = (value, allowed) => assert.deepEqual(Object.keys(value).sort(), [...allowed].sort());
const versionKeys = ['artist', 'date', 'streamUrl', 'streamTitle', 'timestamp', 'timestampSeconds', 'songLink'];
const publicPaths = ['/', '/songs', '/news', '/timeline', '/fanart', '/discography', '/about', '/live-house'];

for (const path of publicPaths) {
  const response = await read(path);
  assert.equal(response.status, 200, path);
  const $ = load(await response.text());
  assert.ok($('title').text(), `${path}: missing title`);
  assert.equal($('link[rel=canonical]').attr('href'), canonicalOrigin + (path === '/' ? '' : path), `${path}: canonical`);
}
for (const path of ['/admin', '/admin/demo']) {
  const response = await read(path);
  assert.equal(response.status, 200, path);
  const $ = load(await response.text());
  assert.match($('meta[name=robots]').attr('content') || '', /noindex/, `${path}: indexing`);
  assert.match(response.headers.get('cache-control') || '', /private/, `${path}: private cache`);
  assert.match(response.headers.get('cache-control') || '', /no-store/, `${path}: no-store`);
}
for (const path of ['/api/admin', '/api/admin/quality', '/api/admin/export', '/api/admin/backup']) {
  const response = await read(path);
  assert.equal(response.status, 401, `${path}: anonymous access`);
  assert.match(response.headers.get('cache-control') || '', /private/, path);
  assert.match(response.headers.get('cache-control') || '', /no-store/, path);
}
assert.equal((await read('/api/archive/streams?video=invalid')).status, 400);
const response = await read('/api/archive/streams');
assert.equal(response.status, 200, 'public stream index');
assert.match(response.headers.get('cache-control') || '', /no-store/);
const archive = await response.json();
keys(archive, ['streams', 'songs', 'stale', 'checkedAt']);
assert.equal(archive.stale, false, 'Release must read the current archive, not a fallback');
assert.ok(Number.isFinite(Date.parse(archive.checkedAt)), 'Missing source check timestamp');
assert.ok(archive.streams.length > 0 && archive.songs.length > 0, 'Empty archive');
for (const stream of archive.streams) keys(stream, ['videoId', 'title', 'date', 'count']);
for (const song of archive.songs) {
  keys(song, ['songName', 'artist', 'versions']);
  for (const version of song.versions) keys(version, versionKeys);
}
const performances = archive.songs.reduce((sum, song) => sum + song.versions.length, 0);
assert.equal(performances, archive.streams.reduce((sum, stream) => sum + stream.count, 0), 'Index counts disagree');
const recorded = archive.streams.find(stream => stream.count > 0);
assert.ok(recorded, 'No published setlist');
const detailResponse = await read(`/api/archive/streams?video=${encodeURIComponent(recorded.videoId)}`);
assert.equal(detailResponse.status, 200);
const detail = await detailResponse.json();
keys(detail, ['stream', 'stale', 'checkedAt']);
keys(detail.stream, ['videoId', 'title', 'date', 'count', 'songs']);
assert.equal(detail.stream.songs.length, recorded.count);
for (const performance of detail.stream.songs) {
  keys(performance, ['id', 'position', 'name', 'artist', 'version']);
  keys(performance.version, versionKeys);
  assert.equal(new URL(performance.version.streamUrl).searchParams.get('v'), recorded.videoId);
  const song = archive.songs.find(song => song.songName === performance.name);
  assert.ok(song?.versions.some(version => version.streamUrl === performance.version.streamUrl && version.timestampSeconds === performance.version.timestampSeconds && version.artist === performance.artist), 'Setlist timestamp link differs from song index');
}
const sitemapResponse = await read('/sitemap.xml');
assert.equal(sitemapResponse.status, 200);
const sitemap = load(await sitemapResponse.text(), { xmlMode: true });
const urls = sitemap('loc').map((_, element) => sitemap(element).text()).get();
assert.equal(new Set(urls).size, urls.length, 'Duplicate sitemap entries');
assert.ok(urls.every(url => (url === canonicalOrigin || url.startsWith(canonicalOrigin + '/')) && !/\/(admin|auth)(\/|$)/.test(new URL(url).pathname)), 'Invalid sitemap location');
for (const path of publicPaths) assert.ok(urls.includes(canonicalOrigin + (path === '/' ? '' : path)), `Missing sitemap page: ${path}`);
const songPath = '/songs/' + encodeURIComponent(archive.songs[0].songName);
assert.ok(urls.includes(canonicalOrigin + songPath), 'Song missing from sitemap');
const songResponse = await read(`${songPath}?video=${recorded.videoId}&t=30`);
assert.equal(songResponse.status, 200);
assert.equal(load(await songResponse.text())('link[rel=canonical]').attr('href'), canonicalOrigin + songPath);
const robots = await read('/robots.txt');
assert.equal(robots.status, 200);
assert.match(await robots.text(), /Disallow: \/admin/);
console.log(JSON.stringify({ base: base.origin, streams: archive.streams.length, songs: archive.songs.length, performances, sitemapEntries: urls.length, checkedAt: archive.checkedAt, verifiedSetlist: recorded.videoId, result: 'passed' }, null, 2));

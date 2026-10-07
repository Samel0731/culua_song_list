import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { createRequire } from 'node:module';
import ts from 'typescript';
const require = createRequire(import.meta.url);
function load(name) {
  const code = ts.transpileModule(fs.readFileSync(new URL(`../utils/${name}.ts`, import.meta.url), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true } }).outputText;
  const module = { exports: {} }; vm.runInThisContext(`(function(require,module,exports){${code}\n})`)(require, module, module.exports); return module.exports;
}
const p = load('contentParsers');
const { selectWorks } = load('contentSelectors');
const news = (title, category = 'EVENT') => `<ul class="cmn_info_list"><li><a class="cmn_info_rack" href="https://rkmusic.jp/info/123/"><div class="cmn_date_tag_box"><span class="c_fill_white">${category}</span><span>2026.07.31</span></div><h2 class="title">${title}</h2></a></li></ul>`;
test('news filters the cohort, distinguishes unrelated artists, and tags shared events', () => {
  assert.deepEqual(p.parseNewsList(news('MEDA×NEUN TWO-MAN LIVE'))[0].artists, ['NEUN', 'MEDA']);
  assert.equal(p.parseNewsList(news('HACHI concert')).length, 0);
  assert.deepEqual(p.parseNewsList(news('RK Music festival'), 'CULUA')[0].artists, ['CULUA']);
  assert.throws(() => p.parseNewsList('<html>layout changed</html>'));
});
test('event dates come from the schedule, not announcement or ticket dates', () => {
  const item = p.parseNewsList(news('CULUA concert'))[0];
  const html = '<main><h1>Concert</h1><p>2026.07.31</p><table><tr><th>日時</th><td>2026年9月23日 昼 START 14:30 / 夜 START 19:00</td></tr><tr><th>チケット受付</th><td>2026年8月1日</td></tr></table></main>';
  assert.equal(p.parseEvent(html, item).date, '2026-09-23');
  assert.equal(p.parseEvent('<main><h1>Concert</h1><p>Tickets: 2026/08/01</p></main>', item), null);
});
test('dates validate actual calendar values without inventing a day from a year', () => {
  assert.equal(p.dateFromText('2026年2月30日'), null);
  assert.equal(p.dateFromText('2026年'), null);
  assert.equal(p.dateFromText('2024/02/29'), '2024-02-29');
});
test('release parsing retains cohort artists, official MV and streaming source', () => {
  const html = '<article class="release_article"><h1>EP「Q」</h1><p class="artist_name">NEUN</p><p>配信開始日：2025.06.09</p><iframe src="https://www.youtube.com/embed/Hx1KAdapT1M" title="NEUN MV"></iframe><a href="https://linkco.re/example">Release</a></article>';
  const release = p.parseRelease(html, 'https://rkmusic.jp/release/1/');
  assert.equal(release.releaseDate, '2025-06-09'); assert.deepEqual(release.artists, ['NEUN']);
  assert.equal(release.videos[0].url, 'https://www.youtube.com/watch?v=Hx1KAdapT1M');
  assert.equal(p.parseRelease(html.replace('NEUN</p>', 'HACHI</p>'), 'https://rkmusic.jp/release/1/'), null);
});
test('distributor duplicates merge and do not fabricate a release date or MV', () => {
  const works = p.parseTuneCore('<h1>CULUA</h1><main><a href="https://linkco.re/abc?lang=ja">2026-08-31at dawnシングル • 1曲</a><a href="https://linkco.re/abc?lang=ja">at dawn2026年</a><a href="https://linkco.re/def">KALMIA2025年</a></main>');
  assert.equal(works.length, 2); assert.equal(works[0].title, 'at dawn'); assert.equal(works[0].releaseDate, '2026-08-31'); assert.equal(works[1].releaseDate, null);
  assert.deepEqual(works[0].videos, []);
});
test('RK and distributor release entries merge by streaming link without losing MV', () => {
  const official = { id: 'rk', title: '1st EP「KALMIA」', artists: ['CULUA'], sourceUrl: 'https://rkmusic.jp/release/610/', streamingUrl: 'https://linkco.re/abc', releaseDate: '2025-05-17', videos: [{ title: 'MV', url: 'video' }] };
  const extra = { ...official, id: 'tc', title: 'KALMIA', sourceUrl: 'https://linkco.re/abc', videos: [] };
  const merged = p.mergeWorks([official], [extra]); assert.equal(merged.length, 1); assert.equal(merged[0].videos.length, 1);
});
test('fan curation filters disabled, unsafe and duplicate posts and supports multi-artist work', () => {
  const posts = p.parseFanPosts('url,artists,order,enabled\nhttps://x.com/artist/status/123,"CULUA,NEUN",2,TRUE\nhttps://twitter.com/artist/status/123,NEUN,1,TRUE\nhttps://x.com/artist/status/456,MEDA,0,FALSE\njavascript:alert(1),CULUA,0,TRUE');
  assert.equal(posts.length, 1); assert.deepEqual(posts[0].artists, ['NEUN']); assert.equal(posts[0].url, 'https://x.com/artist/status/123');
  assert.deepEqual(p.parseFanPosts('url,artists,order,enabled\n,CULUA,1,FALSE'), []);
  assert.throws(() => p.parseFanPosts('<html>Sign in</html>'));
});
test('pinning changes selection order without duplicating a release', () => {
  const works = [{ id: 'new', sourceUrl: 'https://rkmusic.jp/release/2/' }, { id: 'old', sourceUrl: 'https://rkmusic.jp/release/1/' }];
  const selected = selectWorks(works, p.parseSelections('source_url,pinned,order,enabled\nhttps://rkmusic.jp/release/1/,TRUE,1,TRUE'));
  assert.deepEqual(selected.map(w => w.id), ['old', 'new']);
});
test('URL allowlists reject scripts, lookalike domains, and non-https sources', () => {
  for (const url of ['javascript:alert(1)', 'https://rkmusic.jp.example.com/release/1/', 'http://rkmusic.jp/release/1/']) assert.equal(p.safeUrl(url, ['rkmusic.jp']), null);
});
test('official YouTube feed attaches exact original MV titles and rejects covers and other channels', () => {
  const entry = (title, channel = 'UCn1Zf28m6WbhMDjMjdIjOIA') => `<entry><title>${title}</title><yt:videoId>cEeiyOp94WI</yt:videoId><yt:channelId>${channel}</yt:channelId></entry>`;
  const xml = `<feed xmlns:yt="http://www.youtube.com/xml/schemas/2015"><title>CULUA</title>${entry('CULUA「at dawn」Official Music Video')}${entry('CULUA「cover」歌ってみた')}${entry('CULUA「fake」Official Music Video', 'other')}</feed>`;
  const videos = p.parseOfficialVideos(xml); assert.equal(videos.length, 1);
  const works = p.attachOfficialVideos([{ id: 'at-dawn', title: 'at dawn', artists: ['CULUA'], videos: [] }, { id: 'peer', title: 'at dawn', artists: ['NEUN'], videos: [] }], videos);
  assert.equal(works[0].videos[0].url, 'https://www.youtube.com/watch?v=cEeiyOp94WI'); assert.equal(works[1].videos.length, 0);
});

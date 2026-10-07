import fs from 'node:fs';
import vm from 'node:vm';
import { createRequire } from 'node:module';
import ts from 'typescript';
const require = createRequire(import.meta.url);
const code = ts.transpileModule(fs.readFileSync(new URL('../utils/contentParsers.ts', import.meta.url), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true } }).outputText;
const mod = { exports: {} }; vm.runInThisContext(`(function(require,module,exports){${code}\n})`)(require, mod, mod.exports);
const p = mod.exports;
const read = async url => { const r = await fetch(url, { signal: AbortSignal.timeout(15000) }); if (!r.ok) throw new Error(`${r.status}: ${url}`); return r.text(); };
const news = p.parseNewsList(await read('https://rkmusic.jp/info/'));
console.log('Latest cohort news:', news.map(n => ({ title: n.title, artists: n.artists })));
for (const n of news.filter(n => n.category === 'EVENT')) console.log('Event:', p.parseEvent(await read(n.sourceUrl), n));
for (const category of ['fused', 'neun', 'meda']) {
  const base = `https://rkmusic.jp/release/?release_cat=${category}`;
  const first = await read(base); const pages = [first, ...await Promise.all(p.pageLinks(first, base).map(read))];
  const links = [...new Set(pages.flatMap(p.releaseLinks))];
  const works = [];
  for (let i = 0; i < links.length; i += 4) works.push(...await Promise.all(links.slice(i, i + 4).map(async url => p.parseRelease(await read(url), url))));
  console.log(category, works.filter(Boolean).map(w => ({ title: w.title, artists: w.artists, date: w.releaseDate, mv: w.videos.length })));
}
const extra = p.parseTuneCore(await read('https://www.tunecore.co.jp/artists/culua'));
console.log('Distributor:', (await Promise.all(extra.map(async w => p.parseLinkCore(await read(`${w.sourceUrl}?lang=ja`), w)))).map(w => ({ title: w.title, date: w.releaseDate })));

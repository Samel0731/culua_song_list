import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';
import React from 'react';
import { renderToString } from 'react-dom/server';

const require = createRequire(import.meta.url), repo = fileURLToPath(new URL('../', import.meta.url));
const cache = new Map();
const stubs = {
  'next/link': { __esModule: true, default: ({ href, children, ...props }) => React.createElement('a', { href, ...props }, children) },
  'next/image': { __esModule: true, default: props => React.createElement('img', { src: props.src, alt: props.alt }) },
  'next/navigation': { useRouter: () => ({ push() {} }), usePathname: () => '/' },
};
function load(file) {
  file = path.resolve(repo, file);
  if (cache.has(file)) return cache.get(file).exports;
  const mod = { exports: {} }; cache.set(file, mod);
  const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { target: ts.ScriptTarget.ES2017, module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true } }).outputText;
  const resolver = name => {
    if (stubs[name]) return stubs[name];
    if (name.startsWith('@/') || name.startsWith('.')) {
      const base = name.startsWith('@/') ? path.resolve(repo, name.slice(2)) : path.resolve(path.dirname(file), name);
      const target = ['.ts', '.tsx'].map(ext => base + ext).find(fs.existsSync);
      if (target) return load(target);
    }
    return require(name);
  };
  vm.runInThisContext(`(function(require,module,exports){${code}\n})`, { filename: file })(resolver, mod, mod.exports);
  return mod.exports;
}
const { LanguageProvider } = load('context/LanguageContext.tsx');
const { PlayerProvider } = load('context/PlayerContext.tsx');
const HubContent = load('app/components/HubContent.tsx').default;
const { hubCopy } = load('utils/hubCopy.ts');
const { talents } = load('utils/talents.ts');
const { unavailable } = load('utils/contentSelectors.ts');

const sourceNames = ['RK Music · News', 'RK Music · Releases', 'TuneCore · CULUA', 'X · Selection', 'Music · Selection', 'YouTube · CULUA'];
const content = status => ({ news: [], works: [], timeline: [], fanPosts: [], selections: [], sources: sourceNames.map(name => ({ name, url: 'https://rkmusic.jp/', updatedAt: null, status: status[name] || 'ready' })) });
const render = (view, data) => renderToString(React.createElement(LanguageProvider, null, React.createElement(PlayerProvider, { initialSongs: [] }, React.createElement(HubContent, { data, view, today: '2026-11-26' }))));
const zh = hubCopy.zh;

test('a failed official source is not shown as an empty one', () => {
  const failed = render('works', content({ 'RK Music · Releases': 'error', 'TuneCore · CULUA': 'error' }));
  assert.ok(failed.includes(zh.unavailable)); assert.ok(!failed.includes(zh.empty));
  const empty = render('works', content({}));
  assert.ok(empty.includes(zh.empty)); assert.ok(!empty.includes(zh.unavailable));
  // One failing source with another still readable is not a total failure.
  assert.ok(render('works', content({ 'TuneCore · CULUA': 'error' })).includes(zh.empty));
  assert.ok(render('news', content({ 'RK Music · News': 'error' })).includes(zh.unavailable));
  assert.ok(render('fanart', content({ 'X · Selection': 'error' })).includes(zh.unavailable));
});

test('empty fan creations link every cohort talent, and the filter lists the shared talents', () => {
  const html = render('fanart', content({}));
  for (const talent of talents) {
    assert.ok(html.includes(`href="${talent.x}"`), talent.name);
    assert.ok(html.includes(`value="${talent.name}"`), talent.name);
  }
});

test('unavailability follows the selected talent and timeline type', () => {
  const sources = status => content(status).sources;
  const releasesDown = sources({ 'RK Music · Releases': 'error' });
  assert.equal(unavailable(releasesDown, 'works', 'NEUN', 'all'), true);
  assert.equal(unavailable(releasesDown, 'works', 'MEDA', 'all'), true);
  assert.equal(unavailable(releasesDown, 'works', 'CULUA', 'all'), false);
  assert.equal(unavailable(releasesDown, 'works', 'all', 'all'), false);
  const newsDown = sources({ 'RK Music · News': 'error' });
  assert.equal(unavailable(newsDown, 'timeline', 'all', 'event'), true);
  assert.equal(unavailable(newsDown, 'timeline', 'all', 'release'), false);
  assert.equal(unavailable(newsDown, 'timeline', 'all', 'all'), false);
  assert.equal(unavailable(sources({ 'RK Music · News': 'error', 'RK Music · Releases': 'error' }), 'timeline', 'MEDA', 'all'), true);
  assert.equal(unavailable(releasesDown, 'timeline', 'NEUN', 'release'), true);
});

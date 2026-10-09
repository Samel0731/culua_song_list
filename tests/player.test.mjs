import { test, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';
import { JSDOM } from 'jsdom';
import React, { act } from 'react';
import { createRoot, hydrateRoot } from 'react-dom/client';
import { renderToString } from 'react-dom/server';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const nativeRequire = createRequire(import.meta.url);

// Compile the actual TS components; use React's real hooks and a local DOM.
const cache = new Map();
function loadSource(relative) {
  const file = path.resolve(__dirname, '..', relative);
  if (cache.has(file)) return cache.get(file).exports;
  const sourceModule = { exports: {} };
  cache.set(file, sourceModule);
  const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true } }).outputText;
  const localRequire = name => {
    if (name.startsWith('@/')) {
      const base = name.slice(2);
      const ext = fs.existsSync(path.resolve(__dirname, '..', `${base}.tsx`)) ? '.tsx' : '.ts';
      return loadSource(base + ext);
    }
    return nativeRequire(name);
  };
  vm.runInThisContext(`(function(require,module,exports){${code}\n})`, { filename: file })(localRequire, sourceModule, sourceModule.exports);
  return sourceModule.exports;
}
const { PlayerProvider, usePlayer } = loadSource('context/PlayerContext.tsx');
const { LanguageProvider, useLanguage } = loadSource('context/LanguageContext.tsx');
const YouTubePlayer = loadSource('app/components/YouTubePlayer.tsx').default;
const { videoId } = loadSource('utils/featuredWorks.ts');
let dom, root;
beforeEach(() => {
  dom = new JSDOM('<!doctype html><html><head></head><body><div id="root"></div></body></html>', { url: 'http://localhost:3000' });
  global.window = dom.window;
  global.document = dom.window.document;
  global.IS_REACT_ACT_ENVIRONMENT = true;
  window.dispatchEvent(new window.StorageEvent('storage', { key: null }));
  root = createRoot(document.getElementById('root'));
});
afterEach(async () => { await act(async () => root.unmount()); dom.window.close(); delete global.window; delete global.document; });
const version = (seconds, url = 'https://youtu.be/Hx1KAdapT1M') => ({ date: '2026/01/01', streamUrl: url, streamTitle: 'Live', timestamp: String(seconds), timestampSeconds: seconds, songLink: '' });
const track = (name, versions) => ({ songName: name, artist: 'CULUA', versions });

test('saved language hydrates without a server/client mismatch and switches immediately', async () => {
  let state;
  function Probe() {
    state = useLanguage();
    return React.createElement('span', null, state.lang);
  }
  const tree = React.createElement(LanguageProvider, null, React.createElement(Probe));
  window.localStorage.setItem('app-language', 'ja');
  const html = renderToString(tree);
  assert.equal(html, '<span>zh</span>');
  await act(async () => root.unmount());
  const container = document.getElementById('root');
  container.innerHTML = html;
  const errors = [];
  await act(async () => { root = hydrateRoot(container, tree, { onRecoverableError: error => errors.push(error) }); });
  assert.equal(container.textContent, 'ja');
  assert.equal(document.documentElement.lang, 'ja');
  assert.deepEqual(errors, []);
  await act(async () => state.setLang('en'));
  assert.equal(container.textContent, 'en');
  assert.equal(window.localStorage.getItem('app-language'), 'en');
});

test('language follows changes in other tabs and falls back for invalid or cleared storage', async () => {
  function Probe() { return React.createElement('span', null, useLanguage().lang); }
  await act(async () => root.render(React.createElement(LanguageProvider, null, React.createElement(Probe))));
  const update = async value => {
    if (value === null) window.localStorage.clear();
    else window.localStorage.setItem('app-language', value);
    await act(async () => window.dispatchEvent(new window.StorageEvent('storage', { key: value === null ? null : 'app-language' })));
  };
  await update('ja'); assert.equal(document.getElementById('root').textContent, 'ja');
  await update('unsupported'); assert.equal(document.getElementById('root').textContent, 'zh');
  await update('en'); assert.equal(document.documentElement.lang, 'en');
  await update(null); assert.equal(document.documentElement.lang, 'zh-Hant');
});

test('blocked storage still allows language switching', async () => {
  Object.defineProperty(window, 'localStorage', { get() { throw new Error('Storage blocked'); }, configurable: true });
  let state;
  function Probe() { state = useLanguage(); return React.createElement('span', null, state.lang); }
  await act(async () => root.render(React.createElement(LanguageProvider, null, React.createElement(Probe))));
  assert.equal(state.lang, 'zh');
  await act(async () => state.setLang('ja'));
  assert.equal(document.getElementById('root').textContent, 'ja');
  assert.equal(document.documentElement.lang, 'ja');
});

test('failed storage writes do not prevent a language change', async () => {
  window.localStorage.setItem('app-language', 'en');
  window.localStorage.__proto__.setItem = () => { throw new Error('Storage full'); };
  let state;
  function Probe() { state = useLanguage(); return React.createElement('span', null, state.lang); }
  await act(async () => root.render(React.createElement(LanguageProvider, null, React.createElement(Probe))));
  await act(async () => state.setLang('ja'));
  assert.equal(document.getElementById('root').textContent, 'ja');
});

const featuredWorks = [track("Official A", [version(0)]), track("Official B", [version(0, "https://youtu.be/tXPQo3HHAi4")])];
async function provider(songs, originals = featuredWorks) {
  let state;
  function Probe() { const value = usePlayer(); React.useEffect(() => { state = value; }); return null; }
  await act(async () => root.render(React.createElement(PlayerProvider, { initialSongs: songs, initialOriginals: originals }, React.createElement(Probe))));
  return { get state() { return state; }, async call(name, ...args) { await act(async () => state[name](...args)); } };
}
test('missing archive and official sources never substitute fabricated tracks', async () => {
  const p = await provider([], []);
  await p.call('playRandom');
  assert.equal(p.state.currentSong, null);
});

test('same stream with different timestamps selects the requested version, and one-version loops replay', async () => {
  const song = track('A', [version(30), version(90)]);
  const p = await provider([song]);
  await p.call('playSong', song);
  await p.call('playSong', song, song.versions[1]);
  assert.equal(p.state.currentVersion.timestampSeconds, 90);
  assert.equal(p.state.isPlaying, true);
  await p.call('toggleMode');
  await p.call('playNext');
  assert.equal(p.state.currentVersion.timestampSeconds, 30);
  await p.call('playPrev');
  assert.equal(p.state.currentVersion.timestampSeconds, 90);
  const only = track('Only', [version(0)]);
  await p.call('playSong', only);
  const request = p.state.playbackRequest;
  await p.call('playNext');
  assert.equal(p.state.playbackRequest, request + 1);
  assert.equal(p.state.isPlaying, true);
});

test('list loop wraps, shuffle avoids immediate repeats, pause and close reset state', async () => {
  const a = track('A', [version(0)]), b = track('B', [version(25)]);
  const p = await provider([a, b]);
  await p.call('playSong', b);
  await p.call('playNext');
  assert.equal(p.state.currentSong.songName, 'A');
  await p.call('playPrev');
  assert.equal(p.state.currentSong.songName, 'B');
  await p.call('toggleMode'); await p.call('toggleMode');
  await p.call('playNext');
  assert.equal(p.state.currentSong.songName, 'A');
  await p.call('togglePlay'); assert.equal(p.state.isPlaying, false);
  await p.call('toggleExpand'); await p.call('closePlayer');
  assert.equal(p.state.currentSong, null);
  assert.equal(p.state.currentVersion, null);
  assert.equal(p.state.isExpanded, false);
});

test('empty archive can play curated works, invalid songs are ignored', async () => {
  const p = await provider([]);
  await p.call('playSong', track('Empty', []));
  assert.equal(p.state.currentSong, null);
  await p.call('playRandom');
  assert.ok(featuredWorks.includes(p.state.currentSong));
  await p.call('playNext'); assert.ok(featuredWorks.includes(p.state.currentSong));
});

test('iframe stays mounted across rerenders; timestamp changes and repeated requests load accurately', async () => {
  const calls = [], instances = [], statuses = [], playing = [];
  class FakePlayer {
    constructor(mount, options) {
      this.options = options; instances.push(this);
      const iframe = document.createElement('iframe');
      mount.replaceWith(iframe);
      // The real API adds transport methods only once its iframe is ready.
      const play = this.playVideo.bind(this), pause = this.pauseVideo.bind(this);
      this.playVideo = undefined;
      this.pauseVideo = undefined;
      queueMicrotask(() => {
        this.playVideo = play; this.pauseVideo = pause;
        options.events.onReady({ target: this });
      });
    }
    loadVideoById(options) { calls.push(['load', options]); }
    cueVideoById(options) { calls.push(['cue', options]); }
    playVideo() { calls.push(['play']); }
    pauseVideo() { calls.push(['pause']); }
    destroy() { calls.push(['destroy']); }
  }
  window.YT = { Player: FakePlayer };
  let props = { url: 'https://youtu.be/Hx1KAdapT1M', startTime: 10, playbackRequest: 1, isPlaying: true, onEnd: () => {}, onPlayingChange: value => playing.push(value), onStatus: value => statuses.push(value) };
  const render = async () => { await act(async () => root.render(React.createElement(YouTubePlayer, props))); };
  await render();
  const iframe = document.querySelector('iframe');
  assert.deepEqual(calls.filter(c => c[0] === 'load'), [['load', { videoId: 'Hx1KAdapT1M', startSeconds: 10 }]]);
  await render();
  assert.equal(document.querySelector('iframe'), iframe);
  assert.equal(instances.length, 1);
  assert.equal(calls.filter(c => c[0] === 'load').length, 1);
  props = { ...props, startTime: 120, playbackRequest: 2 }; await render();
  assert.equal(calls.filter(c => c[0] === 'load').at(-1)[1].startSeconds, 120);
  props = { ...props, playbackRequest: 3 }; await render();
  assert.equal(calls.filter(c => c[0] === 'load').length, 3);
  props = { ...props, isPlaying: false }; await render();
  assert.equal(calls.at(-1)[0], 'pause');
  assert.equal(instances.length, 1);
  await act(async () => instances[0].options.events.onAutoplayBlocked());
  assert.equal(statuses.at(-1), 'blocked'); assert.equal(playing.at(-1), false);
  await act(async () => instances[0].options.events.onError());
  assert.equal(statuses.at(-1), 'error');
  await act(async () => root.unmount());
  assert.equal(calls.at(-1)[0], 'destroy');
});

test('video URL formats reject unrelated hosts and support live, shorts, watch and embed', () => {
  assert.equal(videoId('https://youtu.be/Hx1KAdapT1M?t=20'), 'Hx1KAdapT1M');
  for (const url of ['https://www.youtube.com/watch?v=Hx1KAdapT1M', 'https://youtube.com/live/Hx1KAdapT1M', 'https://youtube.com/shorts/Hx1KAdapT1M', 'https://www.youtube-nocookie.com/embed/Hx1KAdapT1M']) assert.equal(videoId(url), 'Hx1KAdapT1M');
  assert.equal(videoId('https://example.com/watch?v=Hx1KAdapT1M'), '');
  assert.equal(videoId('invalid'), '');
});

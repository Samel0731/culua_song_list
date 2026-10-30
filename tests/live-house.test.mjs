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
import { createRoot } from 'react-dom/client';
import * as THREE from 'three';

const require = createRequire(import.meta.url), repo = fileURLToPath(new URL('../', import.meta.url));
const cache = new Map();
let stageBoundary = null;
let testPath = "/live-house";
function load(file) {
  file = path.resolve(repo, file);
  if (cache.has(file)) return cache.get(file).exports;
  const mod = { exports: {} }; cache.set(file, mod);
  const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { target: ts.ScriptTarget.ES2017, module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true } }).outputText;
  const resolver = name => {
    if (name === 'next/navigation') return { usePathname: () => testPath };
    if (name === 'three') return stageBoundary?.three || THREE;
    if (name === 'three/addons/controls/OrbitControls.js' && stageBoundary) return { OrbitControls: stageBoundary.Controls };
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
const model = load('utils/liveHouse/model.ts');
const { halloweenProject } = load('utils/liveHouse/halloween.ts');
const { stageSlots, cameraLimits } = load('utils/liveHouse/stageLayout.ts');
const { PlayerProvider, usePlayer } = load('context/PlayerContext.tsx');
const { LanguageProvider, useLanguage } = load('context/LanguageContext.tsx');
const YouTubePlayer = load('app/components/YouTubePlayer.tsx').default;
const LiveHouse = load('app/live-house/LiveHouse.tsx').default;
function project() {
  const p = model.emptyProject();
  p.performers = [{ id: 'p', name: 'Singer', source: 'https://example.com/artist', color: '#c084fc', avatar: null, appearance: 'generic' }];
  p.tracks = [10, 30].map((start, i) => ({ id: String(i), title: 'Same song', artist: 'Original artist', performerId: 'p', guests: [], videoUrl: 'https://www.youtube.com/watch?v=Hx1KAdapT1M', start, end: start + 5, mood: 'calm' }));
  return p;
}
test('project round trip validates references, images, versions, limits and segment times', () => {
  const p = project();
  assert.deepEqual(model.parseProject(JSON.parse(model.exportProject(p))), p);
  for (const mutate of [
    p => p.version = 3,
    p => p.performers[0].appearance = 'unknown',
    p => p.tracks[0].performerId = 'missing',
    p => p.tracks[0].guests = ['missing'],
    p => p.tracks[0].guests = ['p'],
    p => p.tracks[0].end = 9,
    p => p.tracks[0].start = -1,
    p => p.tracks[0].start = Infinity,
    p => p.tracks[0].videoUrl = 'https://example.com/watch?v=Hx1KAdapT1M',
    p => p.performers[0].avatar = 'data:image/svg+xml,<svg/>',
    p => p.performers[0].source = 'javascript:alert(1)',
    p => p.tracks[1].id = p.tracks[0].id,
    p => p.stage.seed = .5,
    p => p.tracks = Array(201).fill(p.tracks[0]),
  ]) {
    const invalid = structuredClone(p); mutate(invalid);
    assert.throws(() => model.parseProject(invalid));
  }
});
test('archive conversion, duplicate ordering, time formats and themes use real values', () => {
  const version = { streamUrl: 'https://youtu.be/Hx1KAdapT1M?t=12', timestampSeconds: 12, artist: 'Original' };
  const track = model.archiveTrack({ songName: '日本語の曲', artist: 'Fallback' }, version, 'p', 'one');
  assert.equal(track.artist, 'Original'); assert.equal(track.start, 12); assert.equal(track.end, null);
  assert.equal(model.trackSong(track).versions[0].timestampSeconds, 12);
  const p = project();
  assert.deepEqual(model.moveTrack(p.tracks, 0, 1).map(t => t.id), ['1', '0']);
  assert.equal(model.moveTrack(p.tracks, 0, -1), p.tracks);
  assert.equal(model.parseTime('1:02:03'), 3723);
  assert.equal(model.parseTime('90'), 90);
  for (const input of ['-1', '1:99', '1.5', '', 'abc']) assert.equal(model.parseTime(input), null);
  for (const input of ['星空', '星の海', 'galaxy']) assert.equal(model.matchTheme(input), 'stars');
  assert.equal(model.matchTheme('雨夜'), 'rain'); assert.equal(model.matchTheme('森林'), 'forest');
  assert.equal(model.matchTheme('ネオン'), 'neon'); assert.equal(model.matchTheme('unknown'), null);
  assert.deepEqual(model.stagePoints(5), model.stagePoints(5)); assert.notDeepEqual(model.stagePoints(5), model.stagePoints(6));
  assert.deepEqual(model.paletteFromPixels([255, 0, 0, 255, 255, 0, 0, 255, 0, 255, 0, 255, 0, 0, 0, 0]), ['#ff0000', '#00ff00']);
});

test('v1 drafts migrate without inventing end times, and all entry points require complete segments', () => {
  const old = project(); old.version = 1; delete old.performers[0].appearance; old.tracks[0].end = null;
  const migrated = model.parseProject(old);
  assert.equal(migrated.version, 2); assert.equal(migrated.performers[0].appearance, 'generic');
  assert.equal(migrated.tracks[0].end, null);
  assert.deepEqual(model.checkLive(migrated), { ok: false, ids: ['0'] });
  assert.equal(model.checkLive(model.emptyProject()).ok, false);
  for (const end of [0, -1, Infinity, NaN]) {
    const invalid = project(); invalid.tracks[0].end = end;
    assert.equal(model.checkLive(invalid).ok, false);
  }
  assert.equal(model.checkLive(project()).ok, true);
});
test('Halloween preset preserves six distinct official MVs, order, durations, models and references', () => {
  const p = halloweenProject();
  assert.deepEqual(p.tracks.map(t => [t.performerId, t.videoUrl.split('v=')[1], t.start, t.end]), [
    ['meda', 'DGyM7Kr1uTs', 0, 230], ['culua', 'Hx1KAdapT1M', 0, 182], ['neun', 'niLhHoFSJO8', 0, 281],
    ['meda', 'YKx8fWKMyrQ', 0, 232], ['culua', 'o2Q0hF7aa38', 0, 268], ['neun', 'PTUJRM0Ls4s', 0, 270],
  ]);
  assert.equal(p.tracks.reduce((sum, t) => sum + t.end - t.start, 0), 1463);
  assert.deepEqual(model.parseProject(JSON.parse(model.exportProject(p))), p);
  assert.equal(model.matchTheme('萬聖節'), 'halloween'); assert.equal(model.matchTheme('ハロウィン'), 'halloween');
  assert.equal(model.checkLive(p).ok, true);
  assert.equal(p.performers.every(p => p.source.startsWith('https://pbs.twimg.com/profile_images/')), true);
  for (const t of p.tracks) {
    const positions = stageSlots(p.performers, t);
    assert.equal(positions.filter(p => p.visible).length, t.guests.length + 1);
    assert.equal(positions.find(p => p.lead).id, t.performerId);
    assert.equal(positions.find(p => p.lead).x, 0);
    assert.equal(new Set(positions.map(p => `${p.x}:${p.z}`)).size, 3);
  }
  assert.ok(cameraLimits.minAzimuth > -Math.PI / 2 && cameraLimits.maxAzimuth < Math.PI / 2);
});
test('actual 3D models have limbs, side depth and distinct hair geometry; disposal releases owned resources', () => {
  const { createCharacter, disposeObject } = load('utils/liveHouse/characters.ts');
  const signatures = [];
  for (const person of halloweenProject().performers) {
    const rig = createCharacter(person, () => {}), parent = new THREE.Group(); parent.add(rig.root);
    const fringe = rig.root.getObjectByName('flush-fringe');
    assert.ok(fringe.material.map.isDataTexture);
    assert.ok(fringe.scale.z < .48, 'fringe follows the face instead of projecting forward');
    assert.equal(rig.leftArm.isGroup, true); assert.equal(rig.rightLeg.isGroup, true);
    const box = new THREE.Box3().setFromObject(rig.root);
    assert.ok(box.max.z - box.min.z > .8); assert.ok(box.max.y - box.min.y > 2.5);
    const meshes = []; rig.root.traverse(o => { if (o.isMesh) meshes.push(o); });
    signatures.push(meshes.length);
    let released = 0;
    meshes[0].geometry.addEventListener('dispose', () => released++);
    disposeObject(rig.root);
    assert.equal(released, 1); assert.equal(parent.children.length, 0);
  }
  assert.equal(new Set(signatures).size, 3);
});

test('outfit surfaces show the intended color regions, nonmetallic hair and covered backs', () => {
  const { createCharacter, disposeObject } = load('utils/liveHouse/characters.ts');
  const { characterLooks } = load('utils/liveHouse/characterLooks.ts');
  for (const person of halloweenProject().performers) {
    const rig = createCharacter(person, () => {}); rig.root.updateMatrixWorld(true);
    const ray = new THREE.Raycaster();
    const sample = (ys, back = false) => ys.flatMap(y => [-.2, -.1, 0, .1, .2].map(x => {
      ray.set(new THREE.Vector3(x, y, back ? -2 : 2), new THREE.Vector3(0, 0, back ? 1 : -1));
      const hit = ray.intersectObject(rig.root, true)[0]; return hit.object.material.name.split(':')[1];
    }));
    const back = sample([1.9, 2.1, 2.3], true);
    assert.equal(back.includes('skin'), false, person.name + ' rear scalp must have hair');
    const region = sample(person.id === 'meda' ? [1.25, 1.32, 1.39] : [1.02, 1.16, 1.28]);
    const allowed = person.id === 'meda' ? ['coat'] : person.id === 'neun' ? ['coat', 'trim'] : ['coat', 'bodice'];
    assert.ok(region.filter(role => allowed.includes(role)).length / region.length > .5, person.name + ' visible clothing area');
    rig.root.traverse(object => {
      if (object.isMesh && /:hair/.test(object.material.name)) assert.equal(object.material.metalness, 0);
    });
    const texture = rig.root.getObjectByName('flush-fringe').material.map;
    assert.equal(texture.colorSpace, THREE.SRGBColorSpace);
    const expected = new THREE.Color(characterLooks[person.id].hair).getHexString();
    assert.equal([...texture.image.data.slice(0, 3)].map(v => v.toString(16).padStart(2, '0')).join(''), expected);
    if (person.id === 'neun') assert.equal(rig.root.getObjectByName('torso').material.color.getHexString(), 'f3f0f6');
    disposeObject(rig.root);
  }
});

test('choreography stays in safe lanes, jumps land, and real mixers animate then return to idle', () => {
  const { performanceAt, createPerformerMotion } = load('utils/liveHouse/performance.ts');
  const { createCharacter, disposeObject } = load('utils/liveHouse/characters.ts');
  const p = halloweenProject(), slots = stageSlots(p.performers, p.tracks[3]);
  let jumps = 0;
  for (let t = 0; t < 48; t += .05) {
    const poses = slots.map(s => performanceAt(s, t, 1031));
    for (const pose of poses) {
      assert.ok(Math.abs(pose.x) < 3.5 && pose.z > -1 && pose.z < 2);
      assert.ok(pose.jump >= 0 && pose.jump <= .42); if (pose.jump > .2) jumps++;
    }
    for (let i = 0; i < poses.length; i++) for (let j = i + 1; j < poses.length; j++) {
      assert.ok(Math.hypot(poses[i].x - poses[j].x, poses[i].z - poses[j].z) > 2);
    }
  }
  assert.ok(jumps > 0);
  assert.deepEqual(performanceAt(slots[0], 1, 1031), performanceAt(slots[0], 25, 1031));
  const rig = createCharacter(p.performers[0], () => {}), motion = createPerformerMotion(rig);
  motion.update('run', .15, true); motion.update('run', .15, true);
  assert.notEqual(rig.leftLeg.rotation.x, 0);
  motion.idle(true); assert.equal(rig.leftLeg.rotation.x, 0); assert.equal(rig.body.position.y, 0);
  assert.equal(rig.rightArm.rotation.x, -1.5);
  motion.dispose(); disposeObject(rig.root);
});

let dom, root, prior;
beforeEach(() => {
  prior = { window: global.window, document: global.document, FormData: global.FormData, IS_REACT_ACT_ENVIRONMENT: global.IS_REACT_ACT_ENVIRONMENT };
  dom = new JSDOM('<div id="root"></div>', { url: 'http://localhost:3000' });
  global.window = dom.window; global.document = dom.window.document; global.FormData = dom.window.FormData; global.IS_REACT_ACT_ENVIRONMENT = true;
  window.HTMLDialogElement.prototype.close = function () { this.open = false; };
  window.HTMLDialogElement.prototype.showModal = function () { this.open = true; };
  // React was loaded before this per-test DOM, so its legacy input-event
  // fallback needs these event adapters when a real input receives focus.
  window.HTMLElement.prototype.attachEvent = function (name, handler) { this.addEventListener(name.slice(2), handler); };
  window.HTMLElement.prototype.detachEvent = function (name, handler) { this.removeEventListener(name.slice(2), handler); };
  root = createRoot(document.getElementById('root'));
});
afterEach(async () => {
  await act(async () => { window.localStorage.clear(); window.dispatchEvent(new window.StorageEvent('storage', { key: null })); });
  await act(async () => root.unmount()); dom.window.close(); Object.assign(global, prior);
});

test('live queue snapshots edits, advances finitely, replays last segment and returns to archive modes', async () => {
  let state;
  function Probe() { state = usePlayer(); return null; }
  await act(async () => root.render(React.createElement(PlayerProvider, { initialSongs: [] }, React.createElement(Probe))));
  const p = project();
  const incomplete = project(); incomplete.tracks[0].end = null;
  await act(async () => { assert.equal(state.startLive(incomplete).ok, false); });
  assert.equal(state.liveSession, null);
  await act(async () => state.startLive(p));
  p.tracks[0].start = 999; p.stage.color = '#ffffff';
  assert.equal(state.currentVersion.timestampSeconds, 10); assert.equal(state.liveSession.project.stage.color, '#a78bfa');
  await act(async () => state.refreshSongs([])); assert.equal(state.liveSession.index, 0);
  await act(async () => state.playNext()); assert.equal(state.currentVersion.timestampSeconds, 30);
  await act(async () => state.playNext()); assert.equal(state.isPlaying, false); assert.equal(state.liveSession.finished, true);
  await act(async () => state.togglePlay()); assert.equal(state.isPlaying, true); assert.equal(state.liveSession.finished, false);
  await act(async () => state.playPrev()); assert.equal(state.currentVersion.timestampSeconds, 10);
  await act(async () => state.playSong(model.trackSong(project().tracks[0]))); assert.equal(state.liveSession, null);
  await act(async () => state.toggleMode()); assert.equal(state.playMode, 'version-loop');
});

test('segment end and natural end fire once per request, buffering pauses stage, same iframe survives', async () => {
  let instance, ends = 0, clock = 10;
  const calls = [], buffering = [];
  class FakePlayer {
    constructor(mount, options) {
      this.options = options; instance = this;
      mount.replaceWith(document.createElement('iframe'));
      queueMicrotask(() => options.events.onReady({ target: this }));
    }
    loadVideoById(v) { calls.push(v); }
    cueVideoById(v) { calls.push(v); }
    playVideo() {}
    pauseVideo() {}
    getCurrentTime() { return clock; }
    destroy() {}
  }
  window.YT = { Player: FakePlayer };
  let props = { url: 'https://youtu.be/Hx1KAdapT1M', startTime: 10, endTime: 15, playbackRequest: 1, isPlaying: true,
    onEnd: () => ends++, onPlayingChange: () => {}, onStatus: () => {}, onBuffering: v => buffering.push(v) };
  const render = () => act(async () => root.render(React.createElement(YouTubePlayer, props)));
  await render(); const iframe = document.querySelector('iframe');
  await act(async () => instance.options.events.onStateChange({ data: 3 }));
  clock = 16;
  await act(async () => new Promise(r => setTimeout(r, 280))); assert.equal(ends, 0); assert.equal(buffering.at(-1), true);
  await act(async () => instance.options.events.onStateChange({ data: 1 }));
  await act(async () => new Promise(r => setTimeout(r, 280))); assert.equal(ends, 1);
  await act(async () => instance.options.events.onStateChange({ data: 0 })); assert.equal(ends, 1);
  props = { ...props, startTime: 30, endTime: 35, playbackRequest: 2 }; clock = 30; await render();
  assert.equal(document.querySelector('iframe'), iframe); assert.equal(calls.at(-1).startSeconds, 30);
  await act(async () => instance.options.events.onStateChange({ data: 0 })); assert.equal(ends, 1, 'late end from old request does not skip the new segment');
  await act(async () => instance.options.events.onStateChange({ data: 2 })); clock = 40;
  await act(async () => new Promise(r => setTimeout(r, 280))); assert.equal(ends, 1);
  props = { ...props, endTime: null }; await render();
  await act(async () => instance.options.events.onStateChange({ data: 1 }));
  await act(async () => instance.options.events.onStateChange({ data: 3 }));
  await act(async () => instance.options.events.onStateChange({ data: 0 })); assert.equal(ends, 2);
});

test('the Halloween show drives the real provider and player through six tracks exactly once', async () => {
  let state, instance, clock = 0, count = 0;
  class FakePlayer {
    constructor(mount, options) {
      count++; instance = this; this.options = options;
      mount.replaceWith(document.createElement('iframe'));
      queueMicrotask(() => options.events.onReady({ target: this }));
    }
    loadVideoById() {}
    cueVideoById() {}
    playVideo() {}
    pauseVideo() {}
    getCurrentTime() { return clock; }
    destroy() {}
  }
  window.YT = { Player: FakePlayer };
  function Probe() {
    state = usePlayer();
    return state.currentVersion ? React.createElement(YouTubePlayer, {
      url: state.currentVersion.streamUrl, startTime: state.currentVersion.timestampSeconds,
      endTime: state.liveSession.project.tracks[state.liveSession.index].end,
      playbackRequest: state.playbackRequest, isPlaying: state.isPlaying, onEnd: state.playNext,
      onPlayingChange: state.setPlaying, onBuffering: state.setBuffering, onStatus: () => {},
    }) : null;
  }
  await act(async () => root.render(React.createElement(PlayerProvider, { initialSongs: [] }, React.createElement(Probe))));
  await act(async () => state.startLive(halloweenProject()));
  const iframe = document.querySelector('iframe');
  const seen = [];
  for (let i = 0; i < 6; i++) {
    seen.push(state.liveSession.project.tracks[state.liveSession.index].performerId);
    await act(async () => instance.options.events.onStateChange({ data: 2 }));
    assert.equal(state.isPlaying, true, 'outgoing PAUSED must not stop the next request');
    await act(async () => instance.options.events.onStateChange({ data: 1 }));
    clock = state.liveSession.project.tracks[i].end;
    await act(async () => new Promise(resolve => setTimeout(resolve, 280)));
    await act(async () => instance.options.events.onStateChange({ data: 0 }));
    assert.equal(document.querySelector('iframe'), iframe);
    assert.equal(count, 1);
  }
  assert.deepEqual(seen, ['meda', 'culua', 'neun', 'meda', 'culua', 'neun']);
  assert.equal(state.liveSession.index, 5); assert.equal(state.liveSession.finished, true);
  assert.equal(state.isPlaying, false);
});

test('blocked storage keeps editable drafts and language changes preserve typed fields', async () => {
  let language;
  function LanguageProbe() { language = useLanguage(); return null; }
  await act(async () => root.render(React.createElement(LanguageProvider, null,
    React.createElement(PlayerProvider, { initialSongs: [] }, React.createElement(LanguageProbe), React.createElement(LiveHouse)))));
  assert.match(document.body.textContent, /本機保存失敗/);
  await act(async () => [...document.querySelectorAll('button')].find(b => b.textContent === '編輯歌單與舞台').click());
  const name = document.querySelector('input[name=person]'); name.value = 'RK performer';
  const form = name.closest('form');
  await act(async () => form.dispatchEvent(new window.Event('submit', { bubbles: true, cancelable: true })));
  assert.match(document.querySelector('.lh-people').textContent, /RK performer/);
  const title = document.querySelector('input[name=title]'); title.value = 'Draft song';
  await act(async () => language.setLang('ja'));
  assert.equal(document.querySelector('input[name=title]').value, 'Draft song');
  assert.match(document.body.textContent, /セットリスト/);
  await act(async () => language.setLang('en'));
  assert.equal(document.querySelector('input[name=title]').value, 'Draft song');
  assert.match(document.body.textContent, /Local save failed/);
});

test('missing segment ends are listed and focus the editor; preset replacement is confirmed with cancel first', async () => {
  const storage = load('utils/liveHouse/storage.ts');
  const p = project(); p.tracks[0].end = null;
  await storage.saveProject(p).catch(() => {});
  await act(async () => root.render(React.createElement(LanguageProvider, null,
    React.createElement(PlayerProvider, { initialSongs: [] }, React.createElement(LiveHouse)))));
  const button = text => [...document.querySelectorAll('button')].find(b => b.textContent === text);
  await act(async () => button('開演／重新開演').click());
  assert.equal(document.querySelector('.lh-editor').open, true);
  assert.match(document.querySelector('.lh-missing').textContent, /Same song/);
  assert.equal(document.activeElement.name, 'end');
  assert.match(document.querySelector('.lh-render-status').textContent, /無法顯示 3D/);
  await act(async () => button('回到舞台 ×').click());
  await act(async () => button('載入萬聖節演出').click());
  assert.equal(document.querySelector('.lh-dialog').open, true);
  assert.equal(document.activeElement.textContent, '取消');
  await act(async () => button('取代草稿').click());
  assert.match(document.querySelector('.lh-running-order').textContent, /Sing-ularity/);
});

test('invalid import from the collapsed details opens the editor and focuses its error', async () => {
  await act(async () => root.render(React.createElement(LanguageProvider, null,
    React.createElement(PlayerProvider, { initialSongs: [] }, React.createElement(LiveHouse)))));
  assert.equal(document.querySelector('.lh-editor').open, false);
  const input = document.querySelector('.lh-info input[type=file]');
  Object.defineProperty(input, 'files', { configurable: true, value: [{ size: 20, text: async () => '{invalid' }] });
  await act(async () => input.dispatchEvent(new window.Event('change', { bubbles: true })));
  assert.equal(document.querySelector('.lh-editor').open, true);
  assert.equal(document.activeElement.getAttribute('role'), 'alert');
  assert.match(document.activeElement.textContent, /匯入/);
});

test('3D runtime suspends hidden/reduced animation and releases resources after success or failed initialization', () => {
  const names = ['ResizeObserver', 'IntersectionObserver', 'requestAnimationFrame', 'cancelAnimationFrame', 'innerWidth'];
  const saved = Object.fromEntries(names.map(name => [name, global[name]]));
  const pending = new Map(), renderers = [], observers = [], controls = [];
  let counter = 0, fail = false;
  class Renderer {
    domElement = document.createElement('canvas'); shadowMap = {}; renders = 0;
    constructor() { renderers.push(this); }
    setPixelRatio() {} setSize() { if (fail) throw new Error('GPU size failure'); }
    render(scene) { this.renders++; this.scene = scene; } dispose() { this.disposed = true; } forceContextLoss() { this.lost = true; }
  }
  class Controls {
    target = new THREE.Vector3(); constructor() { controls.push(this); }
    update() {} addEventListener() {} removeEventListener() {} dispose() { this.disposed = true; }
  }
  class Observer {
    constructor(callback) { this.callback = callback; observers.push(this); }
    observe() {} disconnect() { this.disconnected = true; }
  }
  Object.assign(global, {
    ResizeObserver: Observer, IntersectionObserver: Observer, innerWidth: 1440,
    requestAnimationFrame: callback => { pending.set(++counter, callback); return counter; },
    cancelAnimationFrame: id => pending.delete(id),
  });
  Object.defineProperty(document, 'hidden', { configurable: true, writable: true, value: false });
  const flush = () => { const callbacks = [...pending.values()]; pending.clear(); callbacks.forEach(callback => callback(counter * 16)); };
  stageBoundary = { three: { ...THREE, WebGLRenderer: Renderer }, Controls };
  const file = path.resolve(repo, 'utils/liveHouse/scene.ts'); cache.delete(file);
  try {
    const { mountStage } = load(file), host = document.createElement('div'); document.body.append(host);
    const input = { project: halloweenProject(), track: halloweenProject().tracks[0], active: true, reduced: false, request: 1 };
    const runtime = mountStage(host, input, () => {});
    flush(); assert.equal(pending.size, 1);
    document.hidden = true; document.dispatchEvent(new window.Event('visibilitychange'));
    assert.equal(pending.size, 0);
    document.hidden = false; document.dispatchEvent(new window.Event('visibilitychange')); flush();
    assert.equal(pending.size, 1);
    runtime.update({ ...input, reduced: true }); flush(); assert.equal(pending.size, 0);
    runtime.update({ ...input, track: input.project.tracks[1], reduced: true, request: 2 }); flush();
    assert.equal(renderers[0].scene.getObjectByName('performer-culua').position.x, 0);
    assert.equal(renderers[0].scene.getObjectByName('performer-meda').position.x, -2.6);
    runtime.update({ ...input, active: false }); flush(); assert.equal(pending.size, 0);
    runtime.dispose(); runtime.dispose();
    assert.equal(host.children.length, 0); assert.equal(pending.size, 0);
    fail = true;
    assert.throws(() => mountStage(host, input, () => {}), /GPU size failure/);
    assert.equal(host.children.length, 0); assert.equal(pending.size, 0);
    assert.equal(renderers.every(r => r.disposed && r.lost), true);
    assert.equal(observers.every(o => o.disconnected), true);
    assert.equal(controls.every(c => c.disposed), true);
  } finally { stageBoundary = null; cache.delete(file); Object.assign(global, saved); }
});

test('fullscreen and rejected-request theater mode preserve iframe, Escape focus and route cleanup', async () => {
  const { LiveHouseViewProvider, useLiveHouseView } = load('context/LiveHouseViewContext.tsx');
  let view, fullscreen = null;
  Object.defineProperty(document, 'fullscreenElement', { configurable: true, get: () => fullscreen });
  document.exitFullscreen = async () => { fullscreen = null; document.dispatchEvent(new window.Event('fullscreenchange')); };
  window.HTMLElement.prototype.requestFullscreen = async function () { fullscreen = this; document.dispatchEvent(new window.Event('fullscreenchange')); };
  function Probe() {
    view = useLiveHouseView();
    return React.createElement('div', null, React.createElement('button', { onClick: e => view.enter(e.currentTarget) }, 'Enter'), React.createElement('iframe', { title: 'Original video' }));
  }
  const render = () => root.render(React.createElement(LiveHouseViewProvider, null, React.createElement(Probe)));
  await act(async () => render()); const iframe = document.querySelector('iframe'), button = document.querySelector('button');
  await act(async () => button.click()); assert.equal(view.mode, 'native');
  assert.equal(document.body.style.overflow, 'hidden'); assert.equal(document.querySelector('iframe'), iframe);
  await act(async () => document.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Escape' })));
  assert.equal(view.mode, 'off'); assert.equal(document.activeElement, button);
  window.HTMLElement.prototype.requestFullscreen = async () => { throw new Error('blocked'); };
  await act(async () => button.click()); assert.equal(view.mode, 'window');
  await act(async () => view.toggleProgram()); assert.equal(view.program, true);
  testPath = '/songs'; await act(async () => render());
  assert.equal(view.mode, 'off'); assert.equal(document.body.style.overflow, '');
  assert.equal(document.querySelector('iframe'), iframe); testPath = '/live-house';
  await act(async () => render()); assert.equal(view.mode, 'off');
  let finishRequest;
  window.HTMLElement.prototype.requestFullscreen = function () { const element = this; return new Promise(resolve => { finishRequest = () => { fullscreen = element; resolve(); }; }); };
  await act(async () => button.click());
  testPath = '/songs'; await act(async () => render());
  await act(async () => finishRequest());
  assert.equal(view.mode, 'off'); assert.equal(fullscreen, null);
  testPath = '/live-house';
});

test('route reentry waits for earlier saves and failed saves retain the latest memory draft', async () => {
  cache.delete(path.resolve(repo, 'utils/liveHouse/storage.ts'));
  const storage = load('utils/liveHouse/storage.ts');
  const previous = global.indexedDB, transactions = [];
  const db = {
    close() {},
    transaction() {
      const tx = { objectStore: () => ({ put() { transactions.push(tx); } }) };
      return tx;
    },
  };
  global.indexedDB = { open() {
    const request = { result: db };
    queueMicrotask(() => request.onsuccess()); return request;
  } };
  const tick = () => new Promise(resolve => setImmediate(resolve));
  try {
    const first = project(), last = project(); last.title = 'Latest draft';
    const save1 = storage.saveProject(first), save2 = storage.saveProject(last);
    let restored = false;
    const read = storage.readProject().then(value => { restored = true; return value; });
    last.title = 'Mutation after save';
    await tick(); assert.equal(transactions.length, 1); assert.equal(restored, false);
    transactions[0].oncomplete(); await save1; await tick();
    assert.equal(transactions.length, 2); assert.equal(restored, false);
    transactions[1].oncomplete(); await save2;
    const result = await read;
    assert.equal(result.project.title, 'Latest draft'); assert.equal(result.persisted, true);
    const failed = project(); failed.title = 'Unsaved memory draft';
    const save3 = storage.saveProject(failed);
    const rejection = assert.rejects(save3);
    await tick(); transactions[2].onabort(); await rejection;
    const memory = await storage.readProject();
    assert.equal(memory.project.title, 'Unsaved memory draft'); assert.equal(memory.persisted, false);
  } finally { global.indexedDB = previous; }
});

 test('ensemble responses and camera phrases share a stable performance clock', () => {
  const { performanceAt, cameraPhrase } = load('utils/liveHouse/performance.ts');
  const p = halloweenProject(), slots = stageSlots(p.performers, p.tracks[3]);
  const lead = slots.find(s => s.lead), guest = slots.find(s => !s.lead);
  assert.equal(performanceAt(lead, 9, 1, true).pose, 'wave');
  assert.equal(performanceAt(guest, 9, 1, true).pose, 'idle');
  assert.equal(performanceAt(guest, 12, 1, true).pose, 'wave');
  assert.ok(slots.every(s => performanceAt(s, 18.6, 1, true).jump > .3));
  assert.equal(cameraPhrase(3, false).close, false);
  assert.equal(cameraPhrase(10, false).close, true);
  assert.equal(cameraPhrase(18, false).close, false);
  assert.equal(cameraPhrase(10, true).close, false);
 });

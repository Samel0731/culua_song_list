import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { createRequire } from 'node:module';
import ts from 'typescript';
const require = createRequire(import.meta.url);
function load(name) {
  const code = ts.transpileModule(fs.readFileSync(new URL(`../utils/${name}.ts`, import.meta.url), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true } }).outputText;
  const mod = { exports: {} }; vm.runInThisContext(`(function(require,module,exports){${code}\n})`)(require, mod, mod.exports); return mod.exports;
}
const { translations } = load('translations');

test('public copy does not present fan-compiled setlists as complete or official', () => {
  const overclaims = [/完整演唱/, /最完整/, /官方資料/, /官方公開的歌單/, /全歌唱曲/, /公式データ/, /complete list/i, /official data/i, /officially released setlists/i];
  for (const [lang, copy] of Object.entries(translations)) {
    for (const [key, value] of Object.entries(copy)) {
      if (key === 'about_source_fans') continue;
      for (const pattern of overclaims) assert.doesNotMatch(String(value), pattern, `${lang}.${key}`);
    }
  }
});

test('setlist copy credits fans and admits gaps in every language', () => {
  for (const lang of ['zh', 'ja', 'en']) {
    const copy = translations[lang];
    assert.ok(copy.about_source_fans, `${lang}.about_source_fans`);
    assert.match(copy.songs_authority_desc_suffix, /缺漏|漏れ|missing/, `${lang} songs copy admits gaps`);
  }
});

test('archive statistics describe counts, not the singer\'s feelings', () => {
  const labels = ['stats_diversity_mainstay', 'stats_diversity_favorite', 'stats_diversity_occasional', 'stats_diversity_first', 'stats_bubble_legend_past'];
  for (const lang of ['zh', 'ja', 'en']) for (const key of labels) assert.doesNotMatch(translations[lang][key], /本命|愛唱|初試|經典|推し|お気に入り|初挑戦|名曲|Mainstay|Favorite|First Try|Classic/, `${lang}.${key}`);
});

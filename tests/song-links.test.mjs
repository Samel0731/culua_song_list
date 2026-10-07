import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
const code = ts.transpileModule(fs.readFileSync(new URL('../utils/songLinks.ts', import.meta.url), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
const module = { exports: {} };
vm.runInThisContext(`(function(require,module,exports){${code}\n})`)(() => ({ videoId: () => 'abcdEFGHijk' }), module, module.exports);
const { songPath, songNameFromParam } = module.exports;
test('Japanese song URLs resolve encoded route params and preserve version timestamps', () => {
  const title = '夢追い人';
  const path = songPath(title);
  assert.equal(songNameFromParam(path.slice('/songs/'.length)), title);
  assert.equal(songNameFromParam(title), title);
  assert.equal(songNameFromParam(' 100% '), '100%');
  assert.equal(songNameFromParam(songPath('A/B').slice(7)), 'A/B');
  assert.equal(songPath(title, { streamUrl: 'https://youtube.com/watch?v=abcdEFGHijk', timestampSeconds: 123 }), `${path}?video=abcdEFGHijk&t=123`);
});

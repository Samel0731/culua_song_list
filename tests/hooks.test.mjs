import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { editedPaths } from '../scripts/hooks/payload.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const readJson = file => JSON.parse(fs.readFileSync(path.join(root, file), 'utf8'));

test('edited paths come from Claude file_path payloads', () => {
  assert.deepEqual(editedPaths({ tool_input: { file_path: 'C:/repo/app/page.tsx' } }), ['C:/repo/app/page.tsx']);
});

test('edited paths come from Codex apply_patch payloads', () => {
  const command = [
    '*** Begin Patch',
    '*** Update File: app/page.tsx',
    '@@',
    '-a',
    '+b',
    '*** Add File: utils/new.ts',
    '+export const x = 1;',
    '*** Update File: utils/old.ts',
    '*** Move to: utils/renamed.ts',
    '*** Delete File: utils/gone.ts',
    '*** Update File: app/page.tsx',
    '*** End Patch',
  ].join('\n');
  assert.deepEqual(editedPaths({ tool_name: 'apply_patch', tool_input: { command } }), ['app/page.tsx', 'utils/new.ts', 'utils/old.ts', 'utils/renamed.ts']);
});

test('payloads without edits yield no paths', () => {
  assert.deepEqual(editedPaths({}), []);
  assert.deepEqual(editedPaths({ tool_input: { command: 'npm test' } }), []);
});

test('Claude and Codex run the same hook scripts', () => {
  const scripts = config => Object.fromEntries(
    Object.entries(config.hooks).map(([event, groups]) => [
      event,
      groups.flatMap(group => group.hooks).flatMap(hook => [hook.command, hook.commandWindows].filter(Boolean))
        .map(command => command.match(/scripts\/hooks\/[\w-]+\.mjs/)?.[0]).sort(),
    ]),
  );
  const claude = scripts(readJson('.claude/settings.json'));
  const codex = scripts(readJson('.codex/hooks.json'));
  for (const event of ['PostToolUse', 'Stop']) {
    assert.ok(claude[event]?.length, `.claude/settings.json has no ${event} hook`);
    assert.deepEqual([...new Set(codex[event])], [...new Set(claude[event])], `${event} hooks differ between .claude/settings.json and .codex/hooks.json`);
  }
});

test('each lint hook matcher covers its agent\'s file-edit tools', () => {
  const matches = (config, tool) => config.hooks.PostToolUse.some(group => group.hooks.some(hook => /lint-edited\.mjs/.test(hook.command)) && new RegExp(`^(?:${group.matcher})$`).test(tool));
  const claude = readJson('.claude/settings.json');
  const codex = readJson('.codex/hooks.json');
  for (const tool of ['Edit', 'Write', 'MultiEdit']) assert.ok(matches(claude, tool), `.claude/settings.json PostToolUse matcher misses ${tool}`);
  assert.ok(matches(codex, 'apply_patch'), '.codex/hooks.json PostToolUse matcher misses apply_patch, the tool Codex edits files with');
});

test('lint hook blocks a rule violation from a Codex patch and passes clean files', () => {
  const scratch = path.join(root, 'utils', `__hook-probe-${process.pid}.ts`);
  const run = file => spawnSync(process.execPath, [path.join(root, 'scripts/hooks/lint-edited.mjs')], {
    cwd: root,
    encoding: 'utf8',
    input: JSON.stringify({ cwd: root, tool_name: 'apply_patch', tool_input: { command: `*** Begin Patch\n*** Add File: ${path.relative(root, file).split(path.sep).join('/')}\n*** End Patch` } }),
  });
  try {
    fs.writeFileSync(scratch, 'export const read = () => window.localStorage.getItem("x");\n');
    const blocked = run(scratch);
    assert.equal(blocked.status, 2, blocked.stderr);
    assert.match(blocked.stderr, /culua\/no-direct-storage/);

    fs.writeFileSync(scratch, 'export const value = 1;\n');
    const clean = run(scratch);
    assert.equal(clean.status, 0, clean.stderr);
  } finally {
    fs.rmSync(scratch, { force: true });
  }
});

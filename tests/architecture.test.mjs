import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const sourceDirs = ['app', 'context', 'utils'];
const extensions = ['.ts', '.tsx', '.mjs', '.js'];

function walk(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full));
    else if (extensions.includes(path.extname(entry.name))) out.push(full);
  }
  return out;
}

const files = sourceDirs.flatMap(dir => walk(path.join(root, dir)));
const rel = file => path.relative(root, file).split(path.sep).join('/');
const sources = new Map(files.map(file => [file, fs.readFileSync(file, 'utf8')]));

function resolveLocal(specifier, from) {
  let base;
  if (specifier.startsWith('@/')) base = path.join(root, specifier.slice(2));
  else if (specifier.startsWith('.')) base = path.resolve(path.dirname(from), specifier);
  else return null;
  const candidates = [base, ...extensions.map(ext => base + ext), ...extensions.map(ext => path.join(base, 'index' + ext))];
  return candidates.find(candidate => sources.has(candidate)) ?? null;
}

const graph = new Map();
for (const [file, text] of sources) {
  const specifiers = ts.preProcessFile(text, true, true).importedFiles.map(item => item.fileName);
  graph.set(file, {
    specifiers,
    local: specifiers.map(spec => resolveLocal(spec, file)).filter(Boolean),
    client: /^\s*(['"])use client\1/.test(text),
    serverOnly: specifiers.includes('server-only'),
  });
}

function clientReachable() {
  const reached = new Map();
  for (const [file, node] of graph) {
    if (!node.client) continue;
    const stack = [[file, [file]]];
    while (stack.length) {
      const [current, chain] = stack.pop();
      if (reached.has(current)) continue;
      reached.set(current, chain);
      for (const next of graph.get(current).local) stack.push([next, [...chain, next]]);
    }
  }
  return reached;
}

test('client bundles never reach server-only modules', () => {
  const violations = [...clientReachable()]
    .filter(([file]) => graph.get(file).serverOnly)
    .map(([, chain]) => chain.map(rel).join(' -> '));
  assert.deepEqual(violations, [], `A 'use client' file reaches a server-only module. Move the read into a server component or route handler and pass a minimal public DTO:\n${violations.join('\n')}`);
});

test('client bundles read only NEXT_PUBLIC_ environment variables', () => {
  const violations = [];
  for (const [file, chain] of clientReachable()) {
    for (const match of sources.get(file).matchAll(/process\.env\.([A-Z0-9_]+)/g)) {
      if (match[1] !== 'NODE_ENV' && !match[1].startsWith('NEXT_PUBLIC_')) violations.push(`${match[1]} in ${chain.map(rel).join(' -> ')}`);
    }
  }
  assert.deepEqual(violations, [], `Server secrets would be bundled for the browser. Read them only in server modules:\n${violations.join('\n')}`);
});

test('secret-like environment names are never NEXT_PUBLIC_', () => {
  const scanned = [...files, ...walk(path.join(root, 'scripts')), path.join(root, 'proxy.ts')];
  const example = path.join(root, '.env.example');
  if (fs.existsSync(example)) scanned.push(example);
  const violations = [];
  for (const file of scanned) {
    for (const match of fs.readFileSync(file, 'utf8').matchAll(/NEXT_PUBLIC_[A-Z0-9_]*(SERVICE_ROLE|SECRET|BACKUP_KEY|ACCESS_TOKEN|PRIVATE)[A-Z0-9_]*/g)) {
      violations.push(`${match[0]} in ${rel(file)}`);
    }
  }
  assert.deepEqual(violations, [], `NEXT_PUBLIC_ values are shipped to every visitor. Drop the prefix and read the secret server-side:\n${violations.join('\n')}`);
});

test('public code never imports admin modules', () => {
  const isAdmin = file => /^app\/(admin|api\/admin)\//.test(rel(file));
  const violations = [];
  for (const [file, node] of graph) {
    if (isAdmin(file)) continue;
    for (const target of node.local) if (isAdmin(target)) violations.push(`${rel(file)} -> ${rel(target)}`);
  }
  assert.deepEqual(violations, [], `Public pages must not depend on admin code. Move shared logic into utils/:\n${violations.join('\n')}`);
});

test('ratchet baseline lists only files that still need an exception', () => {
  const baseline = JSON.parse(fs.readFileSync(path.join(root, 'eslint-rules/baseline.json'), 'utf8'));
  const stale = [];
  for (const [rule, pattern] of [['no-new-effects', /\buse(Layout)?Effect\s*\(/], ['no-new-timers', /\b(setTimeout|setInterval|requestAnimationFrame|requestIdleCallback)\s*\(/]]) {
    for (const file of baseline[rule]) {
      const full = path.join(root, file);
      if (!fs.existsSync(full) || !pattern.test(fs.readFileSync(full, 'utf8'))) stale.push(`${rule}: ${file}`);
    }
  }
  assert.deepEqual(stale, [], `Remove these entries from eslint-rules/baseline.json; the exception is no longer used:\n${stale.join('\n')}`);
});

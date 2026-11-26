import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ESLint } from 'eslint';
import { editedPaths } from './payload.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
let input = '';
for await (const chunk of process.stdin) input += chunk;
const payload = JSON.parse(input || '{}');
const base = typeof payload.cwd === 'string' ? payload.cwd : process.cwd();

const eslint = new ESLint({ cwd: root });
const targets = [];
for (const rawFile of editedPaths(payload)) {
  if (!/\.(ts|tsx|mjs|js)$/.test(rawFile)) continue;
  const file = process.platform === 'win32' ? rawFile.replace(/^\/([a-zA-Z])\//, '$1:/') : rawFile;
  const absolute = path.resolve(base, file);
  const relative = path.relative(root, absolute);
  if (relative.startsWith('..') || /^(node_modules|\.next|public|artifacts)[\\/]/.test(relative)) continue;
  if (!fs.existsSync(absolute) || await eslint.isPathIgnored(relative)) continue;
  targets.push(relative);
}
if (!targets.length) process.exit(0);

const results = await eslint.lintFiles(targets);
const errors = results.flatMap(result => result.messages.filter(message => message.severity === 2));
if (!errors.length) process.exit(0);

const formatter = await eslint.loadFormatter('stylish');
process.stderr.write(`ESLint found errors in ${targets.join(', ')}. Fix the cause the message describes; do not add a disable comment unless it has a real reason.\n${await formatter.format(results)}`);
process.exit(2);

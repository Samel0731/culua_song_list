import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
let input = '';
for await (const chunk of process.stdin) input += chunk;
if (JSON.parse(input || '{}').stop_hook_active) process.exit(0);

const changed = spawnSync('git', ['status', '--porcelain', '--', 'app', 'context', 'utils', 'proxy.ts', 'eslint-rules', 'tests'], { cwd: root, encoding: 'utf8' });
if (!changed.stdout.trim()) process.exit(0);

const checks = [
  ['TypeScript', process.execPath, [path.join(root, 'node_modules/typescript/bin/tsc'), '--noEmit']],
  ['Architecture tests', process.execPath, ['--test', 'tests/architecture.test.mjs']],
];
const failures = [];
for (const [name, command, args] of checks) {
  const run = spawnSync(command, args, { cwd: root, encoding: 'utf8' });
  if (run.status !== 0) failures.push(`## ${name} failed\n${(run.stdout + run.stderr).trim().split('\n').slice(-40).join('\n')}`);
}
if (!failures.length) process.exit(0);
process.stderr.write(`${failures.join('\n\n')}\n\nFix these before finishing. Full verification is still: npm run check.\n`);
process.exit(2);

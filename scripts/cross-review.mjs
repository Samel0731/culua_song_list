// Second-opinion review by Codex of changes another agent wrote.
// Usage: npm run review:codex [-- --base main | --commit <sha>]
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const option = name => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : undefined; };
const ref = value => {
  if (value && /^[\w./-]+$/.test(value)) return value;
  console.error('Usage: npm run review:codex [-- --base <branch> | --commit <sha>]');
  process.exit(2);
};
const scope = args.includes('--base')
  ? `the changes on the current branch since it left ${ref(option('--base'))} (git diff ${option('--base')}...HEAD)`
  : args.includes('--commit')
    ? `the changes in commit ${ref(option('--commit'))} (git show ${option('--commit')})`
    : 'the uncommitted changes: staged, unstaged and untracked files (git status, git diff HEAD, and read untracked files in full)';

const focus = `You are reviewing code another agent wrote. Do not edit files. Review ${scope} for the CULUA archive. AGENTS.md is the rulebook; report only concrete defects, each with file:line, the failing scenario, and why it breaks a rule or behaviour. Check in particular:
- correctness and edge cases (empty, unavailable, timeout, conflict states; Japanese/Unicode URLs)
- authorization: active membership on private requests, owner-only operations, RLS, origin checks, no secrets reaching client bundles or NEXT_PUBLIC_
- writes: request IDs kept, finite deadlines, no automatic retry of timed-out writes, PT409 for business conflicts, drafts kept on conflict
- player: no remounting/keying, timestamp seeking, repeat/shuffle and recovery after embed errors still work
- copy: every new public/admin string exists in zh, ja and en; source titles and song/artist names unchanged
- data honesty: no fabricated releases, dates, performances or posts; freshness not overclaimed
- tests: the change is proven by a test or a verify:ui feature-map step, not just asserted
- slop: dead code, comments narrating the edit, speculative abstractions, disabled lint rules, grown eslint-rules/baseline.json
Do not suggest style-only changes. If nothing is wrong, say so plainly.`;

const outDir = path.join(root, 'artifacts/review');
fs.mkdirSync(outDir, { recursive: true });
const stamp = `codex-${new Date().toISOString().replace(/[:.]/g, '-')}`;
const reportFile = path.join(outDir, `${stamp}.txt`);
const logFile = path.join(outDir, `${stamp}.log`);
const log = fs.createWriteStream(logFile);

// A fixed command string: the prompt travels on stdin and the paths are generated here, so nothing user-supplied reaches the shell.
const child = spawn(`codex exec --sandbox read-only --ephemeral --color never -o "${reportFile}" -`, { cwd: root, shell: true, stdio: ['pipe', 'pipe', 'pipe'] });
child.stdin.end(focus);
child.stdout.pipe(log, { end: false });
child.stderr.pipe(log, { end: false });
console.log(`Codex is reviewing ${scope.split(':')[0]}; full transcript: ${path.relative(root, logFile)}`);
child.on('error', error => {
  console.error(`Could not start Codex (${error.message}). Install it with: npm install -g @openai/codex, then run codex login.`);
  process.exit(2);
});
child.on('close', code => {
  log.end(() => {
    if (code !== 0 || !fs.existsSync(reportFile)) {
      console.error(`Codex exited with ${code} and no review. See ${path.relative(root, logFile)}.`);
      process.exit(code || 1);
    }
    console.log(`\n${fs.readFileSync(reportFile, 'utf8').trim()}\n\nSaved to ${path.relative(root, reportFile)}. Verify each finding against the code before acting on it.`);
  });
});

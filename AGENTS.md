# Project conventions

## Project and source of truth

Unofficial, non-commercial CULUA archive; news and timeline also cover NEUN and MEDA. Preserve official attribution, source links and the fan-site disclaimer. Read `README.md` for local commands and source provenance; read `PRODUCT_SETUP.md` for operating procedures, dated verification and remaining work. Keep only these three repository Markdown documents; update existing sections instead of adding reports.

Next.js 16.3.8 App Router, React/React DOM 19.2.8 with React Compiler, TypeScript 5 strict, Tailwind CSS 4, npm/package-lock. Node.js 22+. Use Webpack for dev/build with next-pwa. Match surrounding formatting; avoid unrelated rewrites. Use `@/*` imports. Preserve unrelated working-tree changes and local configuration.

## Code boundaries

- `app/`: App Router pages, route handlers and UI. Server utilities load private data; interactive components use `'use client'`.
- `app/components/archive/`: public archive; `app/admin/`: invited-member administration and isolated demo.
- `context/PlayerContext.tsx`: shared playback. Never key/remount the player to refresh data; preserve timestamp seeking, repeat/shuffle, original-video and next actions after embed errors.
- `context/LanguageContext.tsx`: zh/ja/en preference via useSyncExternalStore. Hydrate in Traditional Chinese; language changes must work with blocked storage and retain drafts. Public/admin copy must cover all three languages; source titles and song/artist names remain original.
- `utils/`: shared models, parsing, selectors, copy, SEO and server data. Keep GroupedSong/SongVersion read compatibility, Japanese/Unicode URLs and `songLinks.ts` resolution rules.
- `utils/archive/`: database clients, typed projections, ingestion, backup, request deadlines, legacy fallback. Use minimal explicit public DTOs; never serialize Dashboard to public clients.
- `supabase/migrations/`: ordered SQL, RLS, RPC auth, audit history and optimistic version checks. Never replay current remote migrations blindly; new schema changes require a new migration.
- `tests/`: Node test runner, jsdom and PGlite. No live media or production credentials required.
- `proxy.ts`: preserve session cookies and private response headers.

## Data, authorization and reliability

Google authentication does not grant archive access. Preserve active membership checks on every private request, server-side verified identities, origin checks on writes, owner-only member/import/backup/restore operations, private/no-store responses and private evidence access. Only basic Google identity scopes; no collaborator Sheet/YouTube permissions. Owner cannot be bootstrapped by the UI.

Keep service role, backup, worker and owner access-token secrets server-only. Never commit `.env.local`, `.archive-private/`, backup files or credentials, or prefix secrets with NEXT_PUBLIC_. Public endpoint additions must use field allowlists and published-only performances, without weakening RLS. Private images remain in archive-evidence, PNG/JPEG up to 10 MB; signed URLs are short-lived.

Writes retain request receipts, finite deadlines and original request IDs. A timeout does not prove cancellation. Never automatically retry a timed-out write with a new ID. Business conflicts use PT409, not 40001 (which PostgREST may retry). Keep local drafts and original edited versions during refresh/conflicts; deleted candidate updates cannot recreate records. Successful writes and failed refreshes are distinct outcomes.

CSV import is owner-only, previewed, digest-checked, validated and allowed only into an empty performance archive. Keep unavailable rows private. Compare counts and timestamp links before data-source changes. Restore requires an active owner, preserves memberships, records history and resets auto-publication to the dry run; retain existing protections.

Automatic publication is disabled until seven actual successful trial days and an owner decision. Require complete scans, known duration, approved name/artist or explicit aliases, two distinct authors, consistent order/count and timestamps within three seconds. OCR, incomplete scans, unknown spellings and conflicts remain in review. Never overwrite human edits or silently change published conflicts.

Budget target NT$0/month, ceiling NT$100. Do not enable paid plans, automatic top-ups, paid AI OCR or paid X API. Worker runs at 00:17 UTC / 08:17 Taiwan with ARCHIVE_ENABLED=true gate; encrypted backup artifacts retained seven days. Do not run sync, restore, migrations, or deploy as a routine test.

## UI and content rules

Preserve black/purple stage design, readable contrast, responsive navigation, semantic links, visible focus, keyboard operation and loading/empty/error states. Explain saved, pending review and public states per operation: saving a review candidate is private, while changing public song/stream/performance data affects the front end. Do not confuse comment scan completion with setlist completeness.

Admin counts must label their scope. Whole-archive quality checks cannot use truncated Dashboard arrays; failed reads are not zero issues. Public latest streams mean latest recorded date, not necessarily latest official broadcast; empty/unavailable data must be explicit. Keep player identity while refreshing listings.

Song snapshots revalidate every 300 seconds with song-archive tag; retain last successful/bundled data on failure without claiming freshness. Hub/curation sources revalidate every 1800 seconds on demand; independent of the worker. Isolate source failures; never fabricate releases, dates, performances or fan posts. Use actual event dates in Japan time, exclude unconfirmed release dates, preserve exact official MV matching and source URL allowlists.

Preserve canonical URLs, shared SEO helpers, JSON-LD escaping, sitemap, robots, OG and public/llms.txt. Exclude admin/auth from indexing. PWA content must receive fresh ISR results; admin/auth/Supabase remain network-only. Do not hand-edit generated public/sw.js or workbox files.

## Verification and documentation

For application changes run `npm run check` (`npm test`, `npm run lint`, `tsc --noEmit`, `npm run build`, `git diff --check`). If child processes are blocked, use `node --test --test-isolation=none tests/*.test.mjs`. Use playback/DOM tests for hydration/player work and PGlite for SQL/permission changes. Read-only live content check: `node scripts/verify-content.mjs`; local site check: `node scripts/verify-site.mjs` (investigate its historical hard-coded sitemap count before treating differences as regressions).

Rules enforced in code (read the diagnostic; do not restate them in prose): `tests/architecture.test.mjs` — no client bundle reaches `server-only` modules or non-`NEXT_PUBLIC_` env, no secret-like `NEXT_PUBLIC_` names, no public→admin imports, baseline entries still needed. `eslint-rules/` — `no-new-effects`, `no-new-timers` (ratchet via `baseline.json`), `no-player-key`, `no-direct-storage`, `no-server-import-in-client`, `no-changelog-comments`, `disable-needs-reason`.

Runtime check: `npm run build`, `npx next start -p 3100`, then `node scripts/drive.mjs [feature-id…] --base http://localhost:3100` (`--list` for ids, `--mobile` for 375px). Prefer the production server; dev-mode recompiles produce spurious page errors. Proof screenshots and `report.json` go to `artifacts/verify/`; look at the screenshots, not only PASS lines. A failure caused by a wrong selector is fixed in `scripts/feature-map.json` only after confirming the app behaviour in the screenshot.

Record only checks actually performed in PRODUCT_SETUP.md. Dates and prior deployment/OAuth/worker observations are not current guarantees. Local builds do not deploy. Distinguish user-run Chinese testing from AI/automated Japanese/English checks; do not call either proof of novice usability for all audiences. Dependency audit warnings remain; do not claim vulnerability-free dependencies.

## Agent collaboration

Claude Code and Codex share this file. Both run the same hooks (`.claude/settings.json`, `.codex/hooks.json` → `scripts/hooks/`): ESLint on every edited file, `tsc` plus architecture tests before a turn ends. Keep both hook files pointing at the same scripts; Codex must re-trust `.codex/hooks.json` in `/hooks` after it changes.

- Author ≠ reviewer. Before committing, a change written by one agent is reviewed by the other: Claude-authored → `npm run review:codex` (report in `artifacts/review/`); Codex-authored → Claude Code `/code-review`.
- Review findings are claims, not orders. Confirm each against code or a failing test, fix the real ones, and state which were rejected and why.
- Done means `npm run check` passes and, for user-visible changes, `npm run verify:ui <feature-ids>` passes with the `scripts/feature-map.json` entry added or updated. Report only commands actually run, with their result.
- Never pass a check by weakening it: no `--no-verify`, no new disable comments without a reason, no new entries in `eslint-rules/baseline.json` (it may only shrink), no skipped or loosened tests.
- When a mistake recurs, add a lint rule in `eslint-rules/` or a test in `tests/` instead of more prose here.
- Another session's uncommitted files are theirs: say so before editing them, and never revert them.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

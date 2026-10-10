# Project conventions

This file guides work in this repository. It describes the current code as of
2026-10-10, including the Supabase archive work present in the working tree.
Implemented features are not evidence that production services are configured
or that the latest changes have been deployed.

## Purpose and stack

- Unofficial, non-commercial CULUA fan music archive and information hub. The
  news and timeline also cover NEUN and MEDA. Preserve official attribution,
  source links, and the fan-site disclaimer.
- Next.js **16.3.8**, App Router, React / React DOM **19.2.8**, TypeScript 5
  with strict checking. The React Compiler is enabled.
- Tailwind CSS 4 through `@tailwindcss/postcss`, plus shared CSS in
  `app/globals.css` and admin styles in `app/admin/admin.css`.
- npm and `package-lock.json` are the package-management convention.
- Webpack is explicitly used for development and production builds to support
  `next-pwa`; do not switch bundlers casually.
- Public content comes from published Google Sheets CSV, RK Music,
  TuneCore/LinkCore, and the official CULUA YouTube RSS feed. Parsers use
  Papa Parse and Cheerio.
- Supabase provides PostgreSQL, Auth (Google OAuth), private evidence storage,
  and database RPCs for archive administration and ingestion.
- UI utilities include Lucide icons, Fuse.js search, Recharts, date-fns/dayjs,
  QR codes, and HTML-to-image sharing. The shared player uses the YouTube
  iframe API; Tesseract.js supports the admin OCR workflow.
- Tests use Node's built-in test runner, jsdom for React/DOM checks, and PGlite
  for database migration and permission checks. ESLint 9 uses Next.js presets.
- The documented live host is Netlify at `https://culuasonglist.netlify.app`.
  GitHub Actions defines product checks and an optional daily archive worker.

## Run locally

Use **Node.js 22+**; CI uses Node.js 22. Run commands from the repository root:

```sh
npm ci
npm run dev
```

Open `http://localhost:3000`. For a production preview:

```sh
npm run build
npm start
```

The public archive defaults to Google Sheets when `ARCHIVE_DATA_SOURCE` is
unset or `sheet`. Supabase credentials are not required for this public mode.
External content requests can fail or time out; the song reader also has a
bundled legacy snapshot fallback. Builds can require network access for content
and the Google font used by `next/font/google`.

For optional admin/database features, copy `.env.example` to `.env.local`
only if the local file does not already exist, and supply the relevant values.
Preserve existing local configuration. Next.js loads this file; standalone Node
scripts need environment variables supplied by the shell/CI, or, with Node 22,
`node --env-file=.env.local scripts/<script>.mjs`.

| Variable | Use |
| --- | --- |
| `NEXT_PUBLIC_SITE_URL` | Site origin and OAuth redirect origin; local default is `http://localhost:3000` |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Public Supabase key for browser/member clients and public snapshot RPC |
| `SUPABASE_SERVICE_ROLE_KEY` | Server/worker access only |
| `ARCHIVE_DATA_SOURCE` | `sheet` until initial import verification passes; `supabase` opts into database reads |
| `ARCHIVE_BACKUP_KEY` | Server-only encryption key: 64 hexadecimal characters |
| `ARCHIVE_REVALIDATE_SECRET` | Server-only bearer secret for the worker cache-refresh endpoint |
| `YOUTUBE_API_KEY`, `YOUTUBE_CHANNEL_ID` | Worker API credentials and official channel ID |
| `ARCHIVE_SITE_URL` | Optional deployed origin for immediate worker cache refresh |
| `FANART_SHEET_CSV_URL`, `FEATURED_WORKS_SHEET_CSV_URL` | Optional published curation CSV URLs; unset/blank disables the respective source |

Do not commit credentials, `.env.local`, or backup files. Only `.env.example`
is intended for version control. Never prefix service, backup, or worker
secrets with `NEXT_PUBLIC_`.

## Repository map and implementation conventions

- `app/`: App Router pages, metadata, route handlers, and UI components.
  Keep data loading in server components/utilities; use `'use client'` for
  interactive components and browser APIs.
- `app/components/archive/`: song browsing, artist browsing, and statistics.
- `context/PlayerContext.tsx`: shared playback state and queue behavior.
  `context/LanguageContext.tsx`: language preference and translation access.
- `utils/`: shared data models, parsers, selectors, copy, SEO, and server fetches.
  `utils/archive/`: database clients/types, CSV import, ingestion rules,
  YouTube API access, backups, and the bundled legacy song snapshot.
- `supabase/migrations/`: ordered SQL migrations for the archive, worker,
  and backup/restore functions. Extend schema through migrations and preserve
  RPC authorization, RLS, revision history, and optimistic version checks.
- `scripts/`: manual verification, archive sync, snapshot refresh, and backups.
- `tests/`: `.test.mjs` regression tests and source fixtures.
- `public/`: static icons, PWA manifest, crawler information, and generated
  service-worker files. Do not hand-edit `sw.js` or `workbox-*.js`.
- `.github/workflows/`: product checks and archive synchronization.
- `proxy.ts`: Next.js session refresh for admin/auth routes; preserve cookie
  handling and private response headers.

Use `@/*` imports for repository-root modules. Components use PascalCase;
utilities use descriptive camelCase names; routes retain Next.js's reserved
filenames. Match the formatting of the file being edited rather than applying
repository-wide formatting. Keep shared types and parsing logic in utilities
instead of duplicating them in pages. Update the lockfile with dependency changes.

Preserve the black/purple stage design, responsive navigation, semantic links,
keyboard access, and visible empty/error states. UI copy supports `zh`, `ja`,
and `en` through `translations.ts`, `stageCopy.ts`, and `hubCopy.ts`. Add copy
for all three languages when extending their public UI. Official source titles
may retain their original language. Language hydration starts in Traditional
Chinese and restores preference through `useSyncExternalStore`; switching must
remain usable when browser storage is blocked.

Public UI remains multilingual; the management UI starts in Traditional
Chinese. Keep server-only clients and secrets out of client components. Use
the established `GroupedSong` / `SongVersion` read interface so archive UI and
playback continue to work across the Sheet-to-database transition.

## Verified setup as of 2026-10-10

- Supabase project `culua-song-list`, reference `akmktondfagxhsksnsbz`, is in
  Tokyo (`ap-northeast-1`). The project was confirmed healthy and its
  organization uses the Free plan. Budget target is NT$0/month, with a
  NT$100/month ceiling; do not enable paid plans, automatic top-ups, paid AI
  OCR, or the paid X API as a routine implementation choice.
- The three initial SQL migration files have been applied. The worker file was
  split into two remote migrations after a tool request-state error, so the
  remote history has four entries: `archive`, `archive_worker_scan`,
  `archive_worker_jobs_import`, and `archive_backup`. Do not blindly replay
  these files or assume local filename versions match remote history. Verify
  migration history before using CLI push; add new migrations for changes.
- The additional `owner_invitation_claim` migration fixes initial owner
  binding: only active, pre-seeded memberships matching a verified Google
  identity may bind an unbound UUID, retaining the existing role and writing
  an audit record. It has been applied and verified in a rolled-back remote
  transaction. Remote migration history now includes this fifth entry.
- All 12 archive tables have RLS enabled. `archive-evidence` is a private
  bucket allowing PNG/JPEG up to 10 MB. The anonymous public snapshot RPC
  succeeded, and anonymous access to the members table was denied.
- Local `.env.local` contains the project URL and publishable key and is
  ignored by Git. Do not reproduce its values in this file or tool output.
  Local public song reads now use `ARCHIVE_DATA_SOURCE=supabase`; production
  source switching has not yet been verified.
- The unique owner membership has been seeded for the user-designated Google
  email, with an audit record. Its verified Google Auth UUID is now bound and
  the local owner dashboard works; do not publish the member's email or infer other
  collaborators from names or domains.
- Google OAuth login has now returned successfully from the user's local
  browser, and the owner email matches a confirmed Google identity in Auth.
  The owner dashboard and initial import have now been exercised in the browser.
  Local server-only service/backup keys are configured. YouTube API
  configuration, worker activation,
  seven-day trial and deployment of these changes remain
  pending. Recheck current settings before claiming any of these are done.
- `/admin` has been tested with the real owner session, including import,
  private images/OCR, backup restore and two-window conflict recovery.
  A second real invited Google account has not been tested.
- FanArt and FeaturedWorks tabs exist but their anonymous CSV requests
  previously returned 401. Their URLs are now opt-in environment variables;
  missing URLs show "Selection not configured" without a request. Handled
  source failures use `console.warn` and retain the visible error state.
- The most recent local checks passed: 50 tests, ESLint, TypeScript,
  production build, and `git diff --check`. Dependency audit warnings remain;
  do not describe the dependency tree as vulnerability-free.

These are dated observations, not guarantees of current account settings.
The 2026-10-10 reliability follow-up applied `archive_request_reliability`,
`archive_restore_receipt`, `archive_restore_safe_delete`, and
`archive_conflict_http_status`; remote history now has nine entries.
Business conflicts use `PT409`, never `40001`, which can trigger PostgREST
transaction retries. Writes use request receipts and finite deadlines; a timeout
does not prove cancellation. Never automatically retry a timed-out write with
a new request ID. Deleted candidate updates cannot recreate the candidate.
The official CSV was imported: 658 song/artist combinations, 3,131 performances,
422 streams and eight unavailable rows. A real owner backup restore succeeded
and content was compared against the import backup; member access was retained.
Private operational copies and local keys live under ignored `.archive-private/`.
Real Japanese/English OCR was measured on one official set-list image: four of
ten titles correct after removing extraneous spaces, one incorrect title and
five missed titles. Manual correction produced ten review-only candidates with
no fabricated artist or timestamp; image-inclusive encrypted backup verified.
Keep this section and `VERIFICATION.md` current when setup changes. Do not
treat existing workflow files or successful local builds as deployment proof.

## Features already implemented

### Production rollout verified on 2026-10-10

PR #4 was merged into `main` as `002d1477bf91fd1e2ee977d15923050258834e23`
and Netlify deploy `6aca53f56a59be00080e2d14` was published. Production uses
`ARCHIVE_DATA_SOURCE=supabase`. Google OAuth returned to the production owner
dashboard; anonymous admin and private-image APIs returned 401 with private,
no-store responses. Production-only Netlify keys and GitHub Actions secrets
were configured with explicit owner authorization. YouTube Data API v3 is
enabled with a key restricted to that API; the workflow gate is enabled.
GitHub run `38062304452` succeeded, scanned both supplied videos using six
quota units, published nothing, and uploaded an encrypted backup retained for
seven days. The effective dry run starts at `2026-10-10T15:07:17.116324Z`;
automatic publication remains disabled. Seven actual successful days and an
owner decision are required before enabling it.

Live comments exposed Japanese quote delimiters after OP/ED. A parser follow-up
excludes these markers and preserves numeric song titles. Its live rerun produced
nine and seven review candidates respectively, with zero publications and 3,131
performances unchanged. Extra historical candidates were rejected through the
owner UI, preserving audit history. Local follow-up checks passed 51 tests using
the documented non-isolated runner, lint, TypeScript and production build.
The second real collaborator login remains unverified. The observations above
supersede earlier rollout-pending notes without implying future scheduled runs
or a subsequent parser deployment have already succeeded.

- Home, official news, discography, event/release timeline, curated fan art,
  about, searchable songs, individual song pages, and focus playback mode.
- Artists and statistics are archive tabs; `/artists`, `/stats`, and `/social`
  redirect to their current destinations.
- One shared YouTube iframe persists across client-side navigation and player
  expansion. Closing playback destroys it; focus mode retains visible video.
  Preserve timestamp seeking, repeat/shuffle behavior, and original-video/next
  actions when embedding fails. Avoid remounting the player with route keys.
- Song pages support performance links and aliases. Preserve Japanese/Unicode
  song URLs, canonical URL deduplication for playback queries, and the link
  resolution rules in `utils/songLinks.ts`.
- SEO includes route metadata, canonical URLs, JSON-LD, Open Graph images,
  sitemap, robots rules, and `public/llms.txt`. Use shared SEO helpers and
  preserve JSON-LD escaping. Admin/auth routes are excluded from indexing.
- PWA generation is disabled in development. Production caches assets;
  content pages must receive fresh ISR results, and admin/auth/Supabase traffic
  must remain network-only.
- `/admin` implements member login, stream/candidate review, song/alias edits,
  performance edits, image evidence/OCR, revisions, owner member management,
  initial CSV import, exports, and encrypted backup/restore.
- SQL migrations implement owner/editor access, published-only public
  snapshots, audit revisions, worker leases, evidence expiration, and restore.

## Data and administration rules

The song snapshot cache revalidates every **300 seconds**, tagged
`song-archive`. It tries the selected data source, then retains an in-process
successful snapshot or the bundled legacy snapshot on failure. Official hub
and curation caches revalidate every **1800 seconds** on demand. This hub
refresh is separate from the scheduled database worker. Isolate source errors;
do not fabricate releases, dates, performances, or fan posts as fallback data.

Preserve CULUA/NEUN/MEDA attribution and exact official MV matching. Use actual
official event dates rather than announcement/ticket-sale dates. Keep event
times in Japan time, and exclude releases with unconfirmed dates from the
timeline. Curated fan-art entries link to original posts and retain an external
link when embedding fails. Source URL allowlists remain enforced.

For a new Supabase project, setup requires applying all existing
migrations in filename order, configuring Google OAuth and the
`/auth/callback` redirect, and seeding the initial owner membership. The
current project's migrations and owner seed are already applied. The UI can invite editors after
the owner exists; it cannot bootstrap the owner. Do not treat an authenticated
Google account as an authorized archive member. Preserve member checks, origin
checks on writes, owner-only operations, private/no-store responses, and
private evidence access.

Google's authorized redirect URI for the current project is
`https://akmktondfagxhsksnsbz.supabase.co/auth/v1/callback`. Supabase's redirect
allowlist needs `http://localhost:3000/auth/callback` for local development and
`https://culuasonglist.netlify.app/auth/callback` for the documented live host.
Use only basic Google identity scopes; never request Sheet or YouTube account
access from collaborators for this login.

Initial CSV import is owner-only, previewed, digest-checked, validated, and
committed only into an empty performance archive. Retain unavailable-video rows
for later review. Compare song/stream/performance counts and timestamp links
before switching `ARCHIVE_DATA_SOURCE` to `supabase`.

Automatic publication starts disabled and requires an owner-controlled switch
after a **seven-day dry run**. Ingestion requires complete scans, approved song
names/artists or explicit aliases, two distinct authors, consistent setlist
order/count, timestamps within three seconds, and known video duration. Keep
conflicts, unknown spellings, incomplete scans, and OCR results in review;
do not overwrite human edits or silently change published conflicts.

The daily workflow runs at **00:17 UTC / 08:17 Asia/Taipei**, and is gated by
the GitHub variable `ARCHIVE_ENABLED=true`. Its required secrets/variables are
declared in `.github/workflows/archive-sync.yml`. It uses bounded API requests,
resumable scans, and encrypted backups with seven-day artifact retention.

Manual maintenance commands (supply their environment first):

```sh
node scripts/archive-sync.mjs
node scripts/archive-snapshot.mjs
node scripts/archive-backup.mjs backup archive-backup.enc
node scripts/archive-backup.mjs inspect archive-backup.enc
```

Sync writes to Supabase; snapshot refresh rewrites the bundled JSON from the
live sheet. Backup restore is a separate deliberate operation requiring an
active owner token (`SUPABASE_OWNER_ACCESS_TOKEN`); preserve this requirement.

## Validation and operational status

For application changes, run the checks used by CI:

```sh
npm test
npm run lint
npx tsc --noEmit
npm run build
git diff --check
```

If test-runner child processes are blocked, use
`node --test --test-isolation=none tests/*.test.mjs` on a compatible Node version.
Use existing player/DOM tests for playback and hydration changes, content
fixtures for parser changes, and PGlite tests for SQL/RPC permission changes.
Tests should not require live media or production database credentials.

`node scripts/verify-content.mjs` checks live external content.
`node scripts/verify-site.mjs` checks a running local server, metadata,
redirects, and sitemap. Its expected sitemap count is currently hard-coded
to 646; investigate legitimate data changes before treating a mismatch as a
site regression. Build success alone does not verify all external sources.

Consult the existing documentation before changing related behavior:

- `README.md`: project overview and local development.
- `DATA_SETUP.md`: curation sheet columns and publication steps. Its last
  recorded state says FanArt/FeaturedWorks were created but anonymous CSV
  access returned 401; verify publication before claiming they are live.
- `PRODUCT_SETUP.md`: account setup, role management, migration/import,
  OAuth, worker activation, image/OCR workflow, backups, restoration,
  troubleshooting, and cost controls.
- `ASSET_SOURCES.md`: asset provenance and media decisions.
- `SEARCH_VISIBILITY.md`: deployment and Search Console follow-up.
- `VERIFICATION.md`: historical checks and limitations, not a current test run.

Supabase credentials, OAuth, migration execution, worker activation, initial
import, latest Netlify deployment, and Search Console status cannot be inferred
from committed code. Verify external setup before claiming completion. Local
validation does not deploy the site. Preserve unrelated working-tree changes
and report only checks actually performed.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

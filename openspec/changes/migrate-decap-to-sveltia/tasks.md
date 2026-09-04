## 1. Local Sveltia Cutover

- [x] 1.1 Replace `apps/web/src/pages/admin/index.astro` with `apps/web/public/admin/index.html` and one small bootstrap that reads the generated mode marker, shows disabled or load-failure text, loads exact `@sveltia/cms@0.205.2`, registers extensions, and calls `CMS.init()`; delete the Decap boot state machine, timeout, retry, singleton, observer, and DOM-repair code and tests.
- [x] 1.2 Migrate the three Distro page `group_intros` keys using the design's mapping; update the JSON, Astro schema, CMS fields, and existing grouping/rendering consumers together, using plain shared data without aliases, adapters, or a migration runner. Verify focused tests preserve all intro text, labels, other keys, Distro item `group` values, shelf membership/order, and the combined 7-inch/10-inch intro selection.
- [x] 1.3 Generate native local/hosted/disabled configuration using `SVELTIA_BACKEND_MODE` and hosted-only `SVELTIA_AUTH_BASE_URL`, fixed repository/`main`, Astro-derived URLs, empty-field omission, filename slugification, `multiple`, and no unsupported Decap options. Set global storage to existing public assets with an absolute base-aware public path while retaining collection-relative overrides. Verify focused config/parity tests and confirm the pinned runtime reaches native repository selection without configuration errors before continuing broader cutover work.
- [x] 1.4 Adapt the seven preview templates and Artist `preSave` slug generation to supported Sveltia APIs; use preview `getAsset`, retain collection-owned media and the native Asset Library, and remove the custom `/admin/media/**` route, resolver, allowlist, suppression, and route-specific tests. Replace pre-launch public catalog image URLs with `/assets/catalog/**`, update their source generator and consumers, and regenerate repository artifacts without live provider writes or legacy redirects. Verify preview registrations, existing/new media, static catalog image output, and shared slug/Markdown behavior in focused tests.
- [x] 1.5 Remove active Decap runtime, Git Gateway, DecapBridge, proxy scripts, package entries, environment wiring, and provider-specific tests; retain historical archives and compatible collection-builder filenames. Synchronize the module-boundary spec/manifest with the new admin roots and entrypoints. Verify scoped dependency searches and existing boundary checks.

## 2. Local Acceptance

- [x] 2.1 Make `pnpm cms:dev` start only Astro at `127.0.0.1:4322`, failing clearly if occupied, and remove `cms:proxy`/`cms:hosted:preflight`. Reuse existing smoke lifecycle/evidence helpers for `pnpm smoke:cms-local -- --screenshots never`; verify native repository selection, reject native configuration errors, check assets and functional console errors, terminate spawned processes, and leave content hashes plus `git status --porcelain` unchanged from the post-migration baseline.
- [x] 2.2 Use Chrome with the GPT extension after the owner completes Chromium's native repository picker; inspect representative Home, Store Item, and Release editing at desktop plus the 320 CSS-pixel floor, and confirm the migrated Distro page fields without saving. Verify collection navigation, field order, validation, image selection, previews, focus, touch targets, horizontal overflow, and unchanged post-migration content/status.

## 3. Hosted Authentication And Deployment

- [ ] 3.1 Deploy the official `sveltia/sveltia-cms-auth` Cloudflare Worker, register the GitHub OAuth app with callback `<worker-url>/callback`, configure encrypted `GITHUB_CLIENT_SECRET`, `GITHUB_CLIENT_ID`, and exact UAT/PRD `ALLOWED_DOMAINS`, grant the designated GitHub CMS account repository write access, and verify that account reaches the GitHub authorization flow from an allowed hostname.
- [x] 3.2 Replace active CMS workflow variables with `SVELTIA_BACKEND_MODE` and `SVELTIA_AUTH_BASE_URL`, remove the `apps/web/src/lib/admin/**` deployment path ignore, retain the final artifact mode check, and update read-only `cms_admin`/`cms_assets` UAT smoke for the static admin document, pinned runtime, GitHub backend, `main`, authenticator URL, configured assets, and absence of Decap, custom admin-media routes, placeholders, localhost fallbacks, and leaked secrets.
- [x] 3.3 Update README/operator guidance for the native GitHub sign-in screen and designated account, direct hosted publication, local Chromium directory selection, manual local Git commit/push, native Asset Library, and the cutover save pause/admin reload. Verify examples match emitted config and commands, and remove active Google/DecapBridge, individual-account, token, proxy, and Decap rollback instructions without injecting replacement login UI.

## 4. Verification And Cutover

- [x] 4.1 Run `pnpm test:cms-admin`, `pnpm smoke:cms-local -- --screenshots never`, `pnpm test:unit`, `pnpm check`, `pnpm audit:unused`, and `pnpm build` against the exact final tree; verify every gate passes and the secret-free artifact remains disabled.
- [ ] 4.2 Coordinate the editorial save pause, deploy UAT, run `cms_admin` and `cms_assets` UAT Static Smoke, then have the owner reload admin, sign in with the designated GitHub account, and complete a no-publish Store Item, image, Release, and migrated Distro page check; fix any task-blocking defect before PRD.
- [ ] 4.3 Build/deploy the UAT-accepted implementation for the PRD target, complete the designated-account no-publish check after reloading admin, and remove remaining external DecapBridge configuration and access; verify Sveltia is the only reachable CMS, resume editorial saves, and retain no Decap rollback artifact or auth path.

## Planning revision accepted — September 3, 2026

The user approved small schema and implementation changes that simplify the migration. The scope blocker is resolved: migrate the three copy keys directly and correct native global media configuration. Do not add aliases, adapters, a KeyValue editor, or a migration framework. Resume implementation with tasks 1.2 and 1.3; prove native configuration acceptance before broader work.

The earlier Browser Use run loaded the pinned runtime but stopped at its field-name and global-public-path errors. `pnpm test:cms-admin` had passed 60 tests across 14 files; that result did not establish native configuration validity. No content was saved or published.

This revision changes planning artifacts only. Task 1.1 remains complete; the new migration task and all remaining implementation/acceptance tasks remain open. Prior partial code changes remain uncommitted, full unit/check/build gates and hosted acceptance are unfinished, and the intermediate tree must not be deployed.

## Pre-launch simplification accepted — September 3, 2026

The user approved dropping old-site compatibility. Replace obsolete catalog image URLs with one static catalog asset path, preserving source media and commerce authority. No redirect, compatibility endpoint, or live provider mutation is required. Continue implementation; hosted setup and owner acceptance remain separate gates.

## Implementation evidence — September 3, 2026

- Completed tasks 1.2–1.5, 2.1, 3.2, 3.3, and 4.1, retaining the earlier task 1.1 work. Overall: 9/13 tasks.
- `pnpm test:cms-admin`: 64 tests passed. Disposable Artist/News fixtures preserve Markdown bodies and Artist slugs through the pre-save hook and Astro's frontmatter parser.
- `pnpm test:unit`: 1,223 tests passed across web, staff, backend, API client, and workflow/route contracts.
- `pnpm check`: passed, including catalog generation parity, environment policy, formatting, lint, types, and module/commerce boundaries. Existing dependency-rule deprecation messages and the unrelated StoreCart Zod hint remain.
- `pnpm build`: passed for web and staff. The final CMS artifact reports `disabled`. All 104 distinct generated catalog image URLs map to built files; `dist/admin/media` is absent.
- `pnpm smoke:cms-local -- --screenshots never`: passed. Evidence: `.codex-artifacts/smoke/local/cms/20260903121433/editor-read-only/evidence.json`. Native configuration accepted; zero console/page errors, unchanged content hashes and Git status, and no remaining browser/server processes or port 4322 listener.
- The real occupied-port launcher test passed. Its test-only deadline allows slow Astro startup under concurrent CI load; it still requires the explicit occupied-port error.
- `pnpm audit:unused`: completed. No remaining CMS findings; unrelated existing findings remain (3 unlisted binaries, 12 unused exports, 2 unused exported types, 1 duplicate export).
- Strict OpenSpec validation and `git diff --check` passed.

### Remaining acceptance and external setup

- Task 2.2 was completed on September 4, 2026. The owner handled Chromium's native directory picker; the GPT Chrome extension performed the remaining walkthrough. No filesystem API was replaced and no Save/Publish action ran.
- Task 3.1 remains open. On September 5, 2026, the official authenticator Worker and GitHub OAuth app were provisioned, the Worker received its client ID, encrypted client secret, and exact UAT/PRD domains, and repository variable `SVELTIA_AUTH_BASE_URL` was added. The designated account has repository administration access. Completion still requires reaching GitHub authorization from an allowed hosted admin origin.
- Tasks 4.2 and 4.3 remain open. No commit, push, static deployment, Worker deployment, Stripe/D1 mutation, or external authentication removal occurred. Follow the one-off UAT-then-PRD sequence after the remaining acceptance gates; do not treat local test evidence as hosted acceptance.

## Local acceptance evidence — September 4, 2026

- Completed task 2.2. Overall: 10/13 tasks.
- Chrome with the GPT extension verified Home, Store Item, Release, and migrated Distro page fields at desktop and 320 CSS pixels. Navigation, field order, validation surfaces, images, previews, focus, touch targets, and overflow passed. Preview CSS now scopes the dark background to custom previews and keeps narrow layouts inside their viewport. Browser console errors: zero.
- Final-tree gates passed: `pnpm test:cms-admin` (64 tests), `pnpm smoke:cms-local -- --screenshots never`, `pnpm test:unit` (1,223 tests), `pnpm check`, `pnpm audit:unused`, and `pnpm build`. The secret-free build remained disabled.

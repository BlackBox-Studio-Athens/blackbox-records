# Planning validation

## Preorder film recovery repair (16 October 2026)

The owner explicitly assigned this UI repair to Codex because Claude quota was exhausted. This overrides implementation ownership for task 2.1 only. The owner subsequently authorized a scoped local commit after checks, then a push to UAT. The approved film-strip layout and Watch placement are unchanged. The completion receipt records the local commit and release identities; the UAT outcome below supersedes the initial local-only delivery boundary.

- Source: `main` at `4bcf027bd2d0a939ab9ee0eca47bcbd7377ed770` plus the focused working diff. SHA-256: `StorePreorderShowcase.tsx` = `069730999dccc85dccbc7ebbec6ad4af33f6c3825cf40348655daa8fcc99d8a6`; `e2e/home-preorders.spec.ts` = `b5b26505ffe4f745d6cb3960d1d25654e54f7678bcab85044d5ed869621a3dc4`. Unrelated harness work was left untouched.
- Verified defects: the old component removes `src` whenever playback becomes ineligible and treats every current `play()` rejection as permanent refusal. The two new Chromium regressions fail against the original component: a scroll pause drops the source, and an injected startup `AbortError` leaves the poster. Retained report: `.codex-artifacts/firefox-android-preorder-video-20261016/before-summary.json`. This proves the lifecycle defects, not the exact physical-device cause reported by the owner.
- Repair: the eligible effect explicitly mutes the element, assigns the selected source only when changed, retains it across ordinary pauses, retries on `canplay` while eligible, and treats only `NotAllowedError` as permanent autoplay refusal. Effect cleanup removes its readiness listener and pauses. No timer, polling, new dependency or shared abstraction was added.
- `pnpm test apps/web/src/components/store/StorePreorderShowcase.test.tsx`: PASS, six affected module tasks (web-store, app-shell, web-layouts, web-pages, web-editorial and commerce-web-integration). `pnpm test:e2e e2e/home-preorders.spec.ts`: PASS, 28 tests across Chromium desktop/mobile and Firefox desktop/compact. Ten new phone cases cover advancing real media time, refresh, retained source and zero new load starts across scroll/visibility/music/full-video pauses, interrupted startup recovery, genuine refusal/poster fallback and initial reduced-motion/saveData source suppression. Report: `.codex-artifacts/firefox-android-preorder-video-20261016/home-summary.json`.
- Browser fixture scope: Local accepted content remains a photo chapter. New film cases mount the actual shipped component through its Astro React renderer with local prepared hero footage, without changing catalog content. Visibility is simulated with `document.hidden` and its event; this is not a physical Android app switch or an SSR film hydration check. The first interrupted-start fixture did not begin loading, so it could never produce readiness; it was corrected to model resource loading before the rejection, then passed. The global Playwright CLI lacked its own Firefox binary; repository Playwright's installed Firefox ran successfully.
- `pnpm test:e2e e2e/player-continuity.spec.ts e2e/public-image-fallback.spec.ts`: PASS, 15 tests across Chromium desktop/mobile and WebKit mobile. Report: `.codex-artifacts/firefox-android-preorder-video-20261016/continuity-summary.json`. These establish existing player/history/image continuity, not WebKit acceptance of the new film fixture.
- `pnpm validate`: PASS, 36 tasks (31 cached), mode `local`, summary `.codex-artifacts/validation/2026-10-16T20-21-57-542Z-36828-578c04/summary.json`; matching before/after fingerprint `d6a1150777176082324694b763169b00600a9660b866df23c3aa94ee71789e33`. Strict change validation and scoped ESLint pass. Graphify AST refresh passed; it reported existing SQL-parser and unrelated source-extraction limitations. The final documentation-inclusive validation pointer is retained in `.codex-artifacts/firefox-android-preorder-video-20261016/completion.json`.
- Acceptance selection: public media and shell/player continuity. CMS, commerce authority and provider acceptance are excluded because this repair changes no content, commerce data, API or external integration. Physical Firefox Android, production footage delivery/cache behavior, actual Android background/foreground, and hosted release acceptance remain unverified. Tasks 1.2/1.3 and the broader design acceptance retain their existing outstanding scope.

## Preorder film UAT software release (16 October 2026)

- Pushed `b536fc1781904bfd9b86df3b9948411814949e55` to `main` after `pnpm build:web` passed route isolation, cache/font/image/sitemap checks and runtime bundle budgets. The push also carries its previously committed parent `4bcf027b` (catalog-number publication review); unrelated harness work remains local and uncommitted.
- Release BlackBox run `38963897209`, release number `607`, succeeded on attempt 2. All validation legs, four public browser shards, WebKit and both staff preview browsers passed on attempt 1. The first deployment stopped at the CMS Worker upload because Cloudflare returned internal authentication/server error `10500`; one failed-job rerun succeeded without source or credential changes. Worker/Pages identity verification and UAT static smoke passed.
- Direct signed-in Chrome read of `https://blackbox-records-web-uat.pages.dev/release.json` confirms SHA `b536fc1781904bfd9b86df3b9948411814949e55`, run `38963897209`, release `607`, publication `555fb5b5-930a-47f7-99ad-2ad9ae2b3eb6`, snapshot `d85a501260604993dd6d147abbf0068b1cb8fbe667c5023fe1b778ceda910cd8`.
- UAT Home loads with its testing banner and one Disintegration preorder, but its accepted content contains no clip: the chapter has no `video` or Watch control. The software is deployed, but this content cannot exercise ambient playback. The owner explicitly approved adding Afterwise's existing Equilibrium clip (`Cl7rWCTGEqY`, already mapped to prepared footage) to UAT and publishing that UAT-only change. No content mutation has occurred yet: Chrome blocked the UAT Staff catalog page (`ERR_BLOCKED_BY_CLIENT`), and Cloudflare's usage dashboard requires sign-in before the mandated Free-tier headroom check. Staff and dashboard access were requested from the owner.
- PRD software, content and launch controls are unchanged. Physical Firefox Android, a real UAT film after publication and hosted film playback acceptance remain open.

Revision: 15 October 2026, after the orchestrator's eight decisions. This record supersedes the initial planning fingerprints and task counts.

## Authoring checks

- Task counts: Claude (UI): 10; Codex (non-UI): 0; shared: 6 (16 total). All implementation checkboxes remain unchecked.
- Guard: `pnpm openspec:guard` passed before this revision.
- Strict validation: PASS with `pnpm openspec -- validate mobile-layout-rhythm --type change --strict`.
- Scoped formatting: PASS across the three change folders.
- Planning-artifact SHA-256 fingerprint: `e6b07b1dff15d123be06a10ce121b72a7c50fdb4a6b224156ad60302839be9db` across 10 files, hashing sorted relative-path/file-SHA256 lines joined with LF; validation.md is excluded.
- F1–F22 coverage is retained. C2/C3 still depend on C1.
- Edits are limited to the three named OpenSpec change directories. No direct Git commands, source edits, implementation tests, publication or deployment are part of this pass.
- Preservation check: all 17 protected files retain their pre-revision SHA-256 values.

## Decisions verified in the revised plan

Catalogue order stays as implemented: All places BlackBox releases first by catalog number, then Distro by artist. Existing Distro format links and their Distro counts only move; the no-JavaScript fallback remains reachable. The purchase note stays above the grid. No new order control, facets, counts or data/projection work remains.

The round-1 manual-control retention decision is superseded by the owner's knowing removal on every viewport on 16 October 2026, with reduced motion as the opt-out. The footer target is about 290px at 390px with 44px tap rows, icons beside the logo, inline wrapping links and two-line meta beside Est. 2026. Store format lines are plain ink Inter, Buy keeps its icon, and Only N left shares the Flint edge/surface while Coming Soon/Repressing retain dashed neutral boxes.

No dedicated Codex implementation is identified. Claude owns UI, UI tests and DESIGN.md updates; verification, final pnpm validate and the coordinated UAT push remain shared tasks.

## Acceptance not claimed

This is planning validation, not implementation or browser acceptance. The supplied audit measured Local fixtures; revised geometry, native-link fallback, automatic motion eligibility and footer wrapping still require implementation verification. Full `pnpm validate` is deferred to integration because its local formatter can modify unrelated dirty files in the shared checkout. No PRD promotion or Content Publication is implied.

# Implementation validation (Claude, UI)

Recorded 15 October 2026 on `main` at `42f4c2e7` plus the uncommitted C3 tree. Final `pnpm validate`: PASSED, `mode: local`, source fingerprint `384f1788240601fbfd3724bfebdf12e7ed2ffb701a4d883e93a555ad2255dbc1` (37 files, before = after), summary `.codex-artifacts/validation/2026-10-15T18-36-31-997Z-48672-68ad63/summary.json`. Product Environment: Local, Astro dev with `BLACKBOX_PREORDER_PROJECTION=e2e/preorder-projection.json` and stubbed listing reads; no UAT or PRD claim.

## Measured at 390×844 (before → after)

- Home pre-order chapter (photo chapter): 1211 → 887px; media 358×201 inside x=16..374; Pre-order and Listen 171×44 each, 16px apart, under the price.
- Releases featured: lead 1042 → 795px, supporting 1093 → 820px, catalog 660 → 621px; pair 12px under the cover; desktop lead row 547 → 496px with the 464px cover.
- Footer: 417 → about 301px at 390px; the sitemap fills three fixed 44px rows down three columns, so no link sits alone on a row for any count from four up (eight links locally; seven on the production fixture, where Privacy information is gated on approved purchase information). DOM and reading order stay the sitemap order; the visual order runs down each column. Top rule at the gutters.
- Artist count: 106×82 box → 28px inline line. Swipe rows clipped at x=16..374, next News card peeks about 42px; dots 44×44.
- No horizontal overflow at 390 or 1440 on Home, Releases or Artists.

## Checks

- Unit: web-store, web-pages, web-editorial, web-layouts, web-artists, app-shell, ui-foundation, storefront-catalog and commerce-web-integration pass through `pnpm validate`; updated `_releases-page-layout`, `StorePreorderShowcase`, `homepage-hero-css`, `swipe-row-dots`, and added the inline-count test in `_artist-roster-layout`.
- e2e (each spec alone, all projects): release-merchandising 45/46 then the failing Firefox case 2/2 after a test fix (adds the phone summary disclosure case), home-preorders 16/16, home-swipe-rows 8/8, catalog-video-contact 14/14, shell-navigation 49/51 then the footer case 2/2 after a test fix (it covers 390, 320 and 125% text), player-continuity 12/12, routes 65/65, home-hero-film 4/4, public-image-fallback 3/3, availability-alerts 6/6, international-order-item 5/5.
- `pnpm openspec -- validate mobile-layout-rhythm --type change --strict`: valid. `pnpm format:check`: clean.

## Not established

- Film chapter on phones: the earlier Local fixture had no pre-order film, so Watch and film-tools layout were not rendered; that evidence does not verify the new phone film-strip composition.
- 3.3 stress (long content, data saving, refused media) and a visual comparison beyond the 390/1440 screenshots; the eager JavaScript budget (`pnpm performance:bundles`) needs the production build CI runs. The Home showcase gained one wrapper element.
- 3.4 Graphify refresh and the combined F1–F22 review; 3.6 UAT release belongs to the coordinator.

## Release evidence (15 October 2026)

- Commits on `main`: 406bb6e7 (changes), 5b94b7a4 (C1 control family and accent roles), b464302c (C2 store browse plus a 1.3 KiB Store item bundle trim), 72caf965 (C3 phone rhythm plus three CI fixes), 7a8595a5, 45fbe628, 171db02d and c26c1c97 (footer row layout: cascade-independent, column-major with three fixed rows, labels may break at 200% text), 50ab409d and b94498e1/6bddcc08 (UAT smoke: Distro expectation and transient fetch retry), 42f4c2e7 (formatting).
- Release BlackBox run 38795987848 for c26c1c97: check-candidate tests, lint and typecheck, build-uat, all four e2e shards, e2e-webkit and both staff previews green; deploy-uat green on a rerun after the Store Durable Object identity lagged one deploy behind (propagation after back-to-back deploys, not a code change). UAT serves c26c1c97 at https://blackbox-records-web-uat.pages.dev/ behind Cloudflare Access.
- Earlier runs for 5b94b7a4 (Store item eager graph 37 bytes over its 104 KiB budget), b464302c (footer rows, Distro smoke expectation), 72caf965, 50ab409d, 6bddcc08 and 171db02d (footer rows on the seven-link fixture, then horizontal overflow from an unbreakable label) were red for the reasons fixed by the commits above.
- Local evidence: each implementation session ended with a passing `pnpm validate`; the named e2e specs ran one by one against the Local site. Not established here: visual acceptance on UAT by the owner and designer, the film-chapter automatic playback rules on phones (no film chapter in Local content), and PRD promotion (out of scope).

## Palette revision (16 October 2026)

Mirrored the approved palette from DESIGN.md and the implementer's gray-notes.md into this change and its two active siblings. Flint replaces the superseded purchase/editorial accent throughout: 800 #4d595c hover/pressed, 700 #626e72 purchase faces and edges, 500 #889396 text and underlines, 300 #c1cbce hover/form-error text, and rgba(98,110,114,.16) surface. The cool gray uses OKLCH hue 215 and chroma 0.012 to 0.016; #f5f5f5 on Flint 700 is 4.82:1, and Flint 500 on #141414 is 5.84:1 and darker than muted #b3b3b3. Sea Green is unchanged; the owner's 16 October 2026 decision assigns Listen and small marks to amber #e3b56c, the In player label to #f0d7b0 and focus/hover/session surfaces to rgba(227, 181, 108, 0.16).

The shared accent-colour-roles delta now requires error red only for international restriction notices in the non-Greek buyer flow: item page notice, Store strip, cart drawer and checkout card. Error 700 #bc4945 edges and 500 #e4706a icons/text remain on Charcoal faces; rgba(188,73,69,.16) is defined but unapplied. No control has a red face, and form errors remain Flint 300 beside the visible Error label.

This is documentation-only synchronization. Earlier implementation and release evidence keeps its recorded source scope; no new browser, provider or release acceptance is claimed. Existing implementation task states are preserved.

- Guard: `pnpm openspec:guard` PASS before editing.
- Strict validation: `pnpm openspec -- validate mobile-layout-rhythm --type change --strict` PASS; both sibling changes also pass.
- Palette search: no superseded accent name, token or hex/surface value remains in the three active changes.
- Scoped formatting: `pnpm format:check` PASS on the 18 files listed for this revision.
- Scope: only those 18 OpenSpec files were edited; no direct Git commands, source changes, implementation tests, publication or deployment were performed. Excluded files, archive and product copy were left untouched.

## 16 October 2026 — round-2 owner decisions

The owner knowingly removed the Home pre-order chapter's manual motion control on every viewport after the round-1 accessibility retention decision, with reduced motion as the opt-out. Commit ee0c6239 is on main and already on PRD releases 601/602. Playback pauses automatically unless at least 15% of the chapter is in view, the tab is visible, no shell music session exists and the full video is not playing; reduced motion and data saving keep the poster. For phones below 48rem the owner chose the film strip from three UAT drafts (sleeve-led card, film strip, swipe row): an opening 16:9 prepared-film band for video releases, with exactly one corner 44px icon-only Watch full video control and no other overlay. Artist, title, format and price row, status line, equal-half 44px Sea Pre-order and amber Listen pair, international notice line and terms link follow beneath. A clip without prepared film uses its poster, else the band photo, with Watch; no clip uses the band photo without Watch; neither clip nor band photo uses a 160px sleeve beside artist, title and price instead of a band. Desktop composition is unchanged. The supplied two-chapter before heights are 2033px (photo) / 2083px (film), and the draft measured 1158px; final measured heights and new-layout verification have not been supplied. Tasks 1.2 and 1.3 are reopened for that evidence; no new task is ticked.

The footer target is approximately 200px at 390px (supplied measurement 198px): logo/socials on one 44px row, tagline in two 12px lines, eight links in four columns of two 44px rows filled column-first, and one 12px sentence-case meta line including Est. 2026. Artists uses two columns from 360px with tighter padding and retained 3:4 photos (390px page height 3065→1583px); the existing artist-roster-presentation delta now includes that contract. Releases gaps/padding tighten (2748→2556px). These comparisons are intrinsic-layout observations, not fixed heights.

This section supersedes earlier composition notes where they conflict. Measurements are supplied by the UI implementer, not newly measured in this documentation/test pass. Round-2 UI verification tasks are reopened where the acceptance target changed; prior release evidence does not accept the new revision. The owner chose pre-redesign amber for Listen and small marks on 16 October 2026: --amber-500 #e3b56c for resting/hover edges, equalizer bars and small marks; --amber-300 #f0d7b0 for the In player label; --amber-surface rgba(227, 181, 108, 0.16) for focus rings, Listen hover and In player surfaces. --listen-bars and --listen-edge are var(--amber-500); --listen-text is var(--amber-300). No publication or deployment is authorized by this synchronization.

The isolated unknown-offer presentation test uses an October 2099 release fixture because its selector accepts no injected clock; its stock/pre-order/buying assertions retain their intent. The focused test command passed. Guard passed before edits; strict change validation, changed-file formatting and the single final pnpm validate run are recorded in this pass's completion evidence under .codex-artifacts/round2-non-ui-20261016/.

## Round-2 release evidence (16 October 2026)

- Commits pushed to `main` on 16 October 2026: fcec1139 (`feat(web): round 2 of the redesign with amber for Listen and small marks`), 9f7cf59d (`test(web): pin the unknown-read fixture to a future release date`) and 8d8070f8 (`docs(openspec): mirror the round-2 revision and the amber decision`).
- Release BlackBox run 38834495816 (`push`, `main`) passed on its first attempt, with no rerun: build-uat, check-candidate (lint, tests, typecheck), e2e shards 1–4, e2e-webkit, staff-previews (Chromium, Firefox) and deploy-uat all green. UAT at https://blackbox-records-web-uat.pages.dev/ serves 8d8070f8.
- Local evidence before the push: `pnpm validate` PASSED; summary `.codex-artifacts/validation/2026-10-16T01-17-09-566Z-55044-36bc53/summary.json`. `pnpm test:e2e e2e/home-swipe-rows.spec.ts` passed 8/8 across Chromium, Firefox and WebKit with the amber dot colour. Scoped Vitest over src/styles, src/pages, src/components/editorial and src/components/ui passed 35 files and 196 tests.
- A computed-style scan of Home, Store, Releases, Artists, News and Services on the Local static site found no retired accent colour; all four Listen colours computed to the chosen amber values. Local renders at 390 and 1440 (Home, Home pre-order, Releases featured, Artists first screen, Store card and first screen, footer) show amber on Listen edges and bars, date and catalog lines, Artists dates and the footer Est. line.
- Not verified: In player was not rendered; its token resolves to #f0d7b0. The owner's visual review of UAT remains open. This record uses the supplied release evidence; it does not extend that evidence to unlisted measurements, states or checks.
- PRD promotion (16 October 2026): the owner requested the round-2 release on PRD. "Promote UAT to PRD" run 38877033839 (`workflow_dispatch` on `main`, dispatched by the orchestrator at 08:56 UTC) succeeded on its first attempt. It resolved the release served by UAT (8d8070f8, push run 38834495816), rebuilt PRD from it, passed the Pages credential check and PRD mutation preconditions, applied PRD migrations, and deployed the PRD Workers and Pages. "Verify the deployed PRD release" passed (`verify-worker prd` and `verify-hosted prd`). The promotion carried no catalog mutation and ran no browser suite; it establishes no browser, shopper checkout, catalog or launch acceptance. Shopper checkout and the apex launch retain their own controls; launch cutover is scheduled separately for 13:30 Athens on 16 October under `openspec/changes/launch-switch-day`.

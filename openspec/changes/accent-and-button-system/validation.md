# Planning validation

Revision: 15 October 2026, after the orchestrator's eight decisions. This record supersedes the initial planning fingerprints and task counts.

## Home Soft edge preparation (19 October 2026)

The user approved the Soft edge implementation plan. Its Home-only scope and exact desktop/touch motion are recorded in proposal.md, design.md, the public-controls and store-preorders deltas, and six unchecked tasks in tasks.md section 4. Historical task counts and acceptance below retain their original source scope. Claude retains ownership of the UI, DESIGN.md and UI tests; implementation has not started in this preparation pass.

- Checkout: `C:/Users/SVall/WebstormProjects/blackbox-records`, `main`, base `90497615bba79a04fdce57b28ebb4f0135fe3e90`.
- Guard: `pnpm openspec:guard` PASS before edits.
- Strict validation: `pnpm openspec -- validate accent-and-button-system --type change --strict` PASS.
- Scoped Prettier check: PASS for the five revised planning artifacts and the Claude handoff; this validation note is checked again after recording results.
- Preservation: all ten pre-existing modified tracked files and five implementation inputs match their captured SHA-256 values. `git diff --check` PASS.
- Reference: the approved canvas's Soft edge variant, SHA-256 `d240d0b3476dad5f81aa1b626dd45950fd2f53ea62a229ef59f7bc88ca6a1f73`; its default Slow fill selection is superseded by the user's explicit Soft edge choice.
- Local handoff and baseline: `.codex-artifacts/home-preorder-soft-edge/claude-handoff.md` and `baseline.json`. Expected implementation return: `claude-return.md` in the same directory. These are ignored local coordination artifacts; the durable behavior and task state remain in this change.

This pass establishes planning validation only. UI/module tests, browser observations/screenshots, player continuity, Graphify refresh after the code batch and final `pnpm validate` remain pending with implementation. The prototype's evidence does not establish production-page acceptance. No commit, push, deployment or publication was performed; physical-phone and Safari acceptance remain unverified.

## Home Soft edge implementation (19 October 2026)

The owner explicitly assigned this slice to Codex after the preparation handoff. Codex implemented the Home-only decorative layer and local press lifecycle, updated DESIGN.md and the focused tests, and retained Store/Releases behavior. The historical Claude handoff is superseded. Work remains local on main; no staging, commit, push, deployment or publication is authorized.

The face/line use the approved 385ms/700ms desktop entry, 455ms exit and 220ms/180ms touch treatment. The label and drawn target stay stationary; the shared touch halo and focus outline remain intact. CSS owns all animation frames. Only a primary touch or non-hover/coarse press release can schedule the component-local hold timer, and reduced motion, cancellation, departure, blur, repeated presses and unmount clear it without intercepting native activation.

Cold shell entry exposed an existing integration gap: pages that never registered Astro's idle directive could leave the showcase inert. Home now uses the existing load directive while retaining its complete server HTML. The shell/player delta and existing projection source guard record that decision. The continuity fixture now waits for the lazy header and its initial focus before interacting with the provider iframe; this avoids racing header autofocus without changing production player behavior.

- Product Environment: Local. Selected acceptance: public presentation/motion and shell/player continuity. Commerce authority, provider integration, content publication and release acceptance are outside this decorative change.
- Implementation source hashes: `.codex-artifacts/home-preorder-soft-edge/implementation-source.json`. Base SHA remains `90497615bba79a04fdce57b28ebb4f0135fe3e90`; all ten pre-existing tracked modifications are preserved by SHA-256.
- Module checks passed: `pnpm test web-store`, `pnpm test ui-foundation`, `pnpm test storefront-catalog` and `pnpm test web-pages`. SSR checks verify no timer scheduling or network reads; the source-wide setTimeout ban has been removed.
- Home browser acceptance: **70/70 passed** across chromium-desktop, chromium-mobile, firefox-desktop, firefox-compact and webkit-mobile. The combined run recorded 81 passes and one WebKit player-fixture navigation failure: a footer-to-Home tap reached another Store Item. The Home cases and their covered source remained unchanged. `.codex-artifacts/home-preorder-soft-edge/home-browser-evidence.json` records their per-case results and matching source hashes; `combined-first-summary.json` and `combined-first-results/` retain the original report and screenshots.
- Final player-continuity acceptance: **12/12 passed**, no retries/skips, with `pnpm test:e2e e2e/player-continuity.spec.ts --workers=1`, after using the fixed header Home link and explicitly awaiting the Home route in that setup. The original iframe stays connected across Home pre-order activation and Store Item/information navigation. Evidence: `.codex-artifacts/home-preorder-soft-edge/continuity-summary.json`. Interim failed/interrupted runs do not establish acceptance.
- Rendered checks cover 320, 390, 768 and 1440px at normal text size, with 200% root text at 1440px. Purchase labels remain readable, the normal drawn height is 44px, paired controls keep equal width and there is no page overflow in that matrix. Targets enlarge with desktop text zoom. Exploratory 200% root text at 320px still exposes **79px** of existing hero/chapter layout overflow outside the changed motion; phone text zoom is not fully accepted. Metrics: `.codex-artifacts/home-preorder-soft-edge/visual-metrics.json`. Inspected screenshots: `chapter-320.png`, `chapter-390.png`, `chapter-768.png`, `chapter-1440.png`, `desktop-soft-edge.png`, `chapter-1440-text-200.png` and `chapter-320-text-200-limit.png` in that directory.
- `graphify update .` PASS after the final implementation batch; `.codex-artifacts/home-preorder-soft-edge/graphify.log` records its local AST refresh. Existing extractor limits remain: SQL parser unavailable, one partially parsed workflow-contract test and unsupported/data-only files; no semantic/paid enrichment was used.
- Strict OpenSpec validation and `git diff --check` PASS. Initial implementation gate: `pnpm validate` PASS, mode `local`, `.codex-artifacts/validation/2026-10-19T09-01-28-886Z-41088-097c37/summary.json`, matching before/after fingerprint `63633fa4d115b1fe1f60c921f623628d922e19a55f15ec4b455bdcea1f48df13`. Later record-only edits are covered by the final rerun pointer in `.codex-artifacts/home-preorder-soft-edge/final-validation.json`.
- Stable code/test/design fingerprint: `766e94205db7db945c1d2593e7356974f139dd098e3529f2b43504a0261b278e` across the eight inputs in `.codex-artifacts/home-preorder-soft-edge/evidence.json`, hashing sorted relative-path/file-SHA256 lines joined with LF. That receipt also links all browser, visual and remaining-limit evidence. The final validation pointer records the whole final tree's source identity after this note and task-state update.
- Physical-phone, actual Safari, real-provider and hosted acceptance remain unverified. WebKit mobile emulation is engine evidence only.

## Authoring checks

- Task counts: Claude (UI): 11; Codex (non-UI): 0; shared: 6 (17 total). All implementation checkboxes remain unchecked.
- Guard: `pnpm openspec:guard` passed before this revision.
- Strict validation: PASS with `pnpm openspec -- validate accent-and-button-system --type change --strict`.
- Scoped formatting: PASS across the three change folders.
- Planning-artifact SHA-256 fingerprint: `4bba77b00a774f6c87aa7298e351fba83767e7fa1c8d0a52099b82758fe069c2` across 12 files, hashing sorted relative-path/file-SHA256 lines joined with LF; validation.md is excluded.
- F1–F22 coverage is retained. C2/C3 still depend on C1.
- Edits are limited to the three named OpenSpec change directories. No direct Git commands, source edits, implementation tests, publication or deployment are part of this pass.
- Preservation check: all 17 protected files retain their pre-revision SHA-256 values.

## Decisions verified in the revised plan

Catalogue order stays as implemented: All places BlackBox releases first by catalog number, then Distro by artist. Existing Distro format links and their Distro counts only move; the no-JavaScript fallback remains reachable. The purchase note stays above the grid. No new order control, facets, counts or data/projection work remains.

Home film chapters retain a 44px phone pause/resume icon; the removal request is recorded as a declined accessibility deviation. The footer target is about 290px at 390px with 44px tap rows, icons beside the logo, inline wrapping links and two-line meta beside Est. 2026. Store format lines are plain ink Inter, Buy keeps its icon, and Only N left shares the Flint edge/surface while Coming Soon/Repressing retain dashed neutral boxes.

No dedicated Codex implementation is identified. Claude owns UI, UI tests and DESIGN.md updates; verification, final pnpm validate and the coordinated UAT push remain shared tasks.

## Acceptance not claimed

This is planning validation, not implementation or browser acceptance. The supplied audit measured Local fixtures; revised geometry, native-link fallback, pause interaction and footer wrapping still require implementation verification. Full `pnpm validate` is deferred to integration because its local formatter can modify unrelated dirty files in the shared checkout. No PRD promotion or Content Publication is implied.

## Release evidence (15 October 2026)

- Commits on `main`: 406bb6e7 (changes), 5b94b7a4 (C1 control family and accent roles), b464302c (C2 store browse plus a 1.3 KiB Store item bundle trim), 72caf965 (C3 phone rhythm plus three CI fixes), 7a8595a5, 45fbe628, 171db02d and c26c1c97 (footer row layout: cascade-independent, column-major with three fixed rows, labels may break at 200% text), 50ab409d and b94498e1/6bddcc08 (UAT smoke: Distro expectation and transient fetch retry), 42f4c2e7 (formatting).
- Release BlackBox run 38795987848 for c26c1c97: check-candidate tests, lint and typecheck, build-uat, all four e2e shards, e2e-webkit and both staff previews green; deploy-uat green on a rerun after the Store Durable Object identity lagged one deploy behind (propagation after back-to-back deploys, not a code change). UAT serves c26c1c97 at https://blackbox-records-web-uat.pages.dev/ behind Cloudflare Access.
- Earlier runs for 5b94b7a4 (Store item eager graph 37 bytes over its 104 KiB budget), b464302c (footer rows, Distro smoke expectation), 72caf965, 50ab409d, 6bddcc08 and 171db02d (footer rows on the seven-link fixture, then horizontal overflow from an unbreakable label) were red for the reasons fixed by the commits above.
- Local evidence: each implementation session ended with a passing `pnpm validate`; the named e2e specs ran one by one against the Local site. Not established here: visual acceptance on UAT by the owner and designer, the film-chapter pause control on phones (no film chapter in Local content), and PRD promotion (out of scope).

## Palette revision (16 October 2026)

Mirrored the approved palette from DESIGN.md and the implementer's gray-notes.md into this change and its two active siblings. Flint replaces the superseded purchase/editorial accent throughout: 800 #4d595c hover/pressed, 700 #626e72 purchase faces and edges, 500 #889396 text and underlines, 300 #c1cbce hover/form-error text, and rgba(98,110,114,.16) surface. The cool gray uses OKLCH hue 215 and chroma 0.012 to 0.016; #f5f5f5 on Flint 700 is 4.82:1, and Flint 500 on #141414 is 5.84:1 and darker than muted #b3b3b3. Sea Green is unchanged; the owner's 16 October 2026 decision assigns Listen and small marks to amber #e3b56c, the In player label to #f0d7b0 and focus/hover/session surfaces to rgba(227, 181, 108, 0.16).

The shared accent-colour-roles delta now requires error red only for international restriction notices in the non-Greek buyer flow: item page notice, Store strip, cart drawer and checkout card. Error 700 #bc4945 edges and 500 #e4706a icons/text remain on Charcoal faces; rgba(188,73,69,.16) is defined but unapplied. No control has a red face, and form errors remain Flint 300 beside the visible Error label.

This is documentation-only synchronization. Earlier implementation and release evidence keeps its recorded source scope; no new browser, provider or release acceptance is claimed. Existing implementation task states are preserved.

- Guard: `pnpm openspec:guard` PASS before editing.
- Strict validation: `pnpm openspec -- validate accent-and-button-system --type change --strict` PASS; both sibling changes also pass.
- Palette search: no superseded accent name, token or hex/surface value remains in the three active changes.
- Scoped formatting: `pnpm format:check` PASS on the 18 files listed for this revision.
- Scope: only those 18 OpenSpec files were edited; no direct Git commands, source changes, implementation tests, publication or deployment were performed. Excluded files, archive and product copy were left untouched.

## 16 October 2026 — round-2 owner decisions

Flint now also supplies tinted neutrals: 400 #abb5b8 replaces #b3b3b3 muted-foreground; 850 #262c2e replaces #2b2b2b edges/borders; 900 #212729 replaces #262626 border/input; 950 #1a2022 replaces #1f1f1f quiet edges. Store search and Grid/Crate frames use Flint 700; inactive navigation uses Flint 400. Grounds, ink, Flint, Sea and restriction-only error red remain unchanged. The owner chose pre-redesign amber for Listen and small marks on 16 October 2026: --amber-500 #e3b56c for resting/hover edges, equalizer bars and small marks; --amber-300 #f0d7b0 for the In player label; --amber-surface rgba(227, 181, 108, 0.16) for focus rings, Listen hover and In player surfaces. --listen-bars and --listen-edge are var(--amber-500); --listen-text is var(--amber-300).

This section supersedes earlier composition notes where they conflict. Measurements are supplied by the UI implementer, not newly measured in this documentation/test pass. Round-2 UI verification tasks are reopened where the acceptance target changed; prior release evidence does not accept the new revision. The owner chose pre-redesign amber for Listen and small marks on 16 October 2026: --amber-500 #e3b56c for resting/hover edges, equalizer bars and small marks; --amber-300 #f0d7b0 for the In player label; --amber-surface rgba(227, 181, 108, 0.16) for focus rings, Listen hover and In player surfaces. --listen-bars and --listen-edge are var(--amber-500); --listen-text is var(--amber-300). No publication or deployment is authorized by this synchronization.

The isolated unknown-offer presentation test uses an October 2099 release fixture because its selector accepts no injected clock; its stock/pre-order/buying assertions retain their intent. The focused test command passed. Guard passed before edits; strict change validation, changed-file formatting and the single final pnpm validate run are recorded in this pass's completion evidence under .codex-artifacts/round2-non-ui-20261016/.

## Hero CTA release evidence (16 October 2026)

- Button commit 3e8ee282 (`feat(web): a smaller, lower Browse the Store hero button`) passed Release BlackBox run 38883399182 with all jobs green, including deploy-uat. "Promote UAT to PRD" run 38884188819 succeeded from 09:59 to 10:01 UTC on 16 October 2026; PRD release.json names 3e8ee282 with run 38883399182.
- The orchestrator verified in a PRD browser that the hero button renders 48px tall with an 18px label and a 40px gap below the tagline at phone widths, and that the film plays with the still hidden. This records the orchestrator's check, not the owner's visual review.
- Local evidence before the push: `pnpm validate` PASSED; the button unit test passed; home-hero-film e2e passed 7/7 and home-preorders passed 16/16. Home-touch-prefetch was 3/4: the failing chromium-mobile news-overlay tap fails identically on the committed code and is a pre-existing preview-only failure; this suite is not recorded as passing. Task 1.5 is checked against this supplied evidence.

## Round-2 release evidence (16 October 2026)

- Commits pushed to `main` on 16 October 2026: fcec1139 (`feat(web): round 2 of the redesign with amber for Listen and small marks`), 9f7cf59d (`test(web): pin the unknown-read fixture to a future release date`) and 8d8070f8 (`docs(openspec): mirror the round-2 revision and the amber decision`).
- Release BlackBox run 38834495816 (`push`, `main`) passed on its first attempt, with no rerun: build-uat, check-candidate (lint, tests, typecheck), e2e shards 1–4, e2e-webkit, staff-previews (Chromium, Firefox) and deploy-uat all green. UAT at https://blackbox-records-web-uat.pages.dev/ serves 8d8070f8.
- Local evidence before the push: `pnpm validate` PASSED; summary `.codex-artifacts/validation/2026-10-16T01-17-09-566Z-55044-36bc53/summary.json`. `pnpm test:e2e e2e/home-swipe-rows.spec.ts` passed 8/8 across Chromium, Firefox and WebKit with the amber dot colour. Scoped Vitest over src/styles, src/pages, src/components/editorial and src/components/ui passed 35 files and 196 tests.
- A computed-style scan of Home, Store, Releases, Artists, News and Services on the Local static site found no retired accent colour; all four Listen colours computed to the chosen amber values. Local renders at 390 and 1440 (Home, Home pre-order, Releases featured, Artists first screen, Store card and first screen, footer) show amber on Listen edges and bars, date and catalog lines, Artists dates and the footer Est. line.
- Not verified: In player was not rendered; its token resolves to #f0d7b0. The owner's visual review of UAT remains open. This record uses the supplied release evidence; it does not extend that evidence to unlisted measurements, states or checks.
- PRD promotion (16 October 2026): the owner requested the round-2 release on PRD. "Promote UAT to PRD" run 38877033839 (`workflow_dispatch` on `main`, dispatched by the orchestrator at 08:56 UTC) succeeded on its first attempt. It resolved the release served by UAT (8d8070f8, push run 38834495816), rebuilt PRD from it, passed the Pages credential check and PRD mutation preconditions, applied PRD migrations, and deployed the PRD Workers and Pages. "Verify the deployed PRD release" passed (`verify-worker prd` and `verify-hosted prd`). The promotion carried no catalog mutation and ran no browser suite; it establishes no browser, shopper checkout, catalog or launch acceptance. Shopper checkout and the apex launch retain their own controls; launch cutover is scheduled separately for 13:30 Athens on 16 October under `openspec/changes/launch-switch-day`.

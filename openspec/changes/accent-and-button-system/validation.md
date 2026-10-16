# Planning validation

Revision: 15 October 2026, after the orchestrator's eight decisions. This record supersedes the initial planning fingerprints and task counts.

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

## Round-2 release evidence (16 October 2026)

- Commits pushed to `main` on 16 October 2026: fcec1139 (`feat(web): round 2 of the redesign with amber for Listen and small marks`), 9f7cf59d (`test(web): pin the unknown-read fixture to a future release date`) and 8d8070f8 (`docs(openspec): mirror the round-2 revision and the amber decision`).
- Release BlackBox run 38834495816 (`push`, `main`) passed on its first attempt, with no rerun: build-uat, check-candidate (lint, tests, typecheck), e2e shards 1–4, e2e-webkit, staff-previews (Chromium, Firefox) and deploy-uat all green. UAT at https://blackbox-records-web-uat.pages.dev/ serves 8d8070f8.
- Local evidence before the push: `pnpm validate` PASSED; summary `.codex-artifacts/validation/2026-10-16T01-17-09-566Z-55044-36bc53/summary.json`. `pnpm test:e2e e2e/home-swipe-rows.spec.ts` passed 8/8 across Chromium, Firefox and WebKit with the amber dot colour. Scoped Vitest over src/styles, src/pages, src/components/editorial and src/components/ui passed 35 files and 196 tests.
- A computed-style scan of Home, Store, Releases, Artists, News and Services on the Local static site found no retired accent colour; all four Listen colours computed to the chosen amber values. Local renders at 390 and 1440 (Home, Home pre-order, Releases featured, Artists first screen, Store card and first screen, footer) show amber on Listen edges and bars, date and catalog lines, Artists dates and the footer Est. line.
- Not verified: In player was not rendered; its token resolves to #f0d7b0. The owner's visual review of UAT remains open. This record uses the supplied release evidence; it does not extend that evidence to unlisted measurements, states or checks.

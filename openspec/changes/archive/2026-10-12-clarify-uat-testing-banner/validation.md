# Validation

## Scope and source

Implementation on main, starting at `0e79351e996de90e0edbd3b4c9049ae7605088d4`. User approved the banner in English, then requested a slightly shorter height and a local commit only. No hosted changes, push, or deployment.

Product Environment: Local with UAT presentation flags, using temporary public and Staff development servers at ports 4331 and 4332. Acceptance rows: shell/player/routing and Staff/editor. Provider, commerce-authority, content-publication, and release acceptance are outside this presentational change.

## Observed behavior

- Chrome extension, blackbox profile: both desktop banners measured approximately 44px high after the user refinement (previously 60px).
- Both banners wrap at 320px width, approximately 115px high, without document horizontal overflow. Text and production links remain readable. The existing Staff navigation is crowded at that width; the banner does not change its horizontal layout.
- Public Home, Releases, and Artists retain one banner and `[UAT]` titles through shell navigation. Public mobile navigation begins below the measured header. Scrolling retains the fixed header.
- Bandcamp player opened, accepted interaction, minimized, survived Releases-to-Artists navigation, reopened, minimized again, and stopped. Stopping removed the iframe. Full-screen player overlays retain their existing stacking above the header. No public browser console errors were observed.
- Staff links to production Staff; public links to production public. Both open a new tab. No production links were activated during testing.
- Non-UAT public HTML was checked with the flag set to `false`: no banner or `[UAT]` prefix, and the original fixed `h-[var(--header-height)]` header. Explicitly passing the UAT boolean prevents Astro's empty conditional slot from changing non-UAT header sizing.
- Non-UAT Staff build output contains neither the banner nor `[UAT]` prefix. Staff environment tests cover mock, UAT, and PRD.
- The standalone Staff preview has no local backend attached; its publication/order loading errors do not establish CMS acceptance. The separate editor suite covers its local fixtures. Hosted behavior and explicit 200% browser zoom remain unverified.

## Checks and evidence

- StaffShell environment tests: 3 passed.
- Environment-model and UAT static-smoke tests: 6 passed with the backend Node Vitest configuration.
- Release-candidate tests: 14 passed.
- App-shell tests: 42 files, 192 tests passed.
- Environment-model verification and strict OpenSpec change validation passed.
- Intermediate `pnpm validate`: passed in 115.4s, mode `local`, at `.codex-artifacts/validation/2026-09-28T07-12-11-477Z-60004/summary.json`; before/after fingerprint `dc222424e4133a143faeb122cb8fc2c40e6e069f7c6e7b6023f577badc01843b`. This predates the height refinement and empty-slot correction, so it is not final evidence.
- An earlier editor run passed build, preview policy, Chromium, and Firefox, but its overall result was invalidated by concurrent source changes. It is not reused as final acceptance.
- The refined implementation passed all editor phases with matching before/after fingerprint `7a911f13f0f43c7e191bc3e2e517b97d38403ca5a1dccfa86b3d32ed8bb6130f` at `.codex-artifacts/validation/2026-09-28T07-30-06-397Z-11432/summary.json` (mode/status `partial`, editor-only). Subsequent tracked edits only complete this evidence and task checklist.
- The first repository validation attempt after refinement encountered a formatter process crash, exit `3221225477`, after reporting all files formatted. It cancelled the tests lane, with no application assertion failure. That failed run is `.codex-artifacts/validation/2026-09-28T07-37-34-949Z-95728/summary.json`; final completion requires a successful retry.
- Final source-matched editor and local validation summaries are recorded in ignored `.codex-artifacts/uat-testing-banner/final-verification.json`, including source SHA and before/after fingerprints. This pointer is written after checks without changing the tracked tree.

Graphify was queried for architecture, followed by CodeGraph source/callers. Broad Graphify truncation was resolved with a focused `explain HeaderShell.astro`; local AST refresh reported existing Astro parser limitations. No semantic enrichment was run.

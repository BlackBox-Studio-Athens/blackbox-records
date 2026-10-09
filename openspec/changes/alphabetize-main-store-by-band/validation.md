# Validation

## Source and environment

- Prepared on `main`, source SHA `258d41b87647c4f3549301e68d215fe96c97089a`, with this change uncommitted.
- Product Environment: Local, `http://127.0.0.1:4321/blackbox-records/`, normal stripe-mock stack and its retained accepted catalog.
- The existing stack served a compiled renderer from before the edit. The user explicitly approved its restart; the rebuilt renderer served the new alphabetical order. The restarted stack remains running.
- The three changed production files have matching before/after browser SHA-256 hashes in `.codex-artifacts/store-alphabetical/browser-source-before.json` and `browser-source-after.json`. Browser observations are recorded in `browser-results.json` beside them.

## Repository checks

- `pnpm openspec:guard`: passed in the primary checkout.
- `pnpm test apps/web/src/lib/store-collection.test.ts`: passed the selected eight affected projects, including existing normalization, title/slug ties, copy-before-sort and duplicate checks.
- `pnpm test apps/web/src/layouts/StoreCollectionPage.test.ts`: passed the two selected affected projects.
- `pnpm openspec -- validate alphabetize-main-store-by-band --type change --strict`: passed.
- `graphify update .`: completed once after the code batch; refreshed 25,146 nodes and 40,109 edges without semantic extraction.
- `pnpm validate`: passed in Local mode. The initial reviewed summary is `.codex-artifacts/validation/2026-10-08T18-31-34-046Z-5264-4495c4/summary.json`, with matching before/after fingerprint `e0b9f3dbb2b9bc96ac57d37f092f1928cd1180647f52284145d1621998f36605` and no source changes during the run.
- The final completed-tree summary, source fingerprints and status are retained in `.codex-artifacts/store-alphabetical/final-validation.json`. This ignored pointer avoids changing the validated tree to update its own evidence.

## Browser acceptance

Playwright CLI checked the rebuilt Local renderer at 1440px and 390px. Both widths passed:

- All 101 canonical items appear once in artist/band A–Z order, with title and slug ties. Distro's Adolf plays the Jazz precedes BlackBox's Afterwise; Chronoboros precedes Ouranopithecus rather than retaining release-date priority.
- Grid and optional Coverflow keep the same sequence. Artist and text filters, their intersection, and clearing filters preserve that sequence and restore the complete catalog.
- All → BlackBox Releases → All navigation preserves a document sentinel and the complete sequence; a second visit verifies cached shell restoration.
- Separate JavaScript-disabled contexts expose all 101 items in the same alphabetical order at both widths. Images were intercepted in those contexts to keep this native-navigation check focused on catalog access.

Scoped `e2e/store-formats.spec.ts` checks against the rebuilt renderer passed category keyboard/shell navigation, Distro alphabetical filtering/Coverflow and native no-JavaScript category access. The player-continuity check passed when rerun alone with `--workers=1`.

The initial concurrent run hit a Local 503 on `/store/distro/`: the runtime log reported its 10,000-active-timeout limit. Preserve that observation rather than treating the run as clean: `.codex-artifacts/store-alphabetical/e2e-after-restart.json` and `stack.stderr.log` retain it. The isolated successful retry is `e2e-continuity-retry.json`; no product code was changed between attempts.

## Acceptance boundaries

Public collection browsing and shell/player continuity are accepted locally. CMS/schema, commerce/provider and release acceptance rows are not applicable to this frontend ordering change. No publication, deployment, UAT or PRD operation was performed; Local evidence does not establish hosted acceptance.

# Validation

Implemented on primary `main` in `C:/Users/SVall/WebstormProjects/blackbox-records`, based on source SHA `8d08c00d3dd594951a1ecc463d6c7df512d5742e`. Pre-order detection, labels and promotion remain outside this change.

## Repository evidence

- `pnpm test apps/web/src/lib/store-collection.test.ts`: all eight affected frontend module checks passed. Collection tests cover mixed formats, band/title differences, case and equivalent Unicode, deterministic ties, duplicate guards, primary-format mapping, editorial exclusions and the ten UTC calendar-window boundaries including leap years.
- Search and template checks passed for combined filters, empty results, preserved order, one shared catalog and the four-image eager-loading limit.
- `pnpm openspec -- validate alphabetize-distro-by-band --type change --strict`: passed.
- `graphify update .`: completed locally after the implementation batch; existing unrelated parser warning for `scripts/pages-workflow-contract.test.ts` remains. No semantic enrichment or paid API was used.
- `pnpm validate`: passed in local mode. Initial stable evidence: `.codex-artifacts/validation/2026-10-02T11-29-43-618Z-80956-e8c308/summary.json`, with matching before/after fingerprint `4732ff95e9dd41e5c29a0395a200e29e36ca6f85c965fe023a60b69c4637b176` and the source SHA above. A final run after the last screenshot assertion and these notes is retained in `.codex-artifacts/e2e/distro-final-validation.json`; that copied summary records the final matching source fingerprints and original run path.

## Browser acceptance

Product Environment: Local. Selected acceptance rows: public frontend and shell/player continuity. Commerce interfaces, CMS schema/publication and hosted release gates are unchanged and require no additional mutation for this presentation change.

`pnpm test:e2e e2e/store-formats.spec.ts --workers=1 --output=.codex-artifacts/e2e/distro-test-results`: four checks passed in 47.5 seconds. The report is retained as `.codex-artifacts/e2e/distro-summary.json` to avoid another chat overwriting the shared report.

Observed 101 unique items in one mixed catalog, two recent BlackBox items first, and a case-insensitive band/title/slug-sorted remainder. Browser checks verified format counts and fragments, intersecting format/artist/text filters, promoted items obeying filters, clearing, disabled Coverflow while filtered, explicit Coverflow return, complete Grid after shell restoration, full no-JavaScript browsing and preservation of the same playing iframe through shell navigation and filtering. No page or console errors occurred in the successful run.

The named phone check also passed after adding a card close-up (8.4 seconds). Desktop 1440px and phone 390px screenshots were inspected: format choices and the native artist picker fit, the two-column phone cards retain artwork and release labels, and no horizontal page overflow occurs. Artifacts:

- `.codex-artifacts/e2e/distro-layouts/desktop.png`
- `.codex-artifacts/e2e/distro-layouts/mobile.png`
- `.codex-artifacts/e2e/distro-layouts/mobile-cards.png`
- `.codex-artifacts/e2e/distro-layout-summary.json`

The first enhanced attempt encountered the temporary Astro server's stale dependency optimizer; the compiled normal Local stack resolved it. Concurrent suites briefly collided in the shared Playwright trace directory; the successful run uses a dedicated output directory. Navigation tests now wait for the destination catalog before the next click. Earlier failures are superseded by the passing runs above.

## Runtime and delivery

Coordinated with both active Codex chats before the Local restart. Their temporary release fixture was removed by its owner. Existing Local CMS and commerce state were preserved; startup reported no pending migrations and kept existing stock/prices. The normal mock stack remains running for shared verification. No UAT or PRD publication/deployment occurred.

Promotion uses one reference date per catalog render. Retained static markup keeps its evaluated window until its next build; no scheduler or speculative pre-order integration was added. Focused repository and browser acceptance are complete; hosted provider and release acceptance are not claimed.

# Validation

## Source and environment

Prepared on `main` in the primary checkout, starting from `297705e38e3a17b489b468ee742471a09aac921b`. Acceptance uses the normal Local Stripe-mock stack at `http://127.0.0.1:4321/blackbox-records/` and Local CMS at `http://127.0.0.1:8787`. Repository validation fingerprints and the final run pointer are retained under `.codex-artifacts/validation/` and `.codex-artifacts/news-navigation/`.

## Behavior evidence

- `pnpm test:app-shell`: 45 files and 277 tests passed.
- `pnpm test:e2e e2e/shell-navigation.spec.ts e2e/player-continuity.spec.ts`: 19 passed, 9 skipped by existing desktop/mobile applicability rules. The new checks run on both Chromium projects. Summary: `.codex-artifacts/e2e/summary.json`.
- News is last after Who we are, links to `/news/`, receives the shared current-page state, navigates by keyboard, resets focus/scroll and closes the phone Menu. Article overlays return to the listing. The same player iframe stays connected and can reopen. The existing minimize/reopen, Back/Forward and Stop checks also pass.
- Playwright CLI inspection at 320, 390, 1024 and 1440 px found no clipped links or horizontal overflow; phone targets are 44 px tall. Header/Menu screenshots were visually inspected. Results and screenshots: `.codex-artifacts/news-navigation/layout.json`, `menu-320.png`, `menu-390.png`, `header-1024.png` and `header-1440.png` in that same directory.
- The footer links match the pre-publication list exactly; no News link was added.
- The first layout check sampled the Menu during its opening transition. Its corrected check waits until navigation enters the viewport before measuring; the complete e2e rerun passed.

## Local Content Publication

Only the existing News navigation record `01M2G9GB0DEFDV004RWX317N32` was saved, reviewed and published. It had no unrelated draft. Published values are `order: 6`, `show_in_header: true`, `show_in_footer: false`.

Publication `4215faa8-893b-479d-b864-314620533269` is confirmed live, with accepted snapshot `7532f8ec812fde33afd724c7fb2c9a9d8beb471dc8e4536fb70f215149f708d4`. The review, selected revision, baseline, receipt and public content-version identity are in `.codex-artifacts/news-navigation/publication.json`.

## Repository checks and limits

`pnpm agent:check`, strict OpenSpec validation and the changed-file Prettier check passed. `pnpm validate` passed in `mode: local`, running 24 tasks across 13 affected projects and their dependencies. The passing summary is `.codex-artifacts/validation/2026-10-07T08-40-04-224Z-35496-17255c/summary.json`; it records the matching before/after source fingerprints and no source drift. The final run after completing these tracked notes is linked from `.codex-artifacts/news-navigation/final-validation.json`.

The local AST-only Graphify refresh completed after the final browser-test edit. No semantic enrichment or paid extraction ran.

The shell/player and guidance acceptance rows apply. No commerce, schema, media or provider behavior changed, so their additional acceptance rows do not apply. A manual unmocked Local browser session encountered a 402 from the existing external analytics script; product e2e uses the established analytics stub and reports no console or page errors. No UAT/PRD resources, paid APIs, software release or hosted publication were used. UAT and PRD still require their own separately authorized Content Publication of this navigation entry.

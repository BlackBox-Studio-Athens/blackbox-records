# Catalog layout and ambient motion validation

## Local integration

The change is committed locally and rebased onto `02ec99841c5c447ebe3cdbae1855b0e421fa9fb0`, which matched local main and origin/main after fetching. The rebase retained main's Firefox scroll-lock fix and resolved the shared test insertion by keeping both the upstream backdrop scrolling regression and this change's SSR/artwork regression. A requested fast-forward merge completed before the user deferred merging; local main was restored with `git reset --keep`, preserving all 17 snapshotted uncommitted files. The prepared change remains on `codex/catalog-layout-and-ambient-motion`, pending merge authorization. Source-bound integration checks and current branch identities are recorded in `.codex-artifacts/catalog-repairs/local-integration.json`. The rebased browser run passed 78 of 80 checks; both Firefox failures passed without source changes in a three-check rerun. No push or hosted release occurred.

Prepared in the explicitly authorized worktree at `C:/Users/SVall/.codex/worktrees/26f8/blackbox-records`, based on `426f278bb83cb4c04a93774acb507bc1670ec21f`, which contains released `406adcde53996be693e461ee1fe12c3afe9b37b1`. Product Environment: Local. The primary checkout and other previews were preserved.

## Result

- Home fits the longest title word using loaded Veneer metrics and container width. DISINTEGRATION, including its N, occupies one line at 2120/1440/1024/320/390/430px. LOTUS retains the previous short-title size. Extreme unbroken names retain a readable 32px minimum and balanced wrapping without isolated final letters or horizontal overflow.
- Releases renders accepted editorial roles in SSR. Hydration, shell return, pending/failed reads, cached snapshots and fresh offers retain the same cards, headings and order. Authoritative offers still update purchase eligibility and physical status; accepted digital timing remains independent. An unavailable principal remains in its editorial position with truthful actions. This replaces automatic offer-driven slot replacement.
- Both principal artwork wrappers remain square, aligned independently of copy height, with complete contained covers and no resting or hover crop. Catalog cards retain their established proportions. Supporting titles also fit their copy column.
- Afterwise now uses five performance excerpts across 14.75 seconds and 354 frames. The approved bass and cymbal closeups remain; two short whole-band excerpts come from the active drum passage around those cymbal strikes, and an upper-body drummer closeup adds another view. This replaces the longer quiet wide shot in the previous cut. Gentle stage lighting remains, with 0.75-second transitions and a wrap crossfade. The existing silent playback, visibility/session/manual-pause gating, reduced-motion/data-saving fallback, Watch full video intent, persistent player and Base sweep remain covered by regression checks.

## Checks

| Check                                                                                                     | Result                                                                                                                        |
| --------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `pnpm test web-editorial`                                                                                 | 40 passed, including stable selection and truthful lifecycle states                                                           |
| `pnpm test web-pages` / final affected validation                                                         | 63 passed, including formatted SSR markup contracts                                                                           |
| `pnpm test apps/web/test/assets/check-image-markup.test.ts`                                               | Passed selected image/tooling contracts                                                                                       |
| `pnpm test:e2e e2e/home-preorders.spec.ts e2e/release-merchandising.spec.ts`                              | Earlier layout/title implementation: 78 passed across Chromium and Firefox; retained in `e2e-layout-summary.json`             |
| `pnpm test:e2e e2e/home-preorders.spec.ts --grep 'Prepared Afterwise\|Film titles'`                       | Final performance media: 4 passed against the production build across Chromium and Firefox; none skipped, flaky or unexpected |
| `pnpm test apps/web/src/pages/_preorder-showcase.test.ts`                                                 | Passed `web-pages`; preserves the exact-ID mapping, fallback and 900,000-byte backdrop contract                               |
| `pnpm build:web`                                                                                          | Passed static build, cache policy, brand font, responsive image selection, route isolation and bundle limits                  |
| Home eager JavaScript                                                                                     | 102,556 bytes Brotli (100.15 KiB), below the unchanged 103 KiB limit; other existing bundle gates passed                      |
| `pnpm openspec -- validate fix-catalog-layout-and-ambient-motion --type change --strict --allow-worktree` | Passed                                                                                                                        |
| `graphify update .`                                                                                       | Local AST refresh passed after the edit batch                                                                                 |
| `pnpm validate`                                                                                           | Passed affected unit, lint, type, format and architecture gates with unchanged source during the run                          |
| `git diff --check`                                                                                        | Passed                                                                                                                        |

The implementation validation receipt is `.codex-artifacts/validation/2026-10-06T09-48-37-463Z-50812-16a148/summary.json`, with `mode: local`, `status: passed`, and matching before/after fingerprint `9f850c74cf8be6eb885d16559ea6afa63f9a64220525ac68b52faa46c449641e`. After this note and task-state edits, the [final receipt](../../../.codex-artifacts/catalog-repairs/final-validation.json) records the final summary path, SHA and matching final-tree fingerprints without a self-referential source hash.

Acceptance rows selected from `docs/agent-workflow.md`: public page/visual behavior, shell/player continuity, and asset/performance checks. Hosted provider, checkout, CMS publication, software promotion and shopper-launch acceptance are outside this local repair. No hosted content, stock, provider configuration or release was changed. A local pass does not establish those separate acceptance gates.

## Browser evidence and preview

Chrome GPT extension, Blackbox profile: the refreshed 2120px production preview shows one-line DISINTEGRATION over the revised performance footage, the complete cover and native controls. Actual video playback reported muted, playing, readyState 4 and duration 14.75 seconds, using `afterwise-equilibrium-loop.BLCF60PG.mp4`; the observed playback includes cymbal and bass closeups. The final native capture is `chrome-blackbox-active-drumming-2120.png`. Earlier native 320/390/430px review and the 78-test layout run retain their title, artwork, shell navigation and player evidence; their captures show the previous tuning media. The final four production-browser checks repeat the loaded-font viewport matrix and decode/loop, pause, reduced-motion and full-video intent checks with the revised drumming footage in Chromium and Firefox.

Screenshots and compact logs are under `.codex-artifacts/catalog-repairs/`:

- `chrome-blackbox-active-drumming-2120.png`: final native Blackbox profile review with actual revised playback and complete title.
- `active-drumming-five-views.jpg`, `active-drumming-contact.jpg`: final exported performance frames and transitions.
- `chrome-blackbox-home-{2120,320,390,430}.png`: earlier native layout review with tuning media.
- `home-title-{chromium-desktop,firefox-desktop}-{2120,320,390,430}.png`: loaded-font title and artwork checks.
- `releases-{chromium-desktop,firefox-desktop}-{2120,320,390,430}.png`: fixed square principal artwork.
- `afterwise-playback-{chromium-desktop,firefox-desktop}.png`: actual prepared-loop playback.
- `e2e-active-drumming.log`: final four browser checks; structured browser result at `.codex-artifacts/e2e/summary.json`.
- `build-active-drumming.log`, `test-active-drumming.log`: final build and scoped media-contract checks.
- `e2e-production.log`, `build.log`, `image-tests.log`, `openspec.log`, `graphify-update.log`: earlier layout implementation evidence; retained browser result at `e2e-layout-summary.json`.

Review Home at <http://127.0.0.1:4372/blackbox-records/> and Releases at <http://127.0.0.1:4372/blackbox-records/releases/>. Port 4371 serves the production static build. Port 4372 adds read-only sample offer responses and the prepared Afterwise media mapping without writing editorial or stock data. The committed Local catalog contains Disintegration, Anarchotribal and Caregivers; it does not reproduce PRD's LOTUS record. The shared principal component provides the square-cover repair for either editorial selection. The preview helper and its PID files are ignored artifacts. Existing ports 4321/8787/4361 were preserved.

## Afterwise media screening

Source: `D:/Downloads/Afterwise - Equilibrium - Live at Fuzz Club Athens [Cl7rWCTGEqY].webm`, SHA-256 `71260c4d908d9d00c7f2dfb906f5088bee9147e820bc7eeda1f8c88f1cf84d74`. The full source was unchanged. Selected source intervals, in playback order: 119.25–122.75 seconds (approved bassist closeup), 127.5–130.75 (whole band with active cymbal strikes), 131.5–135 (approved cymbal closeup), 135.5–140.75 (whole band continuing the drum passage), and 114.5–117.5 (upper-body drummer closeup). The wide shots were selected around repeated drumming rather than general band movement. Transitions and loop wrap use 0.75-second crossfades; poster from 129.5 seconds. Source portions with rapid lighting pulses were excluded during selection. The existing exact-ID mapping for `Cl7rWCTGEqY` remains intact, and Sidus and unknown-ID fallback were preserved.

Prepared MP4: SHA-256 `c859b5a1097fd2aef9e4f45aa18b248f2e8ab677bcaba8388c2254b1c41b792e`, 509,290 bytes, H.264 1280×720, 24fps, 354 frames, 14.75 seconds, faststart and no audio stream. This remains below the unchanged 900,000-byte backdrop limit. Poster: 64,122 bytes, SHA-256 `046da57caad17345b2f155cb5554dacdf3aed1bc4748d9e66ab0ade8b377a122`.

The runnable ignored `check-media.mjs` decodes every frame at 320×180 and compares sRGB relative-luminance changes, localized changes and saturated-red fraction, including the last-to-first seam. The final contact sheet and five-view frame strip show repeated drum strikes in the selected passage and gradual transitions. One frame pair at 12.208 seconds during the wide-to-drummer dissolve exceeds the selection marker of 0.02 mean luminance change: mean 0.021975, with 0.9774% localized change. No other pair exceeds that marker, and no pair exceeds 10% localized change. These markers guide inspection rather than define flash safety. `media-evidence.json` records the method, hashes, stream metadata and results:

| Screening proxy                                                     | Original flashing excerpt | Prepared performance excerpt |
| ------------------------------------------------------------------- | ------------------------: | ---------------------------: |
| Maximum consecutive-frame mean luminance change                     |                  0.129813 |                     0.021975 |
| Maximum fraction with luminance change ≥0.1, darker state below 0.8 |                   46.342% |                      4.6875% |
| Loop-seam mean luminance change                                     |                  0.007986 |                     0.011269 |
| Loop-seam fraction changing ≥0.1                                    |                   0.1753% |                      1.4236% |
| Maximum saturated-red fraction                                      |                        0% |                           0% |

These are screening proxies, not a validated WCAG flash measurement, PEAT/Harding assessment or photosensitive-epilepsy safety certification. The review follows the need to inspect flashing and loop seams in [W3C flash guidance](https://www.w3.org/WAI/WCAG22/Understanding/three-flashes-or-below-threshold.html), with native pause and reduced-motion handling consistent with [W3C pause guidance](https://www.w3.org/WAI/WCAG22/Understanding/pause-stop-hide.html) and [C39](https://www.w3.org/WAI/WCAG22/Techniques/css/C39). Dimming alone was not used as the repair.

## Investigation limits

Relevant primary Graphify architecture and relationship queries were paired with CodeGraph exact source and flow investigation before editing, after source hashes matched this worktree. Missing worktree indexes were reported. Graphify's existing baseline graph was reused for the local AST refresh; SQL extraction and one unrelated script extraction warning do not establish SQL or that script's relationships. No CodeGraph index initialization, documentation/media semantic enrichment or paid API occurred.

## Why

Sixteen of the last 40 Release runs failed. The CI record (`gh run view --log-failed` on every failed run since 22 October) shows three causes:

- **Environment (9 runs):** apt mirror and DNS failures while installing browsers, then container setup. The Playwright image fixed this on 11 November.
- **Test drift (6 runs, the largest):** tests asserted the current catalog content, pixel geometry, typography or motion. An intended change, such as a new release or the live-show strip, then failed 24–133 tests. `release-merchandising.spec.ts` alone named specific releases 100 times.
- **Single flakes that survived a retry (5 runs):** WebKit Home film and reduced-motion timing, Firefox layout and focus timing.

Real defects caught by a browser suite were rare; lint, typecheck and the fixture build caught the others. Since 1 October, 160 of 530 commits touched `e2e/`. The gate cost more than it protected.

## What Changes

- The public end-to-end suite holds shopper journeys only: routes render, shell navigation and the player, cart to checkout and payment, checkout recovery and return, withdrawal, email preferences and availability alerts. It runs in Chromium desktop, Chromium phone and WebKit phone in one `e2e` job. It goes from 689 to 183 tests.
- Layout, typography, motion, performance-timing and catalog-content specs are deleted, as are the layout tests inside the kept specs. Firefox projects are removed from the public suite.
- The staff previews run in Chromium only, in one `staff-previews` job. The local `--firefox` option stays.
- PRD promotion requires the `e2e`, `staff-previews` and `deploy-uat` jobs of the candidate run.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `software-release-promotion`: the push run gates promotion on the journey suite and the Chromium staff previews.

## Impact

- `e2e/` (24 specs deleted, layout tests removed from 7), `playwright.config.ts`.
- `.github/workflows/pages.yml`, `scripts/release-candidate.mjs`, `scripts/launch-switch.mjs` and their tests, and the release docs that name the jobs.
- Out of scope: unit tests, the UAT static smoke, provider smoke and the visual review process. Visual acceptance stays a human review, not a CI gate.

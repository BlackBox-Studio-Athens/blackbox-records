# Validation: keep-released-items-on-home

Evidence from the local working tree on `main`, 2026-11-03. Local validation does not establish hosted or release acceptance; UAT results are recorded below after the deploy.

## Observed locally

- `pnpm validate` passed on the final tree (repository gates only), including the locked Show on Home switch (`selling.preorderOpen`, backend and staff tests) and the post-review fixes.
- Module tests passed: `web-store`, `storefront-catalog`, `web-pages`, `web-layouts`, `web-editorial`, `staff-content`, `checkout-core`, `cms-runtime`, `stock-integration`.
- Browser (task 3.3 and 3.4): the stocked and sold-out chapter cases passed at 1440px (chromium-desktop, firefox-desktop) and at phone width (chromium-mobile, firefox-compact, webkit-mobile), each asserting no pre-order treatment, a 44px Buy action or the static status, and no horizontal overflow. One firefox-compact run failed on a browser-context teardown protocol error (not an assertion) and passed on rerun. The full Home pre-order and tap-pause specs passed in Chromium (53 tests); CI runs them in every project.
- Payload (task 4.2): a projection with 150 realistic Home offers (the schema limit) is about 17 KB compact JSON, under the 64 KiB read cap; the schema-valid worst case with maximum field lengths and escaped prices is larger, so the 150-entry bound is the guard. Stock-count-only changes leave the projection identity unchanged (backend identity test), so they cause no store, retire or purge.

## Release candidate findings

- The first push (`02c68c87`) deployed UAT and passed its smoke, but every e2e job failed in the fixture build: the populated Home eager graph was 132,375 bytes against a 108,544 budget. `pnpm validate` does not build Home with a projection, so it missed this. Cause: the island imported content-model format parsing, an icon library and the Buy icon assets. Fix: the server reads the edition format into the chapter, and the island draws an inline disc. Checked with `BLACKBOX_PREORDER_PROJECTION=e2e/preorder-projection.json pnpm build:web` (passes).

## UAT

Recorded after the push to `main` deploys UAT (task 4.3).

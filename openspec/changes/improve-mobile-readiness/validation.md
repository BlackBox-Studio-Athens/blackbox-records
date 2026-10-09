# Validation

Product Environment: Local, on `main` in the primary checkout, from base `3e795689`. Groups A, B, C and E were committed first (`cfe261e7`..`d6d09eb3`, then `00caddf6` raising the Home eager budget to 106 KiB); the remaining groups were validated as one uncommitted tree on top of `00caddf6` and then committed in reviewable slices. PRD (`https://blackbox-records-web.pages.dev`) was only read for the review probes and reproductions; nothing hosted changed and nothing was pushed. These notes are written before the final `pnpm validate`; its summary path, status and HEAD SHA are kept in `.codex-artifacts/reviews/2026-10-09-mobile-readiness/gates/final-validation.json`, so recording them does not change the tested tree.

Acceptance rows:

- Shell/player/routing: history entries for the cart and Menu, overlay close, scroll restoration, inert background, player geometry and the new phone e2e projects.
- Commerce/checkout/stock: bfcache Pay recovery, the bounded item offer read, return-page retries and connection copy. Browser-only; no Worker, D1 or provider code changed, so the Local mock scenario and provider smoke were not needed.
- Boundaries/tooling/instructions: Playwright projects, the CI `e2e-webkit` job, the UAT smoke phone pass, agent documents and strict OpenSpec validation.

Not applicable: Staff/editor and CMS/publication (no staff, CMS, schema or publication code changed; the staff previews do not admit the new icons, noted below), Release/environment (no workflow promotion, deploy or environment change beyond adding a CI job; nothing was released).

## Method

A 16-agent review (static finders plus live phone-emulation probes of PRD) produced 175 candidate findings (26 P1, 81 P2), recorded in `.codex-artifacts/reviews/2026-10-09-mobile-readiness/raw-find-results.json`. Each was verified against source before editing, grouped by code area (A forms, B shell history, C player, D accessibility, E checkout, F touch, G head and hosting, H performance, J typography, K Store layout, I e2e coverage) and fixed with the smallest failing test. Per-group logs with files, results and risks are in `.codex-artifacts/reviews/2026-10-09-mobile-readiness/fixes/`.

## Checks per group

- A forms: Vitest 74/74. `routes.spec.ts` chromium-mobile 13/13 on a fresh 4321 server (16px check holds on the Store routes); `store-formats.spec.ts` 12/12 after a restart cleared Vite `504 Outdated Optimize Dep` errors; `availability-alerts.spec.ts` desktop 5/5.
- B shell history: `pnpm test:app-shell` 45 files / 283 tests. `shell-navigation.spec.ts` chromium-mobile 12 pass / 4 skip, chromium-desktop 9 pass / 7 skip; `player-continuity` desktop 2/2; `store-cart` chromium-mobile 14 pass / 1 skip. Home went 54 B over its 105 KiB budget; the owner raised it to 106 KiB (`00caddf6`).
- C player: `player-geometry-css.test.ts` 3/3; `player-continuity.spec.ts` chromium-desktop 3/3. 0 B eager JS.
- D accessibility: `pnpm test:app-shell` 45 files / 284; CSS, cart drawer and purchase-information Vitest 30/30. The e2e runs that failed did so on Vite 504s and concurrent HMR reloads; the clean reruns are in group I's baseline.
- E checkout: checkout folder Vitest 8 files / 129. `international-order-checkout.spec.ts` 8 pass and 3 pre-existing Tab-order failures, fixed in group I (11 pass).
- F touch: `StoreCoverflowController.test.ts` 23/23, `touch-ergonomics-css.test.ts` 4/4, 43 style/layout/page/store files / 515 tests. Eager JS about +40 B gzip on Store routes.
- G head and hosting: gateway tests 8/8, `_site-favicon` and `SiteLayout` 11/11, `web-pages`, `web-layouts` and the smoke-uat-static test pass.
- H performance: 9 unit files / 116 tests. Built `store/index.html` 1,276,792 B -> 695,456 B (264 Buy-icon data URIs, 569,265 B, moved to fingerprinted SVGs); showcase covers at 390 @3x 416,820 / 79,402 / 297,614 B -> 182,040 / 40,560 / 108,208 B; `home-preorders` 43 pass, 1 unrelated Firefox iframe-focus failure.
- J typography: `typography-floor-css.test.ts` and catalog-description 9/9; `routes.spec.ts` chromium-mobile 13/13 with the new 12px guard; Playwright probe at 320 × 568 and 390 × 844 across 11 routes found no text under 12px and no sideways scroll.
- K Store layout: 7 files / 38 and 8 files / 154 Vitest; `store-cart.spec.ts` 57 pass / 7 skip; new `store-formats` tests 3/3. First Store card top at 390 × 844: 761 -> 665 px. Landscape cart line window: 844 × 390 59 -> 205 px, 740 × 340 9 -> 155 px.
- I e2e: test count 359 -> 441 (chromium-desktop 225 -> 192, chromium-mobile 48 -> 97, firefox-desktop 70 -> 57, firefox-compact 16 -> 29, webkit-mobile 66). Baseline on Local `astro dev`: routes (chromium-desktop, chromium-mobile, webkit-mobile) 63 pass / 2 fail, both fixed; `shell-navigation` 31 pass / 16 skip after three fixes and one WebKit fix; `store-cart` every project passing after the follow-up fixes; `player-continuity` 9, `international-order-checkout` 11, `home-preorders` 44, `store-formats` 16, `home-swipe-rows` 8, `international-order-store-mobile` 7, `availability-alerts` 5 pass, `checkout-return` 5 pass and 1 fixed; all `@phone` tests 71 pass with 3 failures, 2 product bugs and 1 test fix, all resolved. Follow-up fixes: routes chromium-mobile + webkit-mobile 52/52, `shell-navigation` webkit-mobile 13 pass / 4 skip, withdrawal webkit-mobile 2/2 twice, `pnpm test:app-shell` 45 files / 287.

## Gates on the final uncommitted tree

- `pnpm validate`: passed, mode `local`, scope `all`, exit 0, `.codex-artifacts/validation/2026-10-09T16-55-46-137Z-61704-71a5f5/summary.json`, before/after fingerprint `1bfbd590f620a94a98a7b3a3244e2ab0a78a093982aa4ff00ee10a7184bd35f1` on HEAD `00caddf6`. An earlier run failed only on a `prefer-includes` lint error in `touch-ergonomics-css.test.ts`, since fixed.
- `pnpm build:web`: exit 0, `diagnostics: []`, `.codex-artifacts/reviews/2026-10-09-mobile-readiness/gates/build-web.log`. Eager Brotli graphs: Home 107,539 of 108,544 B; Store item 105,799 of 106,496 B; Store 90,031, Artists and Services 88,463 of 104,448 B.
- `pnpm --filter @blackbox/backend build:public` (Local): emits `apps/backend/dist-public/client/blackbox-records/404.html` (13,761 B) with the viewport and theme-color metas.
- `e2e/store-cart.spec.ts` "Buy on a Store card reopens a three-item cart" passes on webkit-mobile and chromium-mobile after the WebKit wheel guard. `gates/store-cart-webkit.log` is the run before the guard.
- `pnpm openspec -- validate improve-mobile-readiness --type change --strict`: valid. `pnpm agent:check`: Agent guidance OK.

## Browser observations

- PRD before the change (phone emulation): every text field under 16px; Back with the cart or Menu open routed the page; closing an overlay reset the list to the top; the minimized player covered the last 125 px; a held swipe left the next Coverflow tap dead (Local after F: the first tap advances); unknown URLs returned plain text.
- playwright-cli at 844 × 390, 568 × 320, 390 × 844 and 430 × 932 with real Bandcamp and Tidal embeds (no clicks inside): the landscape modal does not scroll and keeps play, transport and Close in view; the phone album iframe is 363 × 480 at 390 × 844 and 403 × 520 at 430 × 932 with no empty area.
- Phone Coverflow price bottom vs stage: 1363 vs 1364 at 390 × 844, 864 vs 867 at 320 × 568. Desktop front-card price and Buy visible at 1280 and 1440.
- Local dev serves the manifest and icons with the right types, and unknown pages and slugs return the HTML 404.
- A scratch WebKit run hit Buy on 9 of 9 far-down taps with the settled-scroll helper.

## Refuted or deferred findings

- Menu `aria-expanded` not synced: refuted; an `AppShellRoot` effect already syncs it and e2e covers it.
- Hero image `sizes` too large: refuted; the 2000 × 1400 hero is drawn with `cover` over the whole viewport, so it renders about 1206 CSS px wide at 390 × 844 and a smaller `sizes` would fetch a blurrier image. A portrait crop needs the editorial crop workflow.
- `viewport-fit=cover`: deferred. The layout container, mini player, sheets and Menu already pad with `env()`, but the header has no top inset, the footer meta (`.site-footer-meta`) no bottom inset and the cart drawer no `env()` padding; it needs those and a real iPhone check.
- Buy and Listen accessible names: deferred; four specs select `Listen` exactly and the Coverflow controller copies labels.
- Greek display titles: assessed only (Veneer and Bebas have no Greek glyphs); the fix options are in `fixes/J-typography.md`.
- Default social image: content decision, not changed.
- Bounded R2 image derivative at publication: recorded as a backend follow-up in `fixes/H-perf.md`; it needs its own change because site-images forbids new media handling.

## Not verified

- Real iPhone: embed interaction detection on WebKit; bfcache restore of checkout on iOS Safari and Chrome Android; cart focus return to Buy after a tap; saving the withdrawal receipt; Back to a deep Store scroll on Safari (no scroll anchoring with 520 px placeholder cards); landscape safe areas.
- The Pages ASSETS binding returning `404.html` for `/404`: first exercised by the UAT static smoke on `deploy-uat`; until then the gateway falls back to plain text.
- The `e2e-webkit` CI job and its apt lock step have not run on a GitHub runner.
- The `zod/mini` saving on Home was not measured in a build after the schema move.
- The UAT smoke phone pass has not run against UAT.
- Staff previews do not admit the new icons (`apps/backend/src/cms/cms-worker.ts`).

## Owner decisions

- Sticky purchase bar (group K proposal, needs design approval): below 48rem, only while the in-flow Add To Cart is off-screen, one fixed row with the price and the existing purchase action above the mini player and the bottom safe area, hidden while the cart or an overlay is open; it needs `viewport-fit=cover`, and its checkout counterpart conflicts with complete-shopper-purchase-information ("No sticky duplicate purchase bar is required").
- Whether `e2e-webkit` becomes a required job in `scripts/release-candidate.mjs`: recommended not yet, until it has passed on a few pushes.

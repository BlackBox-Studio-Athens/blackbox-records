# Proposal

## Why

Every public page blocks first render on one global stylesheet: 214,710 bytes decoded, 29,951 bytes at maximum Brotli and 38,043 bytes as Cloudflare served it on release 624. Chrome estimated about 1 s of render-blocking time on the Slow 4G mobile profile. Most of the bytes belong to single routes: Home pre-orders (about 20.7 KB raw), the player, Store cart and checkout (about 14 KB) and artist detail. `improve-search-presence` task 8.1 closed on 22 October 2026 as measured, with no CSS delivery change, and the owner moved route-split CSS into this change.

## What Changes

- Make the shell wait, within a bounded time, for a destination's newly linked route stylesheets before it swaps content in. Today `adoptShellPageStylesheets` appends the link without waiting, and Store catalog content shifts (CLS 0.0313 locally) when `StoreCollectionPage.*.css` arrives after the swap.
- Move rules used by a single route or component out of `apps/web/src/styles/global.css` into CSS owned by that route or component, so Astro links them only on pages that use them.
- Keep shared shell, header, footer, player, typography, purchase controls and design tokens global.
- Preserve the current cascade order and rendered appearance exactly. Changing the visual direction is out of scope.
- Measure before and after on the declared mobile-load profile, and stop if the measured gain does not meet the gate.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `frontend-runtime-performance`: add a requirement that render-blocking CSS is route-proportional, with a byte gate and appearance-equivalence evidence.
- `app-shell-and-player`: add a requirement that shell navigation applies the destination's route stylesheets before the content swap, within a bounded wait.

## Impact

- Code: `apps/web/src/styles/global.css`; route and component CSS imports under `apps/web/src/components/**` and `apps/web/src/layouts/**`; `apps/web/src/components/app-shell/navigation/shell-page-snapshot.ts` and `shell-page-loader.ts` with their tests; CSS contract tests in `apps/web/src/styles/*-css.test.ts` and `apps/web/src/layouts/catalog-containment.test.ts`.
- Checks: shell navigation, player continuity and route e2e suites; matched viewport screenshots; the `mobile-load` runtime profile.
- No dependency, font, image-transformation, API, commerce, content or SEO metadata change. No Cloudflare plan or quota change.
- Sequencing: start only after `improve-search-presence` integrates its writers (it edits `shell-page-snapshot.ts` and `SiteLayout.astro`).

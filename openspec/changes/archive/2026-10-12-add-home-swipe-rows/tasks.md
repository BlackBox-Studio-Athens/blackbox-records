# Tasks

## 1. Implementation

- [x] 1.1 Add the `SwipeRowDots` island to `ui-foundation` (ReUI `c-carousel-11` dots, 24 px targets, scroll-position sync, MIT notice).
- [x] 1.2 Give the Home News and Artists grids row ids and mount one dots island under each with `client:load`.
- [x] 1.3 Add the phone row, card widths, edge bleed and guarded fade to `global.css`; reduce the Artists section padding on phones.

## 2. Verification

- [x] 2.1 Unit tests for the current-card calculation, the dots markup and the fade's `@supports` guard.
- [x] 2.2 e2e spec at 390 px: swipe, dot tap, no horizontal page scroll, dots after shell navigation; 1280 px keeps the grids without dots.
- [x] 2.3 Production build passes the eager bundle budget; built CSS keeps `animation-timeline`.
- [x] 2.4 Browser check in Chromium and Firefox at 390 px.
- [x] 2.5 Run `pnpm validate` and strict OpenSpec validation. See `validation.md`.

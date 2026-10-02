# Tasks

## 1. Implementation

- [x] 1.1 Add the `@supports (animation-timeline: scroll())` media-layer and veil animation on `scroll(root block)` over `0 42vh`, using longhands (the minifier rewrites an `animation` shorthand beside `animation-timeline` into `animation: none`) and explicit `from` keyframes, before the reduced-motion block.
- [x] 1.2 Preload eager images inside `fetchSnapshot` once per fetched snapshot; `prefetchHref` relies on it.

## 2. Verification

- [x] 2.1 Update `homepage-hero-css.test.ts` and `shell-page-loader.test.ts`; run styles, layouts and app-shell navigation/dom tests.
- [x] 2.2 Production build: confirm the minified CSS keeps `animation-timeline` and both keyframe endpoints.
- [x] 2.3 Browser on a Local production preview at 390 px: monotonic opacity from `1` to `0.12` across `0`–`42vh` with no step at the class threshold, reversible; scroll trace has no Paint and comparable style work to PRD.
- [x] 2.4 Browser: cold Artists to Home tap, hero image requested during the insertion layout and complete before reveal.
- [x] 2.5 Run `pnpm validate` and strict OpenSpec validation on the final tree. See `validation.md`.

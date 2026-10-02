# Tasks

## 1. Implementation

- [x] 1.1 Add the `@supports (animation-timeline: scroll())` media-layer and veil animation on `scroll(root block)` over `0 42vh`, using longhands (the minifier rewrites an `animation` shorthand beside `animation-timeline` into `animation: none`) and explicit `from` keyframes, before the reduced-motion block.
- [x] 1.2 Preload eager images inside `fetchSnapshot` once per fetched snapshot; `prefetchHref` relies on it.
- [x] 1.3 Firefox fallback: move the animation names into the base media-layer and veil rules and delete their dead 240 ms transitions. Add `@supports not (animation-timeline: scroll())` with `animation-duration: 1s` and `animation-play-state: paused`. `connectHomepageHeroScrollProgress` seeks the two fade animations to `progress × 1000 ms` when `CSS.supports` reports no scroll timelines, caching them per hero element and skipping unchanged progress.

## 2. Verification

- [x] 2.1 Update `homepage-hero-css.test.ts` and `shell-page-loader.test.ts`; run styles, layouts and app-shell navigation/dom tests.
- [x] 2.2 Production build: confirm the minified CSS keeps `animation-timeline` and both keyframe endpoints.
- [x] 2.3 Browser on a Local production preview at 390 px: monotonic opacity from `1` to `0.12` across `0`–`42vh` with no step at the class threshold, reversible; scroll trace has no Paint and comparable style work to PRD.
- [x] 2.4 Browser: cold Artists to Home tap, hero image requested during the insertion layout and complete before reveal.
- [x] 2.5 Run `pnpm validate` and strict OpenSpec validation on the final tree. See `validation.md`.
- [x] 2.6 Fallback tests: `shell-hero-scroll-progress.test.ts` covers seeking only the fade, no rewrite for unchanged progress, a replaced hero, and supported browsers left untouched; `homepage-hero-css.test.ts` covers both `@supports` branches and the absence of transitions. The production build keeps both branches as longhands.
- [x] 2.7 Firefox 155 (Playwright) on a Local production preview at 390 and 1440 px: offsets match the Chrome table; a Lenis wheel scroll is monotonic with no step at the class flip; shell return and reduced motion behave as specified; interleaved frame-pacing A/B against the coarse crossfade. Chrome is unchanged, with zero seeks.
- [x] 2.8 Run `pnpm validate` and strict OpenSpec validation on the final tree. See `validation.md`.

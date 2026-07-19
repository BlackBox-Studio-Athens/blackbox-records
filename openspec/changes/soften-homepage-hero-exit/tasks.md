## 1. Ghost Crossfade Regression Gate

- [x] 1.1 Replace the Static Plate `homepage-hero-css.test.ts` expectation with one focused Persistent Ghost Crossfade contract covering a fixed visible media layer, opacity `1`, the scrolled `0.28` endpoint, the shared 240-millisecond curve, no visibility change, a transition-free hero-scoped shade, retained section veils and opaque footer, transition-free scroll-cue shutdown, and continued absence of scroll-progress writes, transforms, filters, blend modes, or decorative keyframes.
- [x] 1.2 Run the focused Home hero CSS and scroll-helper tests before implementation and confirm the current full-opacity Static Plate fails the new contract for the missing crossfade and ghost endpoint.

## 2. Persistent Ghost Crossfade

- [x] 2.1 Add the media-only opacity transition and scrolled `0.28` endpoint in `global.css`, reusing the existing fixed media layer, coarse class, 240 milliseconds, and `cubic-bezier(0.22, 1, 0.36, 1)` without adding visibility changes, delays, markup, JavaScript, or a second image.
- [x] 2.2 Retain the already-implemented hero-scoped transition-free shade, static News/Artists/Newsletter veils at `rgb(13 13 13 / 92%)`, `rgb(20 20 20 / 94%)`, and `rgb(13 13 13 / 90%)`, opaque cards, opaque footer, and shared section stacking without blur, blend mode, mask, shadow, gradient, or animated clipping.
- [x] 2.3 Add a specificity-safe reduced-motion rule that applies the same opacity endpoints immediately, run the focused tests, and keep the passive coarse helper, threshold calculation, route cleanup, and same-side guard unchanged unless a failing contract proves otherwise.

## 3. Rendered Acceptance

- [x] 3.1 Use Browser Use at representative mobile and desktop widths to verify unchanged first-viewport brightness, a smooth 240-millisecond crossfade to the settled `0.28` ghost, no visibility drop, naturally departing shade, retained section veils, readable cards, opaque footer coverage, no overflow or layout jump, and console cleanliness.
- [x] 3.2 Verify slow, fast, and interrupted threshold crossings, reverse crossfade, transition-free scroll-cue shutdown, same-side scrolling, reduced-motion endpoints, Home-to-section shell navigation, return to Home at scroll zero, and absence of the ghost on non-Home routes.
- [x] 3.3 Check text, link, control, and focus contrast against the settled ghost at every Home section; reject the selected endpoint if the image remains too bright or the section surfaces become visually muddy.

## 4. Performance Rejection Gate

- [x] 4.1 Compare against the retained bounded-fade and Static Plate evidence, then run the production Home wide and mobile profiles with at least three first traversals, three repeat traversals, and a settled sample using the existing runner and report format.
- [x] 4.2 Reject the Ghost Crossfade if application work exceeds the existing 8-millisecond p95 budget, an attributable task or long animation frame reaches 50 milliseconds, the ghost adds an image request or decode, or traces show repeated hero-attributable paint, raster, animation, or layer invalidation after the 240-millisecond transition settles; retain and classify every first-run outlier without adding a new optimization hint or profiler.

## 5. Final Validation

- [x] 5.1 Run `pnpm test:unit`, `pnpm check`, `pnpm build`, `pnpm openspec -- validate soften-homepage-hero-exit --strict`, and `git diff --check` against the final tree.

## 6. True Persistent Background Tuning

- [x] 6.1 Update the focused CSS contract to require a scrolled opacity of `0.18` and News/Artists/Newsletter surfaces of `76%`, `78%`, and `74%`, then confirm the completed `0.28` iteration fails the new endpoint and veil values.
- [x] 6.2 Change only the existing media endpoint and three section surface values; retain the fixed single image, 240-millisecond curve, immediate reduced-motion endpoint, opaque cards and footer, and unchanged scroll helper.
- [x] 6.3 Use Browser Use at desktop and mobile widths to verify the image remains quietly visible through every Home section without muddiness, text/control/focus readability remains strong, the footer ends the image cleanly, and route/reduced-motion behavior remains correct.
- [x] 6.4 Run three first and three repeat production traversals at wide and mobile sizes; reject any regression beyond the existing 8-millisecond p95 work budget, any attributable 50-millisecond task/LoAF, extra image work, or repeated settled paint/raster work.
- [x] 6.5 Run `pnpm test:unit`, `pnpm check`, `pnpm build`, strict OpenSpec validation, and `git diff --check` against the final tree.

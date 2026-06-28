## 1. Orientation

- [x] 1.1 Re-read this change's `proposal.md`, `design.md`, and `specs/app-shell-and-player/spec.md`.
- [x] 1.2 Inspect `apps/web/src/styles/global.css` around the homepage hero selectors and confirm which selectors use `--homepage-hero-scroll-progress`.
- [x] 1.3 Inspect existing style tests under `apps/web/src/styles/` and pick the smallest existing test pattern for CSS regression coverage.

## 2. Implementation

- [x] 2.1 Remove opacity transition declarations from `.homepage-hero-section__media-layer`, `.homepage-hero-section__shade-layer`, `.homepage-hero-section__grain-layer`, and `.homepage-hero-section__scroll-indicator`.
- [x] 2.2 Preserve fixed positioning, image filter, grain layer, hero image animation, scroll cue animation, and reduced-motion override behavior.
- [x] 2.3 Do not change app-shell navigation, route transitions, content models, image generation, dependencies, or deployment configuration in this slice.
- [x] 2.4 Replace continuous homepage hero CSS variable writes with one coarse threshold class toggle.
- [x] 2.5 Remove `--homepage-hero-scroll-progress` opacity formulas from the hero CSS.

## 3. Regression Coverage

- [x] 3.1 Add or update a focused CSS test asserting the four scroll-progress hero opacity selectors do not declare opacity transitions.
- [x] 3.2 Keep the test scoped to the homepage hero transition regression; do not introduce browser trace thresholds or a new performance harness.
- [x] 3.3 Add focused scroll-helper coverage showing same-threshold scroll frames do not mutate the hero repeatedly.

## 4. Validation

- [x] 4.1 Run `pnpm test:unit`.
- [x] 4.2 Run `pnpm check`.
- [x] 4.3 Run `pnpm build`.
- [x] 4.4 Use Browser Use on a mobile-first local viewport to verify the homepage hero still renders and scrolls into the next section.
- [x] 4.5 In Browser Use or DevTools, confirm a short hero scroll no longer repeatedly starts/cancels opacity transitions for the affected hero selectors.
- [x] 4.6 Sanity-check desktop homepage hero rendering after the mobile check.
- [x] 4.7 Run `pnpm openspec -- validate remove-homepage-hero-scroll-opacity-transitions --type change --strict`.
- [x] 4.8 Re-run focused style and scroll-helper tests after the threshold-class change.

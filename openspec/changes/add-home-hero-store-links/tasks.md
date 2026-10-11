# Tasks

## 1. Hero

- [x] 1.1 Add Browse the Store and See pre-orders to `HomeHero.astro`, remove the Scroll label and its prop, and style desktop and phone layouts plus the showcase-driven visibility rule; verify `homepage-hero-css.test.ts` passes with the new assertions.
- [x] 1.2 Defer `StorePreorderShowcase` to `client:idle` so the main page loads first and See pre-orders may appear afterwards; keep Browse the Store in the initial HTML and reuse the showcase-driven visibility rule.
- [x] 1.3 Follow-up: remove See pre-orders entirely and delete its conditional visibility CSS; keep the deferred showcase and Browse the Store.

## 2. Content field

- [x] 2.1 Retire `hero.scroll_indicator_text`: optional and unused in the Home schema, removed from the staff Home form and retained Home fixtures; verify content-model and staff tests pass.

## 3. Browser acceptance

- [x] 3.1 Extend `e2e/home-preorders.spec.ts` for both pre-order states, the in-page jump, the phone layout down to 280 px and the missing Scroll label; verify it and `e2e/home-motto.spec.ts` pass.
- [x] 3.2 Inspect Home at 1440, 390, 320 and 280 px with and without pre-orders against canvas frames C and C · Mobile; verify no clipping or horizontal overflow.
- [x] 3.3 Compare Local loading before and after deferral, then run the existing hero, empty-showcase and shell-return browser cases with the deferred island.
- [x] 3.4 Update and run the hero and empty-showcase browser checks to verify one Store action at 390, 320 and 280 px, regardless of pre-order availability.

## 4. Completion evidence

- [x] 4.1 Run strict OpenSpec validation and `pnpm validate`; record source-bound evidence in `validation.md`.
- [x] 4.2 Validate the hero-button removal and record current evidence in `validation-hero-button-removal.md`; commit the scoped removal locally.

## 5. Browse treatment review

- [x] 5.1 Prepare three smaller, quieter Browse drafts on the current Home hero, including dark framed options; inspect desktop and phone views and present the comparison.
- [x] 5.2 Apply the owner-approved smaller Quiet outline B and verify its responsive layout, keyboard focus and 44 px touch target on desktop and phone browser engines; record the outcome in `validation-browse-quiet-outline.md`.
- [x] 5.3 Correct the compact Browse browser check for cross-platform text metrics while retaining exact padding, height, typography, touch-target and shell-navigation checks; validate and rerun release acceptance.

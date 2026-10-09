# Tasks

## 1. Hero

- [x] 1.1 Add Browse the Store and See pre-orders to `HomeHero.astro`, remove the Scroll label and its prop, and style desktop and phone layouts plus the showcase-driven visibility rule; verify `homepage-hero-css.test.ts` passes with the new assertions.

## 2. Content field

- [x] 2.1 Retire `hero.scroll_indicator_text`: optional and unused in the Home schema, removed from the staff Home form and retained Home fixtures; verify content-model and staff tests pass.

## 3. Browser acceptance

- [x] 3.1 Extend `e2e/home-preorders.spec.ts` for both pre-order states, the in-page jump, the phone layout down to 280 px and the missing Scroll label; verify it and `e2e/home-motto.spec.ts` pass.
- [x] 3.2 Inspect Home at 1440, 390, 320 and 280 px with and without pre-orders against canvas frames C and C · Mobile; verify no clipping or horizontal overflow.

## 4. Completion evidence

- [ ] 4.1 Run strict OpenSpec validation and `pnpm validate`; record source-bound evidence in `validation.md`.

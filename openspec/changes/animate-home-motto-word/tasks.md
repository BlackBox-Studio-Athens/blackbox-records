# Tasks

## 1. Implementation

- [x] 1.1 Add `motto-word-cycle.ts` (word detection, cycle labels, session-clip peaks, glitch tears with waveform shards, custom element with scrub on `motion/mini`, pause and reduced-motion handling) and register it from a null-rendering `client:load` island in `HomeHero`.
- [x] 1.2 Wrap the `HomeHero` motto and add the slot, playhead, tear and shard styles.
- [x] 1.3 Keep the element inside `web-editorial`. The first UAT release registered it from `SiteLayout`, which put it in every page's eager graph and failed the Store item budget (104,568 of 102,400 bytes); the Home island keeps other pages unchanged.

## 2. Verification

- [x] 2.1 Owner choice from the rendered transition study and the recorded Scrub iterations.
- [x] 2.2 `motto-word-cycle.test.ts` and `e2e/home-motto.spec.ts` (first word, cycle, shell return, reduced motion).
- [x] 2.3 Run `pnpm validate` and strict OpenSpec validation. See `validation.md`.

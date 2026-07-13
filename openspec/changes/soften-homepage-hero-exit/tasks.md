## 1. Predecessor And Regression Gate

- [ ] 1.1 Confirm `improve-site-runtime-performance-round-two` is archived; if amended instead, verify its design and task 7.3 remove transition-free Home ownership and its strict validation passes, then run `pnpm openspec:guard` and compare the final baseline with this delta.
- [ ] 1.2 Update `homepage-hero-css.test.ts` so one focused assertion requires the shared 180-millisecond media/shade opacity transition, delayed exit visibility, a specificity-safe reduced-motion override for both timings, transition-free scroll-indicator opacity, and continued absence of scroll-progress writes or transform motion.

## 2. Bounded Hero Fade

- [ ] 2.1 Add the grouped media/shade opacity and visibility declarations plus the specificity-safe reduced-motion override in `global.css`, reusing `homepage-hero-section--scrolled`, 180 milliseconds, and `cubic-bezier(0.22, 1, 0.36, 1)` without changing markup, JavaScript, the threshold, or the scroll cue.
- [ ] 2.2 Run the focused Home hero CSS and scroll-helper tests; keep the existing helper unchanged unless a failing contract proves otherwise.

## 3. Acceptance

- [ ] 3.1 Use Browser Use at representative mobile and desktop widths to verify synchronized exit, settled hidden state, same-side scrolling, return fade, interrupted reversal, shell return to Home, scroll-cue shutdown, and console cleanliness.
- [ ] 3.2 Repeat the Home checks with reduced motion and verify immediate media/shade endpoints with no transition or hidden animation work.
- [ ] 3.3 Run the existing Home wide and mobile scroll profiles with three first and repeat traversals; reject application-work regression, long tasks, same-side transition churn, or settled hidden work without adding a profiler or report format.
- [ ] 3.4 Run `pnpm test:unit`, `pnpm check`, `pnpm build`, `pnpm openspec -- validate soften-homepage-hero-exit --strict`, and `git diff --check` against the final tree.

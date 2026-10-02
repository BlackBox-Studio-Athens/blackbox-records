# Tasks

## 1. Implementation

- [x] 1.1 Add `apps/web/scripts/simplify-veneer.py` (source SHA guard, contours under 12 units dropped, Ramer-Douglas-Peucker at 8 units, table and metric assertions, fixed timestamp for reproducible bytes).
- [x] 1.2 Replace both retained `veneer_regular.woff2` copies with its output and update `check-brand-font.ts`.
- [x] 1.3 Animate only opacity in the shell page-enter transition.

## 2. Verification

- [x] 2.1 Owner choice from rendered comparisons (54 px at 3x, 120 px at 2x) and layout benchmarks of five candidates.
- [x] 2.2 `shell-transition.test.ts` asserts the opacity-only enter animation; navigation and styles tests pass; production build passes `brand-font:check`.
- [x] 2.3 Browser on a Local production preview at 390 px: cold Artists to Home tap, hero image height stays 844 px in every frame, no transform left on `<main>`, scroll fade works after shell navigation, and the long animation frame drops from about 3 s to under 300 ms at 4x CPU.
- [x] 2.4 Run `pnpm validate` and strict OpenSpec validation. See `validation.md`.

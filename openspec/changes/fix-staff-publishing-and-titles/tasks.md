# Tasks

## 1. Fixes

- [x] 1.1 A: free the item publication claim on a failed attempt; Staff ends a step that has no requested website publication as failed with Retry. Regression: `publish-item.worker.test.ts` (immediate retry), `item-commerce.test.ts`.
- [x] 1.2 B: store a cleared Distro `group` as `''` in the draft revision before native publish, in item and runtime publication. Regression: `distro-legacy-group.worker.test.ts` with the native EmDash publish.
- [x] 1.3 C: closed Bandcamp outcome with exact-address search first and the page read as fallback; Staff Use action for a suggestion. Regression: `bandcamp-resolution.worker.test.ts`, `BandcampField.test.tsx`.
- [x] 1.4 D: uppercase the shared Greek title class. Regression: `greek-title-css.test.ts`.

## 2. Acceptance

- [x] 2.1 Focused tests, Local screenshots at 1440 and 390 px.
- [x] 2.2 `pnpm validate` on the final tree.
- [x] 2.3 UAT release run and read-only UAT checks.
- [ ] 2.4 PRD promotion and read-only PRD checks; the member's Retry on the Bruce. item stays with the owner.

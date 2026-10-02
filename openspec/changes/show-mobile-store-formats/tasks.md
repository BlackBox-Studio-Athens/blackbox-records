# Tasks

## 1. Visible mobile formats

- [x] 1.1 Move the format navigation into a `formats` slot before the Browse pane's disclosure, relabel the disclosure `Artist`, and remove the unused `formatDisclosure` field and the format suffix from the artist summary.
- [x] 1.2 Style narrow-viewport format links as wrapping square chips with counts, a 44px height and the selected-chip face; keep the desktop ledger spacing unchanged.
- [x] 1.3 Update the source and unit tests, and add `e2e/store-formats.spec.ts` for the 390px visible-and-select path.
- [x] 1.4 Verify Local at 320px, 390px and 1280px on Store All and Store Distro.
- [x] 1.5 Run strict OpenSpec validation and `pnpm validate` on the final tree.
- [ ] 1.6 After authorized release, confirm the UAT candidate, then PRD at 390px.

## 2. Native mobile artist select

- [x] 2.1 Replace the `Artist` disclosure with a labelled native select below 64rem, sharing the artist state with the desktop radio list, and remove the disclosure, its current-artist label and their snapshot sanitation.
- [x] 2.2 Update unit tests and the Store category output check; verify Local at 320px, 390px and 1280px.
- [x] 2.3 Run strict OpenSpec validation and `pnpm validate` on the final tree.
- [ ] 2.4 After authorized release, confirm UAT, then PRD at 390px.

The approved plan resolves the approach, so a separate design document is omitted.

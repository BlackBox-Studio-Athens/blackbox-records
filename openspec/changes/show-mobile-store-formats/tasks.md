# Tasks

## 1. Visible mobile formats

- [x] 1.1 Move the format navigation into a `formats` slot before the Browse pane's disclosure, relabel the disclosure `Artist`, and remove the unused `formatDisclosure` field and the format suffix from the artist summary.
- [x] 1.2 Style narrow-viewport format links as wrapping square chips with counts, a 44px height and the selected-chip face; keep the desktop ledger spacing unchanged.
- [x] 1.3 Update the source and unit tests, and add `e2e/store-formats.spec.ts` for the 390px visible-and-select path.
- [x] 1.4 Verify Local at 320px, 390px and 1280px on Store All and Store Distro.
- [x] 1.5 Run strict OpenSpec validation and `pnpm validate` on the final tree.
- [ ] 1.6 After authorized release, confirm the UAT candidate, then PRD at 390px.

The approved plan resolves the approach, so a separate design document is omitted.

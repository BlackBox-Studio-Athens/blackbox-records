# Tasks

## 1. Clear filters and multi-artist filter

- [x] 1.1 Restyle Clear filters as the approved bold text button with a × mark, keeping its accessible name and behavior.
- [x] 1.2 Replace the artist radios and `All artists` with checkboxes, a find box and a pinned `Selected · N` group with an artists-only Clear; filter results by any ticked artist; keep focus on moved checkboxes.
- [x] 1.3 Replace the phone native select with a toolbar Artists chip and a bottom sheet that reuses the same list, with `Show N items`, scroll lock and closing at 64rem.
- [x] 1.4 Reset ticked artists, find, pinned options and the sheet in both snapshot sanitizers; update `DESIGN.md`.

## 2. Acceptance

- [x] 2.1 Update unit tests and the Store e2e specs for checkboxes and the phone sheet; verify Local at 1280px, 390px and 375px, including one-line phone filter row, keyboard focus after pinning and no horizontal overflow.
- [x] 2.2 Run strict OpenSpec validation and `pnpm validate`, refresh Graphify and record source-bound evidence in `validation.md`.
- [ ] 2.3 After authorized release, confirm UAT, then PRD at 390px.

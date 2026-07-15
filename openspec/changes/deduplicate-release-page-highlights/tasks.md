## 1. Release role selection

- [x] 1.1 Extend `apps/web/src/lib/release-feature.test.ts` with failing regression cases proving featured and selected upcoming entries are absent from the remainder, later releases retain catalog order, and no-upcoming, no-out-now, and empty-remainder cases stay distinct.
- [x] 1.2 Add `selectReleasePageEntries` to `apps/web/src/lib/release-feature.ts`, reusing the existing availability split and current fallback, then make the focused role-partition tests pass with no new dependency or configuration.

## 2. Releases page presentation

- [x] 2.1 Update `apps/web/src/pages/releases/index.astro` to consume the selector, render `ReleaseCard` only for `remainingReleaseEntries`, recalculate card loading from that list, and omit the grid section when it is empty.
- [x] 2.2 Expand the existing upcoming aside in `apps/web/src/pages/releases/index.astro` with linked Astro-managed cover art, alt fallback, title, artist, semantic date, and conditional summary/formats while keeping featured art as the only priority image.
- [x] 2.3 Add the minimum responsive upcoming-media styles to `apps/web/src/styles/global.css`, preserving current breakpoints, focus behavior, and app-shell layout without extracting a new component or copying the demo stylesheet.

## 3. Verification

- [x] 3.1 Run `pnpm test:unit`, `pnpm check`, and `pnpm build` against the final tree.
- [x] 3.2 Use Browser Use at mobile and desktop widths on direct and shell-managed `/releases/` navigation; confirm Caregivers is featured, Disintegration is the artwork-backed upcoming release, Anarchotribal is the only remaining card for current content, links and semantic text remain usable, and the console is clean.

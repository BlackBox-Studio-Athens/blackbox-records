## 1. Characterize Format Selection

- [x] 1.1 Extend the existing Distro grouping/navigation source-contract test for separate populated `Vinyl 10-inch` and `Vinyl 7-inch` groups in exact physical-type order, `All formats`, shared server-derived keys, progressive fragment hrefs including Store All links, current-selection semantics, matching intro fields, and unchanged total card count; verify neither vinyl-size group includes the other.
- [x] 1.2 Add focused route-controller tests for valid and invalid initial fragments, selection-before-final-scroll/focus, selecting one group, restoring all groups, selecting away and back, resetting to all before search, CSS-owned selection markers, no selection writes to `hidden`, and cleanup; add one exactly-two-card Coverflow test proving initialization and navigation always leave exactly one active front-facing card.

## 2. Implement Focused Browsing

- [x] 2.1 Split the combined derived vinyl-size group into separate 7-inch and 10-inch groups, then add `All formats` and matching keys to both responsive navigation presentations and catalog groups; verify no-JavaScript links still target the complete catalog or exact matching headings.
- [x] 2.2 Extend the existing `StoreDistroSearch` route controller to own one-time initial-fragment selection, selected-format/current markers, mobile summary copy, disclosure closing, final post-selection scroll/focus, search reset, and cleanup; verify focused tests pass without a second component or dependency.
- [x] 2.3 Emit the existing Coverflow shell/enrollment data for every multi-item group, keep small groups and their normal grid image sizing under `All formats`, relax the shared DOM reader to two or more cards, reuse `getStoreCoverflowPosition` for item-count-safe stage assignment, and use the existing preview/catalog transition when selection changes; verify one-item groups have no Coverflow controls or controller.
- [x] 2.4 Extend shell snapshot sanitation and styles to clear selection markers, restore small groups to grid mode, retain search ownership of `hidden`, expose current selection, and keep 44-pixel targets, visible focus, and no horizontal overflow.

## 3. Verify Route Behavior

- [x] 3.1 Run the focused Distro grouping, navigation, search, Coverflow, and shell snapshot tests; verify format selection does not alter catalog membership, canonical order, Store request cardinality, or search results.
- [x] 3.2 Run `pnpm test:unit`, `pnpm check`, and `pnpm build`; verify all required repository gates pass on the final tree.
- [x] 3.3 Use Browser Use on direct and shell-managed `/store/distro/` plus Store All → Distro 7-inch and 10-inch links at desktop and 390 pixels; verify exact group separation, `All formats`, CD, 12-inch, 7-inch focused Coverflow, single-item 10-inch behavior, search/clear, switching groups, final heading position, keyboard focus, sticky navigation, and console cleanliness.
- [x] 3.4 Run the established bounded Store/Distro request, load, and first-traversal smoke; verify no measured LCP, CLS, long-task, blank-corridor, or horizontal-overflow regression, and run the full performance suite only if the smoke regresses.

# Design

## Context

Approved boards: "Store filter options" canvas, Final page (desktop 1280px, phone results, phone Artists sheet). The artist filter is server-rendered and enhanced in place by the `StoreDistroSearch` island, which must keep its final box before hydration (`frontend-runtime-performance`).

## Decisions

- **One checkbox list, moved rather than duplicated.** The desktop pane owns the only `fieldset`. On phones the island moves that fieldset into a native modal `<dialog>` while the sheet is open and back when it closes, so there is one set of checkboxes and no state sync between copies. A viewport that reaches 64rem closes the sheet.
- **Pinning moves the label node.** Ticked labels move to the `Selected` group above the scrolling list in their original alphabetical order, and return to their position when unticked. Moving a node drops focus, so the island restores focus to the moved checkbox. Tab order then continues from the pinned group, which matches what is drawn.
- **Find filters only unticked options** and never hides a ticked artist. It is local presentation state, not part of the result filter.
- **Selection is a set of normalized artist keys.** An empty set means all artists. Results match any ticked artist, then the existing text, format and Pre-orders filters apply.
- **Artists chip uses the chip family** (Bebas caps, 44px, quiet edge, ink edge while artists are ticked) so it matches the Pre-orders chip beside it; the board drew it in Inter.
- **Clear filters** is a dedicated text button style (Inter 700, 16px, 2px underline, × mark), an approved exception to the 13px text-action rule.
- **Scroll lock** reuses `acquireLenisModalLock` while the sheet is open.

## Risks

- Android Back leaves the page while the sheet is open instead of closing it; Escape and the Close and Show buttons close it. Adding a history entry would involve shell history ownership and is out of scope.
- Browsers without `:has()` are unaffected; the design uses no `:has()`.

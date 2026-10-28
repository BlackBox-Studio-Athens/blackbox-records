# Tasks

## 0. Decisions

- [x] 0.1 Owner selects landing layout A, B or C (or a combination) from the previews in design.md; record the answer and confirm the shape brief.
- [ ] 0.2 Two label members pick their five most frequent staff tasks and re-rate the audit findings 0 to 4; reorder slices 2 to 5 if the ranking changes.

## 1. Stats-led Overview (findings 1, 8)

- [x] 1.1 Codex: confirm or add a bounded read for paid orders not yet shipped (count and oldest paid time) and orders waiting for stock; contract tests. Confirmed: the existing `/api/internal/orders/search` (`status=paid&dispatch=not_shipped`, limit 50) answers both; no backend change.
- [x] 1.2 Claude: build the selected Overview from the Stats read and to-do reads, with independent loading, zero, not-connected and error states; bound recent drafts.
- [x] 1.3 Verify at 195 (200% zoom of 390), 320, 390 and 1440 px, keyboard and 44 px targets; keep the Overview bundle within its budget. 768 and 1280 px, Firefox and physical phones not checked; see validation.md.

## 2. Shared page header (findings 4, 5, 6, 11)

- [x] 2.1 One page-header pattern for all seven areas; remove Back to Overview from top-level areas; name the current area in the phone header; update the staff-workspace spec to seven areas. Done: shared title scale, Overview-only Back links removed, phone header names the area down to 320 px. Desktop left edge: owner kept centred reading columns (option A, 27 October 2026). At 195 px Menu becomes a 44 px icon button that keeps its accessible name, and the area name hides. The change adds a seven-area requirement; at archive, replace "six areas" in the base spec's Shared navigation section by hand.

## 3. Orders triage (finding 2)

- [x] 3.1 Default to orders that need action, show customer name and total, collapse filters on phones, move pagination below the list. "Need action" is paid and not shipped (To ship); orders needing payment review stay on Overview's To do and the Payment status filter.

## 4. Stats detail (finding 3)

- [x] 4.1 Comparison on by default, labelled days and scale, distinct zero and missing states, no filler copy. Applies to the brief; the Explore detail charts were already labelled and are unchanged apart from the comparison default.

## 5. Smaller fixes (findings 7, 9, 10)

- [x] 5.1 Review selection bar overlap, Stock item names and low-stock signal, Catalog toolbar on one row. Done: the Review bar sits flush with the bottom edge and row actions are spaced; Review checkboxes already centre on their titles; Stock rows drop the label name and repeated format and tag 1 to 5 copies online as Low stock; Catalog search, filters and Add share one row. Catalog status starts after a 360 px title column from 1024 px (option C, 28 October 2026). Stock tags "Sold out on the website" beside the format when the accepted snapshot lists the Store Item and its shopper availability is sold out; the inventory read gained `websiteListing` and `availabilityState` (Codex, 28 October 2026).

## 6. Acceptance

- [x] 6.1 Run `pnpm test` for changed staff modules and `pnpm validate` on the final tree; record before/after captures and evidence in validation.md.

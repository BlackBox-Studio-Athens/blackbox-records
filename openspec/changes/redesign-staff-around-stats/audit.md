# Staff audit, 27 October 2026

## Method

- Raw material: the running Local stack (`pnpm dev`, staff on `http://127.0.0.1:8787`), its Local D1 data, the staff source and the earlier Daily brief fixture capture. Hosted usage was not read.
- Captures: eight areas at 1440 × 900 and four at 390 × 844 in headless Chromium (Playwright CLI). Measured heading size and left edge, page overflow, targets under 24 px and console messages. Evidence: `.codex-artifacts/staff-redesign/before/` (ignored).
- Heuristics: Nielsen's ten heuristics, Few's single-screen monitoring rule, GOV.UK "3 or 4 metrics", WCAG 2.2 (1.4.1, 1.4.11, 2.5.8, 1.4.10).
- Severity: Nielsen 0 to 4, from frequency, impact and persistence, raised by one step when the problem blocks a top task. **One rater (Claude) scored these.** NN/g treats a single rater as unreliable; two label members should re-rate before slices 2 and later are fixed.
- Assumed top tasks, to be confirmed by staff: check how the label is doing; ship paid orders; publish website and catalog changes; update stock; add a release.

No console errors or warnings appeared on Overview, Stats, Orders, Stock or Review. No area overflowed at 390 px.

## Ranked findings

| #   | Sev. | Area     | Finding                                                                                                                                                                                                                                                                           | Evidence                                                  |
| --- | ---- | -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------- |
| 1   | 4    | Overview | The landing page shows no figures. "Needs attention" shows "Review orders" without a count, and nothing says how many paid orders wait to ship. Checking the label's state needs Stats and Orders.                                                                                | `d-overview.png`, `m-overview.png`                        |
| 2   | 3    | Orders   | The default list mixes all payment states; the first rows are "Pending payment" checkouts. The Customer / total column shows an order UUID. On a phone the filters fill the first screen; the first order starts near y = 720 of 844. "Next" sits above the table.                | `d-orders.png`, `m-orders.png`                            |
| 3   | 3    | Stats    | Comparison with the previous period is off by default. Day bars have no day labels or scale. The lead sentence ends with filler ("Here's the period at a glance"). Store at €0 draws seven baseline strokes, so zero and missing look alike. A phone shows one source per screen. | `d-stats.png`, `m-stats.png`, Daily brief `brief-390.png` |
| 4   | 3    | All      | Seven areas use five header patterns: H1 at 16, 24, 28 or 44 px, with left edges at 20, 24, 112, 144, 240, 272 and 280 px. Releases' H1 is 16 px, the body size.                                                                                                                  | measured on each area at 1440 px                          |
| 5   | 2    | All      | Every top-level area starts with "Back to Overview", which repeats the top navigation and costs a row on phones.                                                                                                                                                                  | all `d-*.png`                                             |
| 6   | 2    | Shell    | Below 1440 px the header does not name the current area, although the backoffice reference says it does. Review changes is an icon beside the logo.                                                                                                                               | `m-*.png`, `docs/backoffice-design.md`                    |
| 7   | 2    | Review   | Row actions ("Finish editing", "Discard saved changes") show below the sticky selection bar, and row checkboxes do not align with titles. Needs a scroll check before fixing.                                                                                                     | `d-review.png`                                            |
| 8   | 2    | Overview | Recent drafts lists ten entries without age, including Local acceptance fixtures, and competes with the to-do list.                                                                                                                                                               | `d-overview.png`                                          |
| 9   | 2    | Stock    | Item names repeat the label ("BlackBox Records - Disintegration - Black Vinyl LP"). The table touches its outer border at x = 20. No low-stock or sold-out-on-sale signal.                                                                                                        | `d-stock.png`                                             |
| 10  | 1    | Catalog  | Search, sort and Add release take three rows; status sits about 900 px from the title at 1440 px.                                                                                                                                                                                 | `d-items.png`                                             |
| 11  | 1    | Spec     | `staff-workspace` says six areas; Stats is the seventh.                                                                                                                                                                                                                           | `openspec/specs/staff-workspace/spec.md`                  |

## Not established

- Real staff usage frequency: there is no usage record of staff pages. Ask each member to pick their five most frequent tasks before re-rating.
- Hosted Visits and Search data: Local has no Visits source, so Local Stats shows the not-connected state. Previews use labelled sample figures.
- Physical phones, Safari and Firefox.

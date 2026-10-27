# Design

## Context

Staff is the product register (PRODUCT.md: internal operator surfaces are product surfaces by exception). Existing tokens, the 72 px shell, Lucide icons, blue actions and the violet/sage/warm Stats colours stay. The Daily brief (19 October 2026) remains the Stats detail. This change decides what the landing page shows first.

Research summary (sources in the session research, 27 October 2026): Shopify Home and Stripe Home lead with a few metrics above a date control and put open tasks on the same screen; Fathom and Plausible make previous-period comparison one control; Few and GOV.UK recommend three or four metrics on one screen; WCAG 1.4.1 requires change direction in text, not colour alone.

## Decisions settled for every option

- The landing keeps the Overview name and URL. Stats stays as the detail area.
- Four headline figures: Visits, Paid orders, Paid total, Google clicks. Each shows its period, a signed change against the previous period in text, and links to its Stats source.
- One freshness line: read time, UTC days for Visits and Store, Google delay.
- Counted to-do rows: paid orders to ship, orders waiting for stock, saved changes not live. A zero count hides its row; a failed read shows its own retry.
- Zero, not connected and failed read are three different states.
- Period presets on the landing: Today, 7 days (default), 30 days, More (opens the Stats picker).

## Landing layout decision

Bounded preview sketches with labelled sample figures, at 1440 and 390 px:
`.codex-artifacts/staff-redesign/previews/{a-brief-then-todo,b-split-desk,c-week-ledger}-{1440,390}.png`.

- **A · Brief, then to-do**: one 760 px column. Lead sentence, four ruled figure rows, freshness, to-do rows, then quick actions.
- **B · Split desk**: four-figure strip and a labelled visits-per-day chart with paid-order counts, beside a To do rail with quick actions. Phones put To do first.
- **C · Week ledger**: counted to-do chips, then a day-by-day table (visits, orders, paid, Google clicks, what happened) with week and previous-week totals.

Selection: **A · Brief, then to-do**, chosen by the owner on 27 October 2026 ("Build option A, Brief then to-do."). The answer covered the shared decisions above, which were shown with the options. B had been recommended for desktop; A was chosen.

## Risks

- Counts use existing bounded reads, so no backend change was needed: one Orders search for paid, not-shipped orders (limit 50, split by each order's `awaitingStock`), one for orders needing review, and the existing overview read of five unpublished entries per collection. A capped count shows "N+".
- Figure logic lives in `staff-stats` (new export `stats-overview.ts`), order counts in `staff-orders` (`order-todos.ts`) and the draft count in `staff-platform` (`unpublished-changes.ts`), so each is tested by its owning module. Layering is unchanged.
- Overview will load the Stats read; its bundle must stay within the existing Overview limit (129,024 Brotli bytes in the current performance check) and the Free-tier rule.

## Desktop left edge decision

Selection: **A · keep centred**, chosen by the owner on 27 October 2026 ("Keep A: centred reading columns on Overview, Stats, Orders and Images; commit slice 2 as it is."). B, one 24 px left edge for every page, was shown as an injected-CSS preview at 1440 px (`.codex-artifacts/staff-redesign/slice2/left_*.png`) and not built. Titles share one scale; phones share one inset.

# Proposal

## Why

The owner asked for a large staff redesign that fixes the worst problems first and makes stats the landing page. A 27 October 2026 audit of the running Local staff site found that the landing page shows no figures and no counts, so the two most frequent questions ("how is the label doing?" and "what must I ship?") need visits to Stats and Orders. Seven areas also use five different page-header patterns. The ranked findings and their evidence are in [audit.md](audit.md).

## What Changes

- Make the staff landing (`/`, logo, Overview) stats-led: headline figures for the selected period with a signed change against the previous period, data freshness, and links to Stats detail. The layout follows the option the owner selects in [design.md](design.md); no layout is approved yet.
- Put counted to-do items beside the figures: paid orders to ship, orders waiting for stock and saved changes not on the website. Each count links to its filtered destination. Zero items show no row.
- Keep Edit a page, Add to the catalog and Update stock as secondary actions. Bound recent drafts and move complete discovery to Review changes, as today.
- Apply one page-header pattern (title size, left edge, subtitle, actions) to every area, and remove the duplicate Back to Overview link from top-level areas.
- Later slices, in ranked order: Orders triage defaults, Stats chart labels and comparison default, phone header area name, Review selection bar, Stock names and Catalog toolbar.

## Capabilities

### Modified Capabilities

- `staff-workspace`: stats-led Overview with counted to-do items; shared page-header pattern; seven areas including Stats.
- `site-analytics`: Overview reuses the existing protected Stats read for its headline figures.

## Impact

Module exports added without layering changes: `staff-stats` `stats-overview.ts`, `staff-orders` `order-todos.ts`, `staff-platform` `unpublished-changes.ts`. The staff URL allowlist accepts `range` on `/` and `dispatch=not_shipped` on `/orders/`; the latter also fixes the Orders "Not shipped" filter, which was never written to the URL.

Staff shell, Overview, Stats summary and Orders/Stock/Catalog page headers. The Overview counts use existing bounded reads, so slice 1 needed no backend change; later slices that need one go to Codex under the implementation-ownership rule. No public-site, commerce-authority, publication or hosted change. Local implementation only; commits, deployment and hosted checks need separate authorization.

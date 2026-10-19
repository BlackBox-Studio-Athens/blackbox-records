# Proposal

## Why

Staff members need useful reporting on a phone, beyond the current seven/thirty-day controls. The owner approved the Daily brief prototype, its report drill-downs and filters, and explicitly requested direct Codex implementation with real data.

## What Changes

- Replace the Stats landing with the approved mobile-first Daily brief, retaining independent Visits, Store and Google Search details and recovery.
- Offer Today, Yesterday, 7 days, 30 days, 90 days, This month, 12 months and Custom. Start/end fields render only for Custom; preset edits remain drafts until Apply.
- Support report-specific filters, daily/weekly/monthly views, metric selection, prior-period comparisons and browser history.
- Add an Access-protected rich reporting read while preserving existing analytics endpoints. Keep provider credentials in the Worker, use authoritative D1 order facts, and distinguish missing/delayed history from zero.
- Retain bounded joint-dimensional Visits aggregates on the existing daily schedule, allowing future annual filtered reporting without KV, new providers or paid plans.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `site-analytics`: mobile brief, date ranges, real filtered reporting, coverage and aggregate history.
- `module-boundaries`: closed analytics application module shared by protected HTTP reads and the existing scheduled entry.

## Impact

Staff stats/platform modules, backend analytics application, orders and protected HTTP/runtime modules, generated internal API contracts, one additive D1 migration and focused tests. Local implementation and verification only; no commit, push, hosted backfill, publication or deployment is authorized by this task.

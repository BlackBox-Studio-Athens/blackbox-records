# Design

## Context

The owner approved Daily brief and its refined picker in the thread-scoped canvas (19 October 2026, SHA-256 `5775ee03234ffdd6a756eb8e2cbfcebc1e4e2d637939b09cbcaa6ecf98f46c4a`). Current analytics APIs expose separate fixed-range contracts. Preserve those callers and add a richer, source-selected protected report read. Existing Access, no-store responses, safe request logging and Staff navigation remain authoritative.

## Goals / Non-Goals

Implement the selected design with actual provider/D1 aggregates, robust dates/filters, touch/keyboard details and independent source recovery. No synthetic production data, customer-level tracking, new provider/dependency/paid plan, hosted backfill or release operation.

## Decisions

- Add `GET /api/internal/stats` with `source`, one of the eight ranges, optional custom dates, source-specific exact filters and comparison intent. Return one typed report envelope with period/timezone, current/previous metrics, daily availability, facets and breakdowns. Keep the existing three endpoints unchanged for compatibility. A common envelope lets the three reports reuse the approved UI without coupling their loading or failure.
- A closed `analytics` application project owns report orchestration and provider/archive code. Orders exposes aggregate-only filtered Store reporting from its root. HTTP validates input; the application validates upstream shapes and reports safe errors. Generate internal clients from the executable OpenAPI schema.
- Preserve common selected calendar dates: UTC for Visits/Store and the same date strings interpreted in Search Console's Pacific reporting days. Use an exclusive upper bound capped at generation time for D1/Visits. Group weekly/monthly by aggregating counts and weighting Search position by impressions; derive CTR from summed clicks/impressions.
- Store counts orders once using matching-line existence checks. Item/format-filtered money is matching merchandise amounts; the unfiltered paid total includes the retained delivery total. Labels disclose that distinction and do not call these figures profit or net revenue.
- Visits queries joint daily/path/referrer/country/device groups within seven-day provider windows. Bound response size and row count; never treat a limited result as complete. Merge retained days with live days without overlap. Preserve the separately documented launch-gap estimate only where its supplied dimensions support the selected filter; disclose unavailable cross-dimensional attribution.
- Use an additive `SiteAnalyticsDay` table in the existing environment D1. Each complete daily snapshot is at most 64 KiB JSON, preserving joint dimensions; retain at most 730 days per current site. Once daily at 03:00 UTC, replay the previous three days through the existing schedule. A daily collector costs at most three provider requests, three snapshot upserts and one cleanup; no KV or additional cron. Rejected oversized snapshots leave previous data intact. Reads remain read-only. A 730-day maximum is under 48 MiB of payload per site; account usage and a bounded hosted pilot are still required before release acceptance.
- Keep dates, selected report, grouping, metric and per-source filters in Staff URL/history state. Date/filter panels edit local drafts until Apply. Cache snapshots by canonical full query with a small bound, suppress superseded responses and clear data on Access denial. No saved order/customer payloads.
- Reuse Staff controls, typography, icons and scroll roots. The brief is a single column on phones and uses wider space without shrinking touch targets. Load detail chart work only when needed, within the current Stats bundle budget.

## Risks / Trade-offs

- Cloudflare exposes only six months and older samples differ: archive builds prospectively, live available data fills supported dates, and unknown days remain gaps.
- Search can omit low-frequency rows and lag: totals remain authoritative, breakdowns are top available groups and missing dates/previous coverage are disclosed.
- High-cardinality Visits may exceed the bounded collector: fail safely, preserve prior complete data and show partial coverage. Do not silently flatten dimensions.
- Local tests do not prove hosted credentials, actual Free usage or provider acceptance. No hosted mutations are part of implementation.

## Migration Plan

Apply the additive D1 migration through the existing release pipeline before deploying the Worker. Existing endpoints and old data remain usable; rollback code leaves the analytics-only table inert. No backfill is launched by migration. Prepare local migration, worker, contract and browser evidence; release/provider acceptance remains separate.

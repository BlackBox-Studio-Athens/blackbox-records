# Daily brief implementation evidence

Product Environment: Local. The user approved Daily brief and its eight-choice picker and authorized direct Codex implementation. Work remains on primary `main`; no delegation, commit, push, deployment or hosted probe was performed. Unrelated harness, navigation and EmDash work was preserved.

## Implemented behavior

- Staff reads actual aggregate Visits, Store and Google Search reports through the Access-protected `/api/internal/stats` contract. Existing seven/thirty-day endpoints remain compatible. Missing configuration, missing history, delayed Search and transient failure are separate states.
- The mobile brief leads to source details, exact intersecting filters, removable selections, metric choices, daily/weekly/monthly grouping, preceding-period comparisons and accessible bar/date-table inspection. Search CTR and position are weighted by impressions.
- Today, Yesterday, 7 days, 30 days, 90 days, This month, 12 months and Custom are the only choices. Custom alone renders dates; Apply/Cancel and valid Staff URLs preserve independent source state through Back/Forward and direct entry.
- Store queries remain under Orders/persistence ownership, count multi-line orders once, preserve UTC boundaries and distinguish paid totals including delivery from filtered merchandise amounts.
- Migration `0038_site_analytics_day.sql` adds a native-D1 aggregate table. Existing scheduling replays three completed UTC days at 03:00, with per-site/environment idempotence, retention and size limits. GETs do not write history; archive failure is isolated. The Free-tier budget is documented in `docs/cloudflare-free-tier.md`.

## Local acceptance

Selected matrix rows: Staff/editor, commerce aggregate reads, boundaries/tooling, and runtime/environment contracts. Public shell/player and CMS content publication behavior were not changed by this feature; their separately owned acceptance is not claimed here. Browser checks use the canonical Local Staff fixture with the actual compiled Staff UI and deterministic aggregate responses; backend provider fixtures and real Local D1 exercise aggregation independently.

- `pnpm test analytics`: 11 checks, including calendar validation, bounded bodies, intersecting provider filters, Search latency/CTR, archive idempotence, site/environment isolation, retention and oversized captures.
- Staff Stats module: 41 checks, including full-query snapshots, stale response suppression, bounded caching, Access clearing, picker rendering, URL state and weighted grouping. Staff platform tests cover the extended URL validator; HTTP tests cover generated/discovery contracts, protected cache partitioning and real D1 multi-line/boundary/money behavior.
- `pnpm build:staff` passed route isolation and existing bundle limits. Stats: 126,401 initial Brotli JS bytes under 131,072, and 19,808 compressed HTML bytes under 24,576. Evidence: `.codex-artifacts/design/staff-daily-brief/build.log` and `bundle-report.json`.
- Compiled Chromium mobile/touch browser: 69 checks passed, no runtime errors. Widths 320/360/390/430/1280, 200% text on the brief and details, 44 px visible control targets, Custom-only fields, Apply/Cancel, exact API filter propagation, source isolation, Back/Forward, direct entry, keyboard and actual emulated touch inspection, date table, missing Search bars, retained failed-refresh figures, retry and Access clearing. Evidence: `.codex-artifacts/design/staff-daily-brief/browser-check.json`; screenshots `brief-390.png` and `visits-390.png` alongside it. Script: `browser-check.cjs`; canonical fixture served on an owned Local port 4398.
- `pnpm check:boundaries` passed agent guidance, module audit, dependency-cruiser and commerce boundary checks. Strict OpenSpec validation passed. `graphify update .` refreshed the index after the final code batch; its existing missing SQL parser and one unrelated parser warning remain navigation-tool limitations.

## Source-bound repository completion

`pnpm validate` passed in `mode: local` with all 65 selected tasks successful. Accepted summary: `.codex-artifacts/validation/2026-10-19T18-51-19-419Z-2980-1c6f8a/summary.json`. HEAD: `d74678839107383798da44d66a1b768fc2861aca`; matching before/after fingerprint: `a9a6687ab4eb34e7d4fca09a987f65df6ef9cb854d1e308ca276beb44916dc1b` across 105 recorded files, with no source changes during that run. This change remains uncommitted. Earlier interrupted or invalidated runs are not completion evidence.

The final receipt after writing this note and checking the task boxes is `.codex-artifacts/design/staff-daily-brief/final-validation.json`. It records the latest accepted summary path and matching source identities without making this document self-referential. Shared-checkout source changes and temporary formatting/type fixture failures were resolved before acceptance. Local repository validation establishes its selected checks; the independent browser evidence and unverified provider/release limits are recorded separately above and below.

## Limits and release acceptance

No hosted account usage, current provider response, release migration, deployed schedule or physical-phone/Safari behavior was exercised. Browser responses are labelled test fixtures, not production figures. Current provider credentials remain Worker-only. Hosted quota/account headroom and one bounded authorized collection pilot remain release activation checks under the Free-tier rule. Earlier Visits history cannot be invented; missing dates stay gaps while prospective history accumulates. Search uses Pacific dates and reports its latency separately from UTC Visits/Store dates. Without Google completeness metadata, recent empty dates use a conservative three-day delay, explicitly noted in code.

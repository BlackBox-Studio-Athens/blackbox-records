# Design

## Context

The existing public-commerce-http route merges up to five RUM windows before ranking breakdowns. Read-only captures are preserved under `.codex-artifacts/analytics-backfill/2026-10-16T16-08-19-246Z/`. See proposal.md for motivation.

## Decisions

- Use one committed aggregate JSON in the existing HTTP module; it needs no database, migration or provider write. Its rows match the existing RUM merge inputs.
- Scope it to the exact production account and site tag. Add it once after validating all upstream windows, only when the range includes its start and the snapshot ends at or after its exclusive end. Preserve error and not-configured behavior.
- Start at the cutover log's successful DNS switch (10:38:02.269 UTC), not the approximate dispatch time or the artifact's later TLS-complete `cutoverAt` (10:38:08.022). End before the first apex RUM minute (12:19 UTC, including bots), matching the 12:18:54 promotion completion. Exclude the whole boundary minute to prevent overlap.
- Zone analytics permission is absent. The existing token can read account-level `httpRequestsAdaptiveGroups`, constrained to the exact zone and apex, including cache hits. Capture before deriving. Use provider `sum.visits`, whose documented definition is direct or external-referrer page views. Filter GET/200/HTML, public document paths, eyeball requests and known automation. No client IP, full referrer URL or request identifiers are needed.
- `clientRefererHost` is denied by the account dataset. Keep referrer additions empty; do not relabel missing attribution as direct. Country/device values match existing response labels.
- Add 50 page views as a conservative minimum accompanying the 50 visits. Do not add the other 129 human-looking document requests, which include same-site prefetch/navigation and cannot be reconstructed as RUM page views. Record all omissions and sampling in validation.md.
- Advance both the cache name and key to v4. Use the existing merge-by-key, sort and limit; cache the completed result once.

## Risks / Trade-offs

- Adaptive sampling and browser-like unidentified automation can affect the estimate. Preserve the unrounded provider metrics and disclose the limits.
- The conservative page-view count omits real internal navigation that cannot be distinguished from prefetch. Referrer totals exclude the gap.
- No PRD promotion is permitted by this task: pre-existing commit `59eb5884` lies after baseline `ed2657c2`, failing the brief's exclusive-ancestry gate. Push/UAT verification remains authorized; retain the production launch acceptance variable.

## Migration Plan

Run focused Worker tests, strict OpenSpec validation and final affected validation; commit only task-owned files and push after fetching/verifying ancestry. Follow the UAT run and record its deployed SHA. Promotion requires all brief conditions, which currently fail. The aggregate never writes to historical analytics storage.

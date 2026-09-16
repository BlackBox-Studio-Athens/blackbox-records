## Why

BlackBox's low purchase volume does not establish its browsing volume or cache hit rate. The final EmDash topology needs a measured listing-price cache decision that accounts for Pages, the combined Worker, Durable Objects, D1 snapshots, Cloudflare Access, and publication without spending more Free-tier operations than it saves.

## What Changes

- Assess only `/api/store/listing-prices` as the first API cache candidate; inventory existing Static Asset Cache, Document Revalidation, and Same-Session Shell Cache behavior for context.
- Measure the completed EmDash baseline, listing request volume, current snapshot/database work, payload size, and plausible hit rates using bounded, budgeted evidence.
- Compare retaining `no-store`, conditional reads, short browser caching, and supported public edge caching with explicit staleness, invalidation, routing, CORS, and exhaustion costs.
- Produce a concrete keep-fresh or cache proposal for discussion. No TTL, cache technology, extra binding, or runtime cache change is approved by this assessment.
- Keep Store Offer detail, capabilities, checkout, stock, orders, private staff/CMS data, drafts, backups, and publication credentials outside this cache scope.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `cloudflare-free-tier-cache-policy`: Post-EmDash listing-price assessment and explicit decision gate before changing freshness.

## Impact

Blocked until `replace-sveltia-with-emdash-operations` completes final acceptance/handoff and spec reconciliation. On 2026-09-14 the user selected “Discuss listing-price caching first; no TTL agreed yet.” This change completes with an evidence-backed decision and discussion, not a cache rollout. See [the sequence](../verify-http3-transport-coverage/planning-evidence.md).

Initial work affects planning evidence, diagnostics, and runbooks. If caching is later agreed, update this change through the OpenSpec update workflow (or create a separately approved implementation change) with the complete `store-listing-price-presentation` deltas, client/header design, exact freshness limits, resource budget, and rollback before editing runtime behavior. Retaining `no-store` is a valid successful outcome.

## Why

BlackBox's low purchase volume does not establish browsing volume or cache hit rate. The accepted runtime-publication topology needs a measured listing-price decision that distinguishes its existing HTML cache from commerce listing reads and accounts for Pages, renderer/combined Workers, Durable Objects, D1, R2 and Access without spending more Free-tier operations than it saves.

## What Changes

- Assess only `/api/store/listing-prices` as the first API cache candidate; inventory static assets, runtime HTML/media/pointer caching and Same-Session Shell Cache for context without changing those policies.
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

Revised on 2026-09-17 after accepted EmDash cutover and runtime-publication rollout. Reuse their evidence and reconcile current listing/freshness contracts rather than waiting for archive or dormant cleanup. On 2026-09-14 the user selected “Discuss listing-price caching first; no TTL agreed yet.” That decision still applies: this change completes with an evidence-backed discussion, not a cache rollout. See [the current sequence](../verify-http3-transport-coverage/proposal.md).

Initial work affects planning evidence, diagnostics, and runbooks. If caching is later agreed, update this change through the OpenSpec update workflow (or create a separately approved implementation change) with the complete `store-listing-price-presentation` deltas, client/header design, exact freshness limits, resource budget, and rollback before editing runtime behavior. Retaining `no-store` is a valid successful outcome.

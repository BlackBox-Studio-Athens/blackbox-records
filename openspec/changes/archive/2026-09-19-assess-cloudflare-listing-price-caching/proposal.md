## Why

BlackBox's low purchase volume does not establish browsing volume or cache hit rate. The accepted runtime-publication topology needs a measured listing-price decision that distinguishes its existing HTML cache from commerce listing reads and accounts for Pages, renderer/combined Workers, Durable Objects, D1, R2 and Access without spending more Free-tier operations than it saves.

## What Changes

Implementation decision (2026-09-19): the user requested implementation of the plan and the best staff candidates. Retain listing `no-store`; implement only protected hashed-asset browser revalidation and bounded accepted-manifest reuse. No freshness TTL is introduced. The assessment-only statements below describe the earlier research stage; this decision authorizes the staff implementation defined in the design and tasks.

- Assess `/api/store/listing-prices` as the first public API cache candidate; inventory static assets, runtime HTML/media/pointer caching and Same-Session Shell Cache without changing those policies.
- Include the newly introduced staff Overview, Catalog, Website, Images, Review, Stock and Orders surfaces in the applicability review; implement the approved immutable-manifest reuse and private hashed-asset revalidation while preserving mutable reads.
- Measure the completed EmDash baseline, listing request volume, current snapshot/database work, payload size, and plausible hit rates using bounded, budgeted evidence.
- Compare retaining `no-store`, conditional reads, short browser caching, and supported public edge caching with explicit staleness, invalidation, routing, CORS, and exhaustion costs.
- Retain listing no-store following the measured comparison. The subsequent implementation decision approves the two staff mechanisms without a TTL, extra binding or resource.
- Keep Store Offer detail, capabilities, checkout, backups and publication credentials outside implementation scope. Assess staff stock, orders and CMS reads without authorizing shared caching of private data, persistent browser storage, stale action authority, or changes to authentication and refresh contracts.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `cloudflare-free-tier-cache-policy`: Post-EmDash listing-price assessment and explicit decision gate before changing freshness.

On 2026-09-18 the user explicitly expanded the research to newly introduced staff pages. The expansion authorizes this assessment and coherent planning updates, not cache implementation or a TTL. Findings and measurement limits are recorded in [the assessment](assessment.md).

## Impact

Revised on 2026-09-17 after accepted EmDash cutover and runtime-publication rollout. Reuse their evidence and reconcile current listing/freshness contracts rather than waiting for archive or dormant cleanup. On 2026-09-14 the user selected “Discuss listing-price caching first; no TTL agreed yet.” The 2026-09-19 decision retains listing freshness and adds the two staff optimizations without a TTL. See [the current sequence](../verify-http3-transport-coverage/proposal.md).

Implementation affects the existing CMS object's workspace reads and authenticated asset response headers, their regression checks, and operating documentation. Listing behavior is unchanged, so no `store-listing-price-presentation` delta is required. Future listing caching still needs a separate freshness decision. Deployment and archive remain separate actions.

## Context

See [proposal](proposal.md). The user selected listing-price discussion first and has not approved a TTL. Purchase expectations are 2–3 weekly, initially at most 2–3 daily; public browsing, bots, catalog size, and operator/publication activity remain unmeasured. The existing listing endpoint reads persisted snapshots, emits only slug/display-price/presentation state, and uses `no-store`. Its baseline spec explicitly requires one fresh read per Store activation, including cached shell navigation.

EmDash changes content/media ownership and publication but keeps public Pages static. The combined Worker forwards Hono work to CommerceRuntime; CMS has a separate object, D1, R2 and Access boundary. A cache inside that object would not remove entry/object invocations. A public cache ahead of it requires an explicit routing and privacy analysis. Baseline this after EmDash completes, not during its evolving implementation.

## Goals / Non-Goals

Deliver a measured decision and a user discussion. Default to keeping `no-store` until a benefit and acceptable staleness are established. This assessment does not choose a TTL, add a cache, change Store Offer freshness, cache private CMS data, or provision resources. Static asset/document policy is an inventory context, not permission to broaden the change.

## Decisions

### Measure demand and work before selecting storage

Use existing observability and retained request data first. Count listing activations, duplicate requests, user/bot traffic if available, response bytes, D1 rows/queries, CPU, Durable Object invocations/duration, snapshot invalidation frequency, and request distribution by location. Do not infer requests from purchase count. Unavailable analytics remain unknown rather than zero. Explain whether a latency span includes queueing, object placement, D1, or provider work.

Rehearse measurement locally with representative snapshot counts, fixed and pay-what-you-want prices, inactive/missing snapshots, price changes, and newly published/removed items. Avoid importing production data. Reuse existing diagnostics/tests; add a narrow read-only harness only if necessary. A local simulation is not a Cloudflare edge hit-rate measurement.

Before hosted API samples, read account-wide remaining Worker/Object/D1/R2 allowances, include ordinary-service headroom, trace any GET-side repair/write, and set a numeric cap. Begin with at most five no-retry listing requests on the accepted UAT artifact; use fewer if the account budget demands it. Report the measured operation counts and stop on deviation or quota warning. Do not probe Store Offer repair paths or authenticated CMS repeatedly to infer listing cost. PRD validation follows only when necessary and within its own budget.

### Compare explicit candidates

| Candidate                   | Potential benefit                        | Required evidence/cost                                                                                                                              |
| --------------------------- | ---------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| Keep current `no-store`     | Fresh activation, no new cache lifecycle | Baseline latency and operations may already be sufficient                                                                                           |
| Conditional response/ETag   | Less transferred data                    | It saves D1 work only if the validator is available before the expensive read; computing the entire body first still pays that read                 |
| Short browser freshness     | Fewer repeated same-browser calls        | Define exact staleness, per-activation spec changes, old-client behavior, and no stale authority/actions                                            |
| Supported public edge cache | Potentially fewer object/D1 reads        | Verify actual host, Free-plan product eligibility, hit rate per location, invocation savings, CORS correctness, expiry, invalidation and purge cost |

Use the current Cloudflare product documentation at implementation time. Distinguish CDN/Workers response caching from the Workers Cache API and from an origin `fetch()` cache. Setting response headers alone must not be assumed to cache a Worker-generated response. Cache API entries are local to a data center, do not use tiered caching through `cache.put`, and local delete is not global invalidation. Its stale-while-revalidate directives are not automatic background refresh. Current docs also exclude Cache API availability for Access-fronted Workers; do not apply it to the protected combined hostname. No same-origin HTTP self-fetch loop or new Pages Function should be introduced to manufacture a cache layer.

Inspect newer platform features explicitly rather than assuming availability from their names. Reject a feature if actual account/plan/host support cannot be established. Do not add KV: CMS source/generated binding guards remain mandatory. Any new resource or scheduled invalidator needs the separate purpose/owner/budget/exhaustion justification in `docs/cloudflare-free-tier.md`.

### Define the decision before changing freshness

The discussion report must compare reads/bytes saved against fill/revalidation/invalidation work at observed traffic, including misses and low locality. Identify acceptable time until a staff/Stripe price change, deactivation, new item, deletion, and Content Publication appear in public listing presentation. Propose concrete maximum fresh and stale windows only after presenting evidence; zero remains an option. Explain what happens on update failure, origin error, rollback, and quota exhaustion.

A future cache key must isolate Product Environment, canonical hostname/path, representation version, query parameters affecting output, and all supported representation variants. Preserve allowed-origin CORS: never replay a cached `Access-Control-Allow-Origin` from one caller to another; handle preflight separately. Bypass authorization/cookies/session-bearing responses, reject cached `Set-Cookie`, and never cache private/action-bearing metadata or errors as public listing successes. Account for final HATEOAS additions by keeping listing representations presentation-only.

Prefer bounded expiry without distributed invalidation infrastructure if the user's eventual freshness tolerance permits it. If immediate global freshness is required and existing native mechanisms cannot prove it affordably, retain `no-store`. Never make the browser's listing amount, cached or fresh, an accepted checkout price.

## Risks / Trade-offs

- Sparse requests produce few hits → retain `no-store` if the benefit is negligible.
- Read repair causes writes → trace the final route and cap the pilot before sampling.
- Cache survives price change/publication → require an explicit maximum stale bound and failure behavior before approval.
- Public/private origins share deployment → prove route, identity, CORS and cache-key isolation; do not share protected representations.
- Cache fills or invalidation consume Free allowance → measure actual operation types and preserve an uncached fallback.

## Migration Plan

This is an assessment-only change: inventory, rehearse, budget, measure, compare, then discuss. Do not modify runtime headers/fetch settings while completing it. A no-change decision can close the assessment. If a cache is selected, update the proposal/design/tasks and full affected `store-listing-price-presentation` requirements before implementation, recording approved TTLs, actual technology, rollout and purge/fallback behavior. The independent user decision on staleness is a deliberate gate, not an unanswered implementation detail hidden in this design.

## References

- [Workers Cache API](https://developers.cloudflare.com/workers/runtime-apis/cache/).
- [Cloudflare cache control](https://developers.cloudflare.com/cache/concepts/cache-control/).
- [Cache in Workers](https://developers.cloudflare.com/workers/reference/how-the-cache-works/).
- Repository `cloudflare-free-tier-cache-policy`, `store-listing-price-presentation`, and `docs/cloudflare-free-tier.md`.

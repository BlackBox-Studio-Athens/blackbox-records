## Context

See [proposal](proposal.md). The user selected listing-price discussion first and has not approved a TTL. Purchase expectations are 2–3 weekly, initially at most 2–3 daily; public browsing, bots, catalog size, and operator/publication activity remain unmeasured. The existing listing endpoint reads persisted snapshots, emits only slug/display-price/presentation state, and uses `no-store`. Its baseline spec explicitly requires one fresh read per Store activation, including cached shell navigation.

The accepted [runtime publication](../../../docs/content-publication.md) is no longer static-only: Pages serves compiled assets and forwards public GET/HEAD through `PUBLIC_SITE` to a service-only Worker/renderer Durable Object with R2 only. Its HTML responses use `no-store`, while an in-memory HTML cache is bounded to 64 entries/8 MiB and keyed by code/snapshot identity; pointer checks are limited to once per five seconds per active object and accepted versioned media is immutable. These are existing renderer policies, not an approved listing TTL. The combined Worker still forwards Hono listing requests to CommerceRuntime/D1, separately from CMS and renderer. A cache inside CommerceRuntime would not remove entry/object invocations. Do not route commerce through the renderer or give Pages/renderer D1 access to obtain a cache hit.

## Goals / Non-Goals

### Approved staff implementation — 2026-09-19

The user requested implementation of the recommended plan and both staff candidates. This section supersedes the earlier assessment-only restrictions below. Listing and mutable staff responses retain `no-store`; no listing contract delta or TTL is needed.

- Serve successful content-hashed `/_astro/` JS/CSS/font assets with `private, no-cache, must-revalidate`, retaining platform ETags and conditional responses. Require authentication before asset handling on every request, including conditional GET/HEAD. Restrict reuse to assets with validators, no query string, no cookies set, and matching content types. HTML, errors, private media and APIs retain `private, no-store`. No positive freshness lifetime or shared edge cache is introduced.
- Retain one parsed, verified accepted manifest per CMS object, keyed by bucket identity, product environment and SHA. The existing maximum manifest input is 4 MiB; only one completed snapshot is retained. Read the current pointer on every workspace request. A changed SHA is fetched and verified before use; pointer or manifest failures fail the request without stale fallback. Cache only completed values, never request-scoped streams or promises; eviction/restart causes a normal verified read.
- Keep mutable CMS, pending-publication and commerce reads unchanged. No new bindings, writes, scheduled jobs, hosted probes or resources. A warm same-SHA workspace read saves one R2 GET and parse; asset revalidation can save body bytes but still requires Worker/object/auth work. Measure these deterministic savings locally; hosted demand and hit rates remain unknown.
- Verify cache isolation, pointer change/deletion/failure, invalid manifests, fresh drafts, conditional assets and denied access. Run full validation, editor acceptance and relevant local CMS/publication regressions before completion. Rollback restores the asset `no-store` override and removes manifest reuse; mandatory revalidation prevents offline stale asset reuse. Deployment remains a separate action through the existing workflow.

The original assessment phase delivered a measured comparison without runtime changes. The approved follow-up above implements only the two staff optimizations. Store Offer freshness, mutable private CMS responses and provisioned resources remain unchanged.

### Staff applicability expansion

Inventory Overview, Catalog and item creation, Website, Images, Review, Stock and Orders. Trace initial reads, focus/visibility refresh, polling, explicit reloads and writes. Distinguish HTTP caching from existing document-local query deduplication; existing intervals are observed behavior, not new freshness approval.

Rank immutable hashed staff assets and accepted manifests keyed by environment/content digest separately from mutable drafts, stock, prices, orders, permissions and publication status. A manifest reuse candidate must still read the current pointer and validate the selected checksum; it must not turn that digest into a validator for unrelated commerce or draft data. Keep Access and origin authorization on every protected request. Never propose a shared public response cache for private staff representations.

For each candidate record work saved, remaining authorization/pointer/database work, mutation and cross-tab invalidation, identity changes, errors, memory bounds and reset behavior. Research current Cloudflare and installed query-library semantics. Label unmeasured staff demand, payloads, timings and hit rates unknown. Any new hosted staff pilot needs its own local rehearsal, side-effect trace and numeric budget; the five-listing-read allowance is not a staff crawling allowance. Present candidates for discussion without changing runtime code or choosing TTLs.

## Decisions

### Measure demand and work before selecting storage

Use existing observability and retained request data first. Count listing activations, duplicate requests, user/bot traffic if available, response bytes, D1 rows/queries, CPU, Durable Object invocations/duration, snapshot invalidation frequency, and request distribution by location. Do not infer requests from purchase count. Unavailable analytics remain unknown rather than zero. Explain whether a latency span includes queueing, object placement, D1, or provider work.

Reuse [runtime-publication release evidence](../reliable-content-publication/release-evidence.md), including its one 7,252 ms UAT publication sample, only for the work it measured. It is neither listing latency nor cache-hit evidence, and the September 16 account budget is not today's remaining allowance. Attribute public HTML render/pointer/R2 cost separately from listing-price D1/object work. Content snapshot acceptance and Store Offer price-snapshot updates are distinct invalidation sources; a new content snapshot digest alone is not a listing-price validator. Current listing remains one fresh read per activation, even when HTML comes from renderer or browser-shell caches.

Rehearse measurement locally with representative snapshot counts, fixed and pay-what-you-want prices, inactive/missing snapshots, price changes, and newly published/removed items. Avoid importing production data. Reuse existing diagnostics/tests; add a narrow read-only harness only if necessary. A local simulation is not a Cloudflare edge hit-rate measurement.

Before hosted API samples, read account-wide remaining Worker/Object/D1/R2 allowances, include ordinary-service headroom, trace any GET-side repair/write, and set a numeric cap. Begin with at most five no-retry listing requests on the accepted UAT artifact; use fewer if the account budget demands it. Report the measured operation counts and stop on deviation or quota warning. Do not probe Store Offer repair paths or authenticated CMS repeatedly to infer listing cost. PRD validation follows only when necessary and within its own budget.

### Compare explicit candidates

| Candidate                   | Potential benefit                        | Required evidence/cost                                                                                                                              |
| --------------------------- | ---------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| Keep current `no-store`     | Fresh activation, no new cache lifecycle | Baseline latency and operations may already be sufficient                                                                                           |
| Conditional response/ETag   | Less transferred data                    | It saves D1 work only if the validator is available before the expensive read; computing the entire body first still pays that read                 |
| Short browser freshness     | Fewer repeated same-browser calls        | Define exact staleness, per-activation spec changes, old-client behavior, and no stale authority/actions                                            |
| Supported public edge cache | Potentially fewer object/D1 reads        | Verify actual host, Free-plan product eligibility, hit rate per location, invocation savings, CORS correctness, expiry, invalidation and purge cost |

Recheck current Cloudflare product documentation when assessing candidates. Distinguish CDN/Workers response caching from Cache API, origin `fetch()` caching and the existing renderer's in-memory cache. Headers alone do not prove a Worker-generated cache hit. Verify the documented Cache API locality, non-global delete, tiered-cache/stale-refresh and Access restrictions for the actual candidate hostname; sharing a combined deployment does not prove identical public/protected host eligibility. Preserve the existing GET/HEAD Pages service gateway, but do not add commerce routes, self-fetch loops or another Pages Function to manufacture a cache layer.

Inspect newer platform features explicitly rather than assuming availability from their names. Reject a feature if actual account/plan/host support cannot be established. Do not add KV: CMS source/generated binding guards remain mandatory. Any new resource or scheduled invalidator needs the separate purpose/owner/budget/exhaustion justification in `docs/cloudflare-free-tier.md`.

### Define the decision before changing freshness

The discussion report must compare reads/bytes saved against fill/revalidation/invalidation work at observed traffic, including misses and low locality. Identify acceptable time until a staff/Stripe price change, deactivation, new item, deletion and accepted Content Publication appear in listing presentation, distinguishing commerce snapshots from editorial snapshots. Do not use the renderer's five-second pointer interval or sixty-second publication target as listing-price freshness consent. Propose concrete maximum fresh and stale windows only after presenting evidence; zero remains an option. Explain update failure, origin error, rollback and quota exhaustion without reopening unrelated document caching.

A future cache key must isolate Product Environment, canonical hostname/path, representation version, query parameters affecting output, and all supported representation variants. Preserve allowed-origin CORS: never replay a cached `Access-Control-Allow-Origin` from one caller to another; handle preflight separately. Bypass authorization/cookies/session-bearing responses, reject cached `Set-Cookie`, and never cache private/action-bearing metadata or errors as public listing successes. Account for final HATEOAS additions by keeping listing representations presentation-only.

Prefer bounded expiry without distributed invalidation infrastructure if the user's eventual freshness tolerance permits it. If immediate global freshness is required and existing native mechanisms cannot prove it affordably, retain `no-store`. Never make the browser's listing amount, cached or fresh, an accepted checkout price.

## Risks / Trade-offs

- Sparse requests produce few hits → retain `no-store` if the benefit is negligible.
- Read repair causes writes → trace the final route and cap the pilot before sampling.
- Cache survives price change/publication → require an explicit maximum stale bound and failure behavior before approval.
- Public/private origins share deployment → prove route, identity, CORS and cache-key isolation; do not share protected representations.
- Cache fills or invalidation consume Free allowance → measure actual operation types and preserve an uncached fallback.

## Migration Plan

The assessment was followed by the user's 2026-09-19 implementation request. Apply the staff mechanisms above locally, verify the combined artifact and editor behavior, and use the existing reviewed release workflow for any separately requested deployment. Browser assets require revalidation immediately; the manifest slot resets with the object and changes with the fresh pointer. No TTL or listing freshness change is part of this rollout. Restore no-store asset headers and uncached manifest reads to roll back.

## References

- [Workers Cache API](https://developers.cloudflare.com/workers/runtime-apis/cache/).
- [Cloudflare cache control](https://developers.cloudflare.com/cache/concepts/cache-control/).
- [Cache in Workers](https://developers.cloudflare.com/workers/reference/how-the-cache-works/).
- Repository `cloudflare-free-tier-cache-policy`, `store-listing-price-presentation`, and `docs/cloudflare-free-tier.md`.

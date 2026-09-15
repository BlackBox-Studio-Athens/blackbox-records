# Post-EmDash API follow-ups: sequence and planning evidence

## Sequence and gates

All five follow-ups wait for `replace-sveltia-with-emdash-operations` to complete its final accepted implementation/cutover, validation/handoff, and baseline-spec reconciliation. An early M1 checkpoint, a passing Local test, or a partially completed task list does not clear this gate. At execution time use the archived epic if it has moved, record its accepted revision, and reassess the then-current tree and API boundaries. These documents do not authorize parallel implementation during EmDash.

| Follow-up                                                         | Readiness after EmDash                        | Dependency/decision                                      |
| ----------------------------------------------------------------- | --------------------------------------------- | -------------------------------------------------------- |
| [HTTP/3](proposal.md)                                             | Feasibility and verification plan             | Verify every actual host/leg; document platform limits   |
| [RFC 9457](../adopt-rfc9457-problem-details/proposal.md)          | Implementation plan                           | Preserve legacy error fields/client compatibility        |
| [Idempotency](../harden-commerce-request-idempotency/proposal.md) | Implementation plan using low-volume decision | Follow RFC 9457; reuse completed EmDash recovery         |
| [HATEOAS](../add-openapi-hypermedia-discovery/proposal.md)        | Additive discovery/compatibility plan         | Follow RFC 9457; mutation acceptance follows idempotency |
| [Caching](../assess-cloudflare-listing-price-caching/proposal.md) | Assessment and discussion only                | No TTL/mechanism approved; no-store remains default      |

HTTP/3 does not block the application-contract changes. Caching assessment can proceed after EmDash using a stable representation revision; any later implementation must account for the final hypermedia shape. WebSockets/SSE, queues/event sourcing, and RPC migrations are outside these five plans.

## User decisions on 2026-09-14

- Prepare all work for after the EmDash epic, not during it.
- HTTP/3 should be real and cover all feasible levels.
- HATEOAS should assist agent flows without disrupting OpenAPI; improvement remains something to verify, not a fact inferred from adding links.
- For idempotency, choose the most sensible small design for very low traffic: likely 2–3 purchases per week, initially at most 2–3 per day. Checkout/stock retry identity is therefore scoped to existing durable order/ledger state; existing EmDash item/price recovery remains.
- For caching, discuss listing-price caching first; no TTL agreed. This is not permission to enable a cache based on an assumed tolerance.

## Repository observations

Planning base HEAD: `82704cb4be288bb5655f304faeb4ca93b8c472d3`. The tree has extensive pre-existing in-progress EmDash changes, including untracked files, so HEAD is not a fingerprint of the inspected runtime. Hosted requests below were not correlated with a deployed release SHA and are provisional transport observations only. No existing project code or epic artifacts were edited by this planning work.

- `apps/backend/src/index.ts` forwards HTTP to CommerceRuntime and already invokes a typed object method for scheduled paid-order work. Earlier discussion suggesting there was no RPC of any kind was too broad.
- `apps/backend/src/cms/index.ts` separates public commerce, protected internal API, CMS/staff, and private publication handling. Staff assets are marked private/no-store in the observed implementation.
- `apps/backend/src/interfaces/http/responses.ts` already defines `code`, `error`, and optional `requestId`; RFC 9457 is an extension/migration, not the first structured error contract.
- `apps/backend/src/application/commerce/checkout/start-checkout.ts` creates a fresh random order ID for each new call; existing stock hold/provider recovery must be preserved when adding a client attempt identity.
- `record-stock-change.ts` currently has no request identity in its command; `record-stock-count.ts` already has `expectedRevision`.
- `store-listing-price-reader.ts` reads listing snapshots and formats public presentation. `store-listing-price-presentation` requires no-store and one fresh read on each activation, including shell-cache restoration. A future nonzero TTL needs a real spec delta.
- The EmDash tasks already cover a durable catalog operation journal, provider identity recovery and conflicts. Recheck completed coverage before implementation; do not duplicate its mechanism.

## Bounded live transport observations

No hosted application/API, authenticated CMS, D1 mutation, provider operation, checkout creation, zone setting, DNS, or cache configuration was intentionally invoked for these probes. The targeted set was three browser document GETs and two command-line HEADs for public static `robots.txt`. Ordinary browser ancillary requests, if any, were not separately measured; this was not load testing or a Worker/D1 operation audit.

Native browser initialization succeeded, but its UAT robots navigation failed with `net::ERR_BLOCKED_BY_CLIENT` (`bootstrap_ok_but_task_failed`). The documented DevTools fallback opened a temporary isolated context successfully; that tab was closed after three document observations. No browser settings, QUIC flags, network policy, or account permissions were altered.

Browser: Chrome 153, Windows desktop; isolated context `post-emdash-protocol-baseline`, no forced protocol or throttling. Values below are browser Navigation Timing, not full-site performance measurements. Cold DNS/TLS and cache state were not controlled; the second UAT observation was an intentional reload.

| Observed at UTC     | Resource                                                | Negotiated | Status | TTFB ms | Navigation ms | Transfer bytes |
| ------------------- | ------------------------------------------------------- | ---------- | ------ | ------- | ------------- | -------------- |
| 2026-09-14 01:03:54 | `https://blackbox-records-web-uat.pages.dev/robots.txt` | h2         | 200    | 207.6   | 222.1         | 378            |
| 2026-09-14 01:04:21 | Same UAT resource, reload                               | h2         | 200    | 147.2   | 158.7         | 300            |
| 2026-09-14 01:06:32 | `https://blackbox-records-web.pages.dev/robots.txt`     | h2         | 200    | 368.2   | 380.6         | 375            |

At 01:06:37–38 UTC the two HEAD requests each returned HTTP/1.1 200, `Cache-Control: public, max-age=0, must-revalidate`, an ETag, and `Alt-Svc: h3=":443"; ma=86400`. `CF-Cache-Status` was not present in the selected header output. UAT ETag: `2371932e839863184237e0a5b58c972d`; PRD: `952cb20c3bfe172ae2066d2ac327ee89`.

The local `curl.exe` is 8.21.0 with Schannel and **no HTTP2/HTTP3 feature listed**, so its HTTP/1.1 result is a client limitation. It cannot establish HTTP/3 support or absence. The browser observations show h2 for those three requests despite HTTP/3 advertisement; they do not establish why QUIC was not selected or whether another client/network could use it. No HTTP/3 speedup, p95, cache-hit rate, or D1 savings can be inferred from these samples. Worker/staff/media/provider legs still require the post-EmDash measurement plan.

## Primary documentation checked

- [Cloudflare HTTP/3](https://developers.cloudflare.com/speed/optimization/protocol/http3/): available on Free for user-to-edge connections; currently does not support HTTP/3 to origin. Recheck at implementation.
- [RFC 9114](https://www.rfc-editor.org/rfc/rfc9114.html): HTTP semantics over QUIC and fallback when QUIC cannot connect.
- [RFC 9457](https://www.rfc-editor.org/rfc/rfc9457.html): standard problem representation, URI references, extensibility and safety.
- [RFC 8288](https://www.rfc-editor.org/rfc/rfc8288.html) and [OpenAPI Link Object](https://spec.openapis.org/oas/v3.1.1.html#link-object): runtime links and design-time links are distinct.
- [Workers Cache API](https://developers.cloudflare.com/workers/runtime-apis/cache/): per-data-center scope, non-global delete, tiered-cache and Access restrictions; distinguish it from newer Worker-response caching features.
- [Cloudflare cache control](https://developers.cloudflare.com/cache/concepts/cache-control/): CDN stale behavior does not imply Workers Cache API stale refresh. Do not reuse the earlier suggested header recipe without verifying the selected mechanism.
- [Stripe idempotent requests](https://docs.stripe.com/api/idempotent_requests), fetched with `stripe docs /api/idempotent_requests`: provider responses/parameters are tied to the original key and keys may be pruned after at least 24 hours. An imprecise Stripe MCP search returned unrelated material, so the official API reference was used.

## Measurements intentionally deferred

Final Worker/staff negotiation, final deployment identity, complete asset/media coverage, controlled protocol comparison, listing demand/hit rate, D1/DO cost and retry fault tests require the accepted post-EmDash artifact. Historical epic budget numbers are not current remaining allowance. Follow `docs/cloudflare-free-tier.md` before repeated hosted work. No new paid feature, KV binding, queue, cleanup job, or cache implementation is selected here.

## Planning validation

All five changes have proposal, design, delta specs, and tasks artifacts and pass `pnpm openspec -- validate <change> --strict`. Targeted Prettier checks pass and all relative Markdown file links resolve. The task lists contain 53 unchecked future tasks; artifact completeness is not implementation readiness before the EmDash gate. This turn changed planning documents only, so runtime test/build suites were not run. Their required execution is included in behavior-changing implementation tasks.

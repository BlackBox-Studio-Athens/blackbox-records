## Context

See [proposal](proposal.md) for current readiness and sequence. EmDash cutover is accepted. The subsequent [runtime-publication release](../reliable-content-publication/release-evidence.md) adds Pages GET/HEAD forwarding through `PUBLIC_SITE` to a service-only Worker and renderer Durable Object with R2 access. The combined backend still owns protected staff/CMS, `CMS_RUNTIME`, `COMMERCE_RUNTIME` and D1. [Content publication](../../../docs/content-publication.md) owns this topology; the September 14 [transport evidence](planning-evidence.md) predates it and is not current acceptance.

## Goals / Non-Goals

Prove actual HTTP/3 where the runtime and network permit it, document every exception, and retain working fallback. No transport rewrite, custom QUIC stack, provider proxy, forced browser setting, paid plan, local port/base change, or implicit 0-RTT enablement.

## Decisions

### Classify each leg rather than claiming end-to-end QUIC

| Leg                                                                                                                                                   | Planned treatment                                                                                                                                   |
| ----------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| Browser/agent to UAT/PRD public Pages, public assets and published media                                                                              | Measure actual protocol per final hostname, including custom domains and provider subdomains                                                        |
| Browser/agent to public Worker API                                                                                                                    | Measure safe read on actual final hostname; no checkout or provider writes merely for transport evidence                                            |
| Operator to Access-protected staff/CMS/internal API                                                                                                   | Measure after normal authorized login; an Access redirect is not API acceptance                                                                     |
| Pages gateway to PUBLIC_SITE; public Worker to renderer object and R2; CMS to PUBLIC_SITE; combined entry to CommerceRuntime/CmsRuntime, D1/R2/ASSETS | Native service/object/storage bindings: retain them and label protocol control/visibility as platform-managed, not verified HTTP/3                  |
| Calls inside an object/application                                                                                                                    | No network transport to upgrade                                                                                                                     |
| Worker to Stripe, Resend, GitHub/publication and other external HTTPS services                                                                        | Inventory actual SDK/fetch paths; use provider/runtime documentation and available telemetry; no assumption that inbound HTTP/3 propagates outbound |
| Provider webhooks to the Worker                                                                                                                       | Provider chooses client protocol; observe existing delivery telemetry if available, never require QUIC for acceptance                               |
| Local Astro, Wrangler and stripe-mock                                                                                                                 | Preserve loopback HTTP and canonical ports; classify HTTP/3 as unsupported in the ordinary local stack                                              |
| Cloudflare edge to a conventional origin, if a future leg exists                                                                                      | Current Cloudflare documentation says HTTP/3 to origin is unsupported; revisit at implementation time                                               |

Cloudflare's zone HTTP/3 control is not control of `pages.dev` or `workers.dev` zones. Record ownership and actual availability per hostname. Do not introduce new domains merely to make a test pass; any topology change needs its own reviewed scope.

The renderer is service-only: do not expose a hostname to probe it. The Pages gateway remains GET/HEAD-only and must not forward staff cookies/authorization or acquire commerce/D1 authority. Runtime publication activates an R2 snapshot without a GitHub build; inventory retained GitHub release/recovery traffic separately rather than treating it as the ordinary publication path.

### Separate negotiation, reachability, and performance evidence

Use a QUIC-capable browser's network protocol or Navigation/Resource Timing `nextHopProtocol`, corroborated where practical by the inbound Worker `request.cf.httpProtocol` at the entry before internal forwarding. A supported HTTP/3-only client proves a particular leg only when it completes without TCP fallback. Record tool version, timestamp, target identity, network, connection reuse, cache state, HTTP status, negotiated protocol, bytes and timings. `Alt-Svc`, DNS HTTPS records, and settings are supporting discovery evidence only.

Start with confirmed asset-only resources, then budget rendered documents/media and safe public API reads using `docs/cloudflare-free-tier.md`. A public GET is no longer necessarily static: identify gateway, Worker/object, R2 pointer/manifest/media and in-memory cache work; authenticated GETs and provider-repair paths require tracing too. Record both code and accepted snapshot identity. With a comparable baseline, use up to five paired cold/warm samples per selected protocol/profile within an explicitly calculated request/operation cap, report individual values, median and range, and do not infer p95 from five samples. Reuse the retained publication measurements as publication evidence, not transport latency. Only test controlled packet loss/mobile profiles locally or within an approved bounded harness. Do not use automatic retries or background warmers. Abort on quota warnings or unexpected writes.

Check HTTP/2/HTTP/1.1 fallback in a compatible client with QUIC unavailable. Do not enable 0-RTT as part of this change: replay safety is separate from protocol negotiation. Protocol support success does not require proving a speedup; report no benefit or a regression honestly.

## Risks / Trade-offs

- Network or client lacks QUIC → report blocked verification and the exact tool limitation; do not call a header-only check complete.
- Connection reuse/cache effects hide transport differences → retain the per-sample setup and raw values.
- Internal binding forwarding obscures the inbound protocol → observe at the entry, without public debug endpoints or high-cardinality logs.
- Repository and deployed revisions differ → identify the actual gateway/renderer/CMS artifacts and snapshot; preserve old h2 samples without presenting them as current coverage.

## Migration Plan

Snapshot only the affected non-secret host/zone settings, verify eligible UAT hosts, and enable supported controls there if needed. PRD settings remain a separately reviewed rollout after UAT proof and ordinary release authorization; do not deploy or change DNS/apex as a diagnostic shortcut. Roll back only changed settings to their snapshot and recheck fallback. Completion requires every leg to be observed or assigned a documented justified limitation; an eligible, testable leg left unverified remains outstanding.

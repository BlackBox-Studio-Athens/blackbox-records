## Context

See [proposal](proposal.md) and [planning evidence](planning-evidence.md). The EmDash epic is still changing the working tree. Its accepted target is public Pages plus a combined backend with protected staff/CMS, `CMS_RUNTIME`, `COMMERCE_RUNTIME`, D1, and private R2. Implementation starts only after that epic's final acceptance and spec reconciliation.

## Goals / Non-Goals

Prove actual HTTP/3 where the runtime and network permit it, document every exception, and retain working fallback. No transport rewrite, custom QUIC stack, provider proxy, forced browser setting, paid plan, local port/base change, or implicit 0-RTT enablement.

## Decisions

### Classify each leg rather than claiming end-to-end QUIC

| Leg                                                                            | Planned treatment                                                                                                                                   |
| ------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| Browser/agent to UAT/PRD public Pages, public assets and published media       | Measure actual protocol per final hostname, including custom domains and provider subdomains                                                        |
| Browser/agent to public Worker API                                             | Measure safe read on actual final hostname; no checkout or provider writes merely for transport evidence                                            |
| Operator to Access-protected staff/CMS/internal API                            | Measure after normal authorized login; an Access redirect is not API acceptance                                                                     |
| Entry Worker to CommerceRuntime/CmsRuntime, asset binding, D1, R2              | Native platform bindings: retain them and label protocol control/visibility as platform-managed, not verified HTTP/3                                |
| Calls inside an object/application                                             | No network transport to upgrade                                                                                                                     |
| Worker to Stripe, Resend, GitHub/publication and other external HTTPS services | Inventory actual SDK/fetch paths; use provider/runtime documentation and available telemetry; no assumption that inbound HTTP/3 propagates outbound |
| Provider webhooks to the Worker                                                | Provider chooses client protocol; observe existing delivery telemetry if available, never require QUIC for acceptance                               |
| Local Astro, Wrangler and stripe-mock                                          | Preserve loopback HTTP and canonical ports; classify HTTP/3 as unsupported in the ordinary local stack                                              |
| Cloudflare edge to a conventional origin, if a future leg exists               | Current Cloudflare documentation says HTTP/3 to origin is unsupported; revisit at implementation time                                               |

Cloudflare's zone HTTP/3 control is not control of `pages.dev` or `workers.dev` zones. Record ownership and actual availability per hostname. Do not introduce new domains merely to make a test pass; any topology change needs its own reviewed scope.

### Separate negotiation, reachability, and performance evidence

Use a QUIC-capable browser's network protocol or Navigation/Resource Timing `nextHopProtocol`, corroborated where practical by the inbound Worker `request.cf.httpProtocol` at the entry before internal forwarding. A supported HTTP/3-only client proves a particular leg only when it completes without TCP fallback. Record tool version, timestamp, target identity, network, connection reuse, cache state, HTTP status, negotiated protocol, bytes and timings. `Alt-Svc`, DNS HTTPS records, and settings are supporting discovery evidence only.

Start with tiny static resources and safe public API reads. Budget application reads using `docs/cloudflare-free-tier.md`; authenticated GETs and provider-repair paths require tracing before use. With a final baseline available, use five paired cold/warm samples per selected protocol/profile within an explicitly calculated request/operation cap, report individual values, median and range, and do not infer p95 from five samples. Only test controlled packet loss/mobile profiles locally or within an approved bounded harness. Do not use automatic retries or background warmers. Abort on quota warnings or unexpected writes.

Check HTTP/2/HTTP/1.1 fallback in a compatible client with QUIC unavailable. Do not enable 0-RTT as part of this change: replay safety is separate from protocol negotiation. Protocol support success does not require proving a speedup; report no benefit or a regression honestly.

## Risks / Trade-offs

- Network or client lacks QUIC → report blocked verification and the exact tool limitation; do not call a header-only check complete.
- Connection reuse/cache effects hide transport differences → retain the per-sample setup and raw values.
- Internal binding forwarding obscures the inbound protocol → observe at the entry, without public debug endpoints or high-cardinality logs.
- Post-EmDash hostnames differ from today's deployment → rebaseline after completion and preserve historical observations as provisional.

## Migration Plan

Snapshot only the affected non-secret host/zone settings, verify eligible UAT hosts, and enable supported controls there if needed. PRD settings remain a separately reviewed rollout after UAT proof and ordinary release authorization; do not deploy or change DNS/apex as a diagnostic shortcut. Roll back only changed settings to their snapshot and recheck fallback. Completion requires every leg to be observed or assigned a documented justified limitation; an eligible, testable leg left unverified remains outstanding.

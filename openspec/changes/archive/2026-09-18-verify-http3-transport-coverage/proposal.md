## Why

BlackBox needs evidence of real HTTP/3 on every feasible network leg, rather than inferring support from a Cloudflare setting or an `Alt-Svc` header. EmDash cutover is accepted; coverage must now include the subsequently shipped accepted-snapshot renderer as well as commerce and staff/CMS.

## What Changes

- Inventory every client, hosting, internal binding, storage, and external-provider leg in Local, UAT, and PRD; distinguish observed HTTP/3, eligible-but-unverified, unsupported, platform-managed, and non-network calls.
- Enable HTTP/3 on eligible owned hosted surfaces when supported on Free, preserving HTTP/2/HTTP/1.1 fallback and existing authentication, routes, and release gates.
- Require protocol evidence and bounded, comparable transport measurements; header advertisement alone never proves negotiation.
- Record documented limitations instead of introducing proxies, paid services, or a new local HTTPS launcher to force HTTP/3.

## Capabilities

### New Capabilities

- `http-transport-coverage`: Feasible HTTP/3 coverage, per-hop evidence, fallback, and bounded verification.

### Modified Capabilities

None.

## Impact

Revised against repository HEAD `901cb0fa` on 2026-09-17. The [September 15 EmDash acceptance](../../../docs/cms-cutover.md#final-acceptance--live-september-15-2026) clears the original milestone prerequisite; deferred dormant cleanup and archive status are not new blockers. [Runtime-publication release evidence](../reliable-content-publication/release-evidence.md) subsequently records accepted UAT/PRD code `7cbc58d8a2ccc0620dcb65eaa82318237a4422c0`. Neither receipt proves the current deployed revision: identify it before hosted measurements and reconcile only affected contract differences before implementation.

Current sequence: HTTP/3 is independent; [RFC 9457](../adopt-rfc9457-problem-details/proposal.md) precedes [checkout/stock idempotency](../harden-commerce-request-idempotency/proposal.md) and [HATEOAS](../add-openapi-hypermedia-discovery/proposal.md), whose checkout/stock mutation acceptance follows idempotency. [Listing-price caching](../assess-cloudflare-listing-price-caching/proposal.md) remains assessment/discussion only, with no TTL approved. The [September 14 planning evidence](planning-evidence.md) is historical, including its former gate and protocol samples; this revision supersedes its readiness statements. RPC migrations, WebSockets/SSE and new event infrastructure remain outside scope.

Expected surfaces: Cloudflare zone settings, public Pages assets and GET/HEAD gateway, service-only public renderer, combined backend hostnames, existing observability/runbooks, and a bounded transport diagnostic if existing tools are insufficient. `PUBLIC_SITE`, Worker/Durable Object/D1/R2 and asset bindings remain platform-managed, not public origin connections. Third-party transport and unsupported hops remain explicit limitations. No deployment or configuration change is authorized by preparing this plan.

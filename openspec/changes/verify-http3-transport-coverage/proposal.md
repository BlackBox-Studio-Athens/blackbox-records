## Why

BlackBox needs evidence of real HTTP/3 on every feasible network leg, rather than inferring support from a Cloudflare setting or an `Alt-Svc` header. Complete this only after the EmDash epic establishes the final combined Worker, staff/CMS, and publication topology.

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

Implementation is blocked until `replace-sveltia-with-emdash-operations` is complete, its final acceptance/handoff exists, and its specs are reconciled. Re-inventory the final tree before implementation; current working-tree observations are provisional. See [the sequence and planning evidence](planning-evidence.md).

Expected surfaces: Cloudflare zone settings, deployed public Pages and combined backend hostnames, existing observability/runbooks, and a bounded transport diagnostic if existing tools are insufficient. Worker/Durable Object/D1/R2 bindings remain platform-managed, not public origin connections. Third-party transport and unsupported hops remain explicit limitations. No deployment or configuration change is authorized by preparing this plan.

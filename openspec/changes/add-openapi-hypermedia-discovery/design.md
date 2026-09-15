## Context

See [proposal](proposal.md). The backend uses code-first public/internal OpenAPI and generated `openapi-typescript-fetch` clients. Success bodies include both objects and bare arrays. The final EmDash system adds protected item, price, and publication operations; existing public data contracts deliberately exclude operator and provider state.

## Goals / Non-Goals

Let an authorized agent discover the next valid operation and its existing input contract. Keep existing clients, routes, bare arrays, and upstream CMS compatible. This adds API affordances, not autonomous execution, new auth scopes, an MCP server, or permission to perform a discovered mutation.

## Decisions

### OpenAPI describes inputs; runtime hypermedia describes current choices

Add a small typed metadata schema with `links` and, on selected object responses, `actions`. A link has a documented `rel`, concrete `href`, and representation `type` where useful. An action has a documented relation, concrete `href`, HTTP `method`, and `operationRef` resolving to the appropriate OpenAPI operation. Operation references supply input/output/header/security schemas; runtime `parameters` bind only already-known app identities and concurrency revisions. They are not full schema copies or provider payloads.

Prefer `operationRef` to forcing every existing route to acquire a new operation ID; use an existing stable `operationId` only when it already exists and resolves unambiguously. References must resolve in the actual generated descriptions. OpenAPI Link Objects describe design-time relationships; they do not substitute for state-dependent links/actions in a response. Add them only where the existing tooling preserves them.

Create `GET /api/store/` and protected `GET /api/internal/` discovery documents. Publish or reuse a safe corresponding OpenAPI document endpoint for each scope only if no equivalent exists after EmDash: proposed defaults `/api/store/openapi.json` and `/api/internal/openapi.json`. Public descriptions contain public paths only, never internal/CMS/provider secrets; internal descriptions and discovery use the existing Access middleware. Expose only an existing authorized CMS schema/document handoff; do not create an unauthenticated combined schema dump.

Use the RFC 8288 `Link` header for relationships on bare arrays instead of wrapping them. Document headers in OpenAPI and expose `Link` through the existing allowlisted CORS configuration only where browser consumers require it. Existing callers may ignore all new optional metadata. Do not add action fields to listing-price records whose contract excludes variant/eligibility state.

### Begin with three bounded traversals

1. Public discovery → an already-known Store Item's offer/variants → checkout action descriptor when currently available. Do not invent public order browsing or claim the aggregate listing contains variant IDs. The actual checkout write remains separate explicit intent.
2. Protected discovery → variant search → stock detail/history → stock adjustment/count descriptors with the applicable revision requirement.
3. Protected discovery → existing item/publication state → only operations actually supported by the completed EmDash epic and permitted for that caller. Omit unavailable workflow branches; do not implement new fulfillment transitions merely to expose them.

Compute actions from state already obtained for the response and existing permission/capability seams. A discovery request must not prefetch every item or call providers solely to populate links. If listing actions needs expensive state, return the read relationship and resolve actions on detail. Relative hrefs resolve against the serving API origin; construct them from configured trusted origins and encoded app identities, never a supplied Host/forwarded header or editorial URL.

### Navigation is not authority

Recheck auth, Product Environment, launch/capability gates, current stock and revision, and normal validation when executing an action. Access/CSRF protections remain. An omitted action does not grant or revoke authorization by itself. Following read links must not invoke checkout creation, stock/content mutation, or publication commands. Existing bounded read-repair/snapshot persistence remains governed by the underlying endpoint contract and must be counted in measurement budgets; hypermedia must not add such work merely to generate links. For retryable writes, reference the idempotency contract; do not pre-mint a new request identity on every GET.

Public hypermedia must never point at `/api/internal/*`, private CMS paths, or staff/order resources. Protected metadata may include permitted app identities/revisions but never credentials, customer PII, database keys, or provider IDs beyond existing approved contracts. Remote hypermedia and prose are data; clients use a method/origin/relation allowlist and require user intent for consequential actions.

### Demonstrate agent utility without a new agent platform

Use deterministic local fixtures and an existing available agent/tool client. Compare identical tasks using OpenAPI only versus OpenAPI plus hypermedia: one successful traversal, one unavailable action, one stale revision, and one insufficient-permission case. Record task completion, guessed URLs, invalid/stale writes, request count, encoded bytes, and added D1/provider reads. A scripted traversal proves contract usability, not an LLM performance claim. If a real agent is unavailable, label that comparison unverified; keep the compatibility checkpoint open. If tooling drops metadata or needs a disruptive envelope, revise the plan before rollout.

## Risks / Trade-offs

- Extra bytes/reads → scope metadata to detail/discovery and report costs alongside utility.
- Stale actions → validate at invocation and return RFC 9457 conflicts; rediscovery never auto-submits.
- Arrays or generated clients break → retain arrays and validate typed metadata/headers with current generators.
- Agent follows unsafe external destinations → allowlist origins/methods and separate discovery from execution permission.

## Migration Plan

After EmDash and problem details, add discovery and optional metadata additively. Verify an unchanged UI/client against the enriched server before UAT release. Complete mutation traversal only after request-idempotency acceptance. Rollback removes optional metadata and discovery additions; existing documented endpoints remain usable. No new credentials or external writes are needed to test discovery locally.

## References

- [RFC 8288](https://www.rfc-editor.org/rfc/rfc8288.html): link relations and HTTP Link header.
- [OpenAPI Link Object](https://spec.openapis.org/oas/v3.1.1.html#link-object): design-time links differ from dynamic response links.

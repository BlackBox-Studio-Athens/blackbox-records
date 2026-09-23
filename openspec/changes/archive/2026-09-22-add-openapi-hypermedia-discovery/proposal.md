## Why

Agent clients can use explicit links and currently available actions to navigate workflows without guessing routes. BlackBox should test that benefit while keeping code-first OpenAPI, generated clients, public/operator isolation, and existing response shapes intact.

## What Changes

- Add minimal public and Access-protected discovery resources, with links to the corresponding safe API description and supported workflows.
- Add optional typed runtime links/actions to selected object responses; keep collection arrays and existing route contracts compatible.
- Describe action inputs through existing OpenAPI operations, using stable operation identities and runtime bindings rather than copying validation schemas into every response.
- Expose only actions supported by current state and caller permissions; validate authorization and preconditions again when an action is invoked.
- Compare fixed agent traversal tasks with the existing OpenAPI-only baseline; record completion, wrong/stale action attempts, request count, bytes, and added backend reads.

## Capabilities

### New Capabilities

- `api-hypermedia-discovery`: OpenAPI-compatible runtime navigation and action discovery for public and protected clients.

### Modified Capabilities

None. Existing success-contract and public data boundaries continue to apply.

## Impact

Revised on 2026-09-17 after accepted EmDash cutover and runtime-publication rollout. Reuse their receipts and reconcile affected current contracts, without waiting for archive or dormant cleanup. Apply after `adopt-rfc9457-problem-details`; checkout/stock mutation acceptance follows `harden-commerce-request-idempotency`. Existing item/price/publication operations keep their own accepted request-identity contracts. Read-only discovery can be prepared first; advertising a write never grants permission to execute it.

Expected surfaces: Hono contracts/route registration, separate OpenAPI descriptions, generated clients, protected staff item/stock/order/publication discovery, and small Local traversal fixtures. Native CMS runtime-publication operations are not in the current Hono documents; link to permitted existing read/UI handoffs, not invented operation references. No CMS fork, new schema system, MCP server, generic agent executor, new auth credential, or blanket response wrapper. See [the current sequence](../verify-http3-transport-coverage/proposal.md).

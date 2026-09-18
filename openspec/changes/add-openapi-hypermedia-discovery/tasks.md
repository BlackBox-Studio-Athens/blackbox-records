## 1. Confirm prerequisites and compatibility

- [x] 1.1 Run `pnpm openspec:guard`, reuse EmDash/runtime-publication acceptance, reconcile affected current contracts
      and confirm RFC 9457 acceptance; inventory Hono-documented operations separately from native CMS routes and
      service-only controls, reusing existing descriptions where available.
- [x] 1.2 Prove optional object metadata and array Link headers survive the current Zod/OpenAPI generation and
      `openapi-typescript-fetch` clients; verify unchanged client fixtures still read original response shapes before
      expanding route coverage.

## 2. Add scoped discovery and actions

- [x] 2.1 Define the minimal typed link/action metadata and resolvable operation references; verify every reference maps
      to the appropriate generated operation and parameter/header/body contract without duplicated validation schemas.
- [x] 2.2 Add or reuse public/protected discovery and API-description endpoints; verify Access protection, public
      document filtering, safe origins and the absence of internal/provider/CMS secrets from public discovery.
- [x] 2.3 Add selected public Store Offer detail relationships and existing checkout action descriptors; verify
      unavailable gates omit the action, listing-price records stay presentation-only, and actual checkout independently
      revalidates authority.
- [x] 2.4 Add protected stock/item/price/item-publication relationships from current Hono contracts; use only existing
      permitted read/UI links for native CMS operations without schemas. Verify resolvable references,
      same-origin/X-Blackbox-Request/live-confirmation guards, revisions, permissions and durable publication identity
      without adding business actions.
- [x] 2.5 Preserve array bodies with documented Link headers and narrowly expose headers through existing CORS; verify
      hostile origins, encoded app identities, malformed links, and metadata-free legacy responses with contract tests.

## 3. Demonstrate useful agent flows

- [x] 3.1 Complete checkout/stock request-idempotency before those mutation flows are accepted; reuse existing
      item/price/publication journals and request IDs for their flows. Verify metadata does not change native request
      identity, issue keys on GET or auto-execute writes.
- [x] 3.2 Compare the same public and protected tasks with OpenAPI-only versus hypermedia-assisted local fixtures;
      deliver task outcomes, guessed/invalid/stale actions, requests, bytes and added database/provider work, distinguishing
      scripted traversal from actual agent evaluation.
- [ ] 3.3 Verify an actual available agent can discover and traverse the approved local workflows without guessed routes
      or enlarged credentials; preserve explicit intent for mutations and record unavailable agent evidence as outstanding
      rather than claiming improved success.
- [x] 3.4 Run generated-client and commerce/module-boundary checks plus `pnpm validate`, `pnpm validate:editor`,
      applicable Local CMS/publication checks and strict OpenSpec validation; retain final source fingerprints. If
      ownership/entrypoints change, reconcile the module-boundary spec and manifest in the same slice, then verify additive
      rollout/rollback through normal code promotion.

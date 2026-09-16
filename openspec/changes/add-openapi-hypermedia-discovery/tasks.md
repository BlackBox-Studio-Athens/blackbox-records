## 1. Confirm prerequisites and compatibility

- [ ] 1.1 Run `pnpm openspec:guard`, verify completed EmDash acceptance/cutover/handoff and spec reconciliation, then confirm RFC 9457 acceptance; record final public/internal/CMS operation and permission inventories, reusing existing discovery/schema endpoints if present.
- [ ] 1.2 Prove optional object metadata and array Link headers survive the current Zod/OpenAPI generation and `openapi-typescript-fetch` clients; verify unchanged client fixtures still read original response shapes before expanding route coverage.

## 2. Add scoped discovery and actions

- [ ] 2.1 Define the minimal typed link/action metadata and resolvable operation references; verify every reference maps to the appropriate generated operation and parameter/header/body contract without duplicated validation schemas.
- [ ] 2.2 Add or reuse public/protected discovery and API-description endpoints; verify Access protection, public document filtering, safe origins and the absence of internal/provider/CMS secrets from public discovery.
- [ ] 2.3 Add selected public Store Offer detail relationships and existing checkout action descriptors; verify unavailable gates omit the action, listing-price records stay presentation-only, and actual checkout independently revalidates authority.
- [ ] 2.4 Add protected stock/item/publication relationships from final EmDash workflows and current permissions; verify stale revisions and revoked permissions are rejected at invocation and no new business action is implemented solely for discovery.
- [ ] 2.5 Preserve array bodies with documented Link headers and narrowly expose headers through existing CORS; verify hostile origins, encoded app identities, malformed links, and metadata-free legacy responses with contract tests.

## 3. Demonstrate useful agent flows

- [ ] 3.1 Complete the request-idempotency prerequisite before mutation-flow acceptance; verify retry action metadata references that contract without issuing fresh keys on GET or auto-executing writes.
- [ ] 3.2 Compare the same public and protected tasks with OpenAPI-only versus hypermedia-assisted local fixtures; deliver task outcomes, guessed/invalid/stale actions, requests, bytes and added database/provider work, distinguishing scripted traversal from actual agent evaluation.
- [ ] 3.3 Verify an actual available agent can discover and traverse the approved local workflows without guessed routes or enlarged credentials; preserve explicit intent for mutations and record unavailable agent evidence as outstanding rather than claiming improved success.
- [ ] 3.4 Run generated-client and commerce/module-boundary checks plus `pnpm test:unit`, `pnpm check`, `pnpm build` and strict OpenSpec validation; if ownership/entrypoints change, reconcile the module-boundary spec and manifest in the same slice, then verify additive rollout/rollback through normal promotion.

## 1. Confirm final boundaries

- [ ] 1.1 Run `pnpm openspec:guard` and verify completed EmDash acceptance/cutover, handoff and spec reconciliation; record the accepted revision and inventory app-owned versus upstream JSON/auth/webhook/streaming error boundaries before implementation.
- [ ] 1.2 Verify current client parsing of `application/problem+json` and old/new response combinations with small fixtures; deliver the compatibility result before changing the server media type.

## 2. Adopt the shared problem contract

- [ ] 2.1 Extend the shared error schema/helper and safe problem registry with standard members plus existing extensions; verify status equality, stable type/title, `error === detail`, optional correlation and no-store headers in targeted tests.
- [ ] 2.2 Migrate app-owned Hono validation, expected errors, HTTPException, not-found and unexpected errors through that helper; verify safe responses retain required CORS/auth headers and omit raw validator/provider/internal data.
- [ ] 2.3 Adapt only BlackBox-owned CMS/publication JSON guards as identified by the final inventory; verify upstream EmDash contracts, Access pages, signed webhook acknowledgement behavior and stream/non-JSON responses remain compatible.
- [ ] 2.4 Regenerate public/internal API documents and clients using `pnpm generate:api`, update consumer normalization and mocks where required; verify actual response media/schema matches generated contracts and success bodies remain unchanged.

## 3. Compatibility and release

- [ ] 3.1 Test old client/new server, new client/old server, unknown problem extensions/types, malformed/HTML auth failures, and rollback; verify no legacy client requires immediate upgrade to display a safe error.
- [ ] 3.2 Run `pnpm test:unit`, `pnpm check`, and `pnpm build` on the final tree, then strict OpenSpec validation; record results and a complete route-family migration/exception inventory.
- [ ] 3.3 Release through normal UAT/PRD promotion with the compatible reader/server ordering from the design; verify a small budgeted set of non-mutating failure responses and retain the legacy message extension for rollback.

## 1. Confirm final boundaries

- [ ] 1.1 Run `pnpm openspec:guard`, reuse accepted EmDash/runtime-publication receipts and record the implementation revision; inventory Hono, app-owned CMS string-code/nested-object errors, active runtime versus retained publication routes, upstream/auth/webhook/renderer exceptions, and reconcile affected contracts without reopening cutover.
- [ ] 1.2 Verify current client parsing of `application/problem+json` and old/new response combinations with small fixtures; deliver the compatibility result before changing the server media type.

## 2. Adopt the shared problem contract

- [ ] 2.1 Extend the shared problem base/builder and registry with explicit per-family legacy extensions; verify status equality, stable type/title, Hono `error === detail`, unchanged CMS error types/codes, optional correlation, and existing private/no-store headers with fixtures.
- [ ] 2.2 Migrate app-owned Hono validation, expected errors, HTTPException, not-found and unexpected errors through that helper; verify safe responses retain required CORS/auth headers and omit raw validator/provider/internal data.
- [ ] 2.3 Adapt only inventoried app-owned CMS/publication JSON guards through the context-independent builder; verify existing CMS string-code/nested-object consumers and runtime publication recovery stay compatible, without changing upstream EmDash, Access, webhook or renderer/non-JSON protocols.
- [ ] 2.4 Regenerate public/internal Hono documents and clients using `pnpm generate:api`, covering current delivery-quote and item/price/publication routes; verify media/schema and unchanged success bodies. Check native CMS contracts with existing fixtures separately rather than claiming they are in the Hono documents.

## 3. Compatibility and release

- [ ] 3.1 Test old/new client/server combinations for Hono, CMS string-code and nested-object errors, unknown problem extensions/types, malformed/HTML auth failures, and rollback; verify safe family-specific fallback and no forced immediate client upgrade.
- [ ] 3.2 Run `pnpm validate`, `pnpm validate:editor`, and relevant Local CMS/publication checks in `docs/content-publication.md` and `docs/content-workspace.md`, then strict OpenSpec validation; retain the final source fingerprint and complete migration/exception inventory. Partial gates do not establish completion.
- [ ] 3.3 Release through normal UAT/PRD promotion with the compatible reader/server ordering from the design; verify a small budgeted set of non-mutating failure responses and retain the legacy message extension for rollback.

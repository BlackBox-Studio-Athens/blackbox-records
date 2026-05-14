---
plan_id: 12-03
phase: 12
status: completed
completed: 2026-05-14
---

# 12-03 Summary - Backend Commerce Boundary Hardening

## Completed

- Moved public commerce OpenAPI route definitions and schemas into the public contract surface.
- Split checkout return URL allowlist policy into a public-commerce HTTP helper with direct characterization tests.
- Exported checkout start command types through the checkout-core root entrypoint for route composition.
- Replaced empty public/internal contract placeholders with explicit public route modules and internal route path ownership.
- Updated OpenAPI document tests to compare emitted paths against the named contract surfaces.
- Declared the new return URL helper/test ownership in the public-commerce module canvas and boundary manifest.

## Verification

- `pnpm --filter @blackbox/backend test -- test/http/public-commerce-routes.test.ts test/http/public-checkout-return-url.test.ts test/http/internal-stock-routes.test.ts test/http/internal-order-routes.test.ts test/openapi/api-documents.test.ts`
- `pnpm --filter @blackbox/api-client test`
- `pnpm generate:api`
- `pnpm audit:module-boundaries`
- `pnpm depcruise:boundaries`
- `pnpm audit:commerce-boundaries`
- `pnpm test:unit`
- `pnpm check`
- `pnpm build`

## Notes

- API generation produced no generated public/internal schema or client diffs.
- No D1 migrations, Prisma generated client changes, Stripe gateway changes, Worker env changes, or frontend checkout UX changes were introduced.
- Browser Use acceptance was not required because this slice changed backend HTTP boundaries and tests, not rendered checkout/operator UI.

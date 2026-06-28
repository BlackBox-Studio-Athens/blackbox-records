## Why

Backend routes currently return errors as hand-built `{ "error": "..." }` objects, with duplicated schemas and response helpers across public, internal, webhook, 404, and fallback handlers. This keeps today working, but makes it easy for new routes to drift from OpenAPI, generated clients, cache headers, and safe-error logging.

## What Changes

- Standardize the error body shape, including status-safe messages, stable machine codes, and request correlation.
- Keep frontend-readable messages browser-safe and avoid provider payloads, secrets, D1 binding details, stack traces, and raw validation dumps.
- Centralize error response creation and error OpenAPI schemas in the HTTP interface layer.
- Separately centralize shared JSON response mechanics, especially no-store headers, without adding a universal success envelope.
- Update generated client consumers in the same implementation slice.

## Capabilities

### New Capabilities

- `backend-error-responses`: Standardized Worker API error response bodies, OpenAPI schemas, safe error mapping, and client compatibility rules.
- `backend-response-mechanics`: Shared Worker JSON response mechanics such as no-store headers and route-specific success response boundaries.

### Modified Capabilities

- None.

## Impact

- Affected backend code: `apps/backend/src/interfaces/http/**`, especially `error-handler.ts`, `not-found-handler.ts`, `contracts/`, and route registration files.
- Affected frontend/client code: `packages/api-client`, `apps/web/src/lib/backend/*`, and tests that parse `body.error`.
- API impact: error responses become a documented contract instead of ad hoc route objects; implementation must preserve or deliberately migrate existing browser message behavior.
- Dependency impact: no new dependency planned; use Hono's built-in `HTTPException` and `app.onError` with a small repo helper.

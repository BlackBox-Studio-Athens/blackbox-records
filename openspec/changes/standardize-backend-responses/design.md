## Context

The backend uses Hono 4.12.22, `@hono/zod-openapi`, generated API clients, and route-local JSON responses. Current errors are mostly `{ error: string }`, including newsletter, checkout, internal stock/order, webhook, 404, and fallback 500 paths. Frontend consumers already parse `body.error`, so replacing that field would be a breaking API/client migration.

Research:

- Hono supports `HTTPException` plus `app.onError`; Hono docs also warn that `HTTPException.getResponse()` is not context-aware, so response headers such as no-store and request ID handling still need repo-owned wrapping.
- Current route files duplicate `jsonNoStore` and error schemas; this is a separate response-mechanics concern from the browser-visible error body contract.
- This change is split into two OpenSpec capabilities: `backend-error-responses` for error bodies and safe mapping, and `backend-response-mechanics` for shared JSON response helpers and success-response boundaries.

Source: [Hono HTTPException](https://hono.dev/docs/api/exception).

## Goals / Non-Goals

**Goals:**

- Standardize Worker API error responses without breaking existing `body.error` readers.
- Add stable machine-readable error codes for frontend branching and tests.
- Include request correlation in error bodies when the request ID exists.
- Replace duplicated route-local error schemas with one shared error schema.
- Replace duplicated route-local no-store response helpers with one shared HTTP interface helper.
- Keep domain/application layers free of Hono response details.

**Non-Goals:**

- No universal success envelope; successful bodies remain route-specific OpenAPI contracts.
- No new dependency.
- No raw validation issue dumps, provider payloads, stack traces, secrets, D1 binding names, or PII in browser-visible errors.

## Decisions

1. Use a repo-owned JSON error contract.

   Shape:

   ```json
   {
     "error": "Newsletter signup is temporarily unavailable.",
     "code": "newsletter_unavailable",
     "requestId": "..."
   }
   ```

   Rationale: preserves existing message extraction, adds machine-readable code, and avoids a dependency for a small contract. Alternative considered: replacing the response body with a different error envelope; rejected because current browser consumers already read `body.error`.

2. Keep error mapping at the HTTP boundary.

   Application/domain modules should keep throwing domain errors. Route code maps known errors to safe `status`, `code`, and `message` values; the shared helper creates the body and response.

   Rationale: avoids pushing Hono details into application services. Alternative considered: broad exception hierarchy across application services; rejected as larger than needed.

3. Centralize shared response mechanics separately from error semantics.

   Add a shared helper under `apps/backend/src/interfaces/http/` for no-store JSON responses. Success responses remain route-specific and are not wrapped in a generic success envelope.

   Rationale: removes duplicated header mechanics without changing successful API payloads.

4. Use Hono `HTTPException` as an integration point, not the whole contract.

   The global `app.onError` handler should recognize `HTTPException`, map it to the standard body, and apply repo headers itself. It should not return `err.getResponse()` directly because Hono documents that `getResponse()` does not know about `Context`.

5. Keep codes stable and safe.

   Codes use lower snake case, are non-secret, and describe safe client-level outcomes such as `invalid_request`, `not_found`, `missing_operator_identity`, `checkout_unavailable`, `catalog_drift`, `newsletter_unavailable`, and `internal_server_error`. Logs may keep richer safe reasons; response codes are the client contract.

6. Regenerate clients and migrate readers in the same slice.

   OpenAPI schemas should expose one shared `BackendErrorResponse` or equivalent reused by public/internal route contracts. Frontend error readers should continue to support the old `{ error: string }` shape while preferring the standardized contract so UAT/PRD deploy skew is survivable.

## Risks / Trade-offs

- Contract drift remains possible if new routes bypass the helper. Mitigation: tests cover representative public, internal, webhook, 404, and fallback errors.
- Keeping `error` as a string prioritizes existing frontend compatibility over a new envelope. Mitigation: add stable `code` and `requestId` fields without removing `error`.
- Adding `requestId` to bodies exposes an operational identifier. Mitigation: use only the existing request-scoped safe ID, never trace internals or provider IDs.
- Route-specific error mapping still exists. Mitigation: keep mapping near route boundaries, but centralize body/header/schema creation.

## Migration Plan

1. Implement `backend-error-responses`: shared schema, safe body helper, 404/fallback conversion, route error mappings, OpenAPI updates, generated clients, and frontend fallback parsing.
2. Implement `backend-response-mechanics`: shared no-store JSON helper and route migration away from duplicated `jsonNoStore`.
3. Add tests for representative error statuses, codes, `requestId`, `Cache-Control: no-store`, and safe body contents.
4. Run `pnpm test:unit`, `pnpm check`, and `pnpm build`.

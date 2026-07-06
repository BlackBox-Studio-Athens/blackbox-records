## 1. backend-error-responses

- [x] 1.1 Add a shared backend HTTP error schema with `error`, `code`, and `requestId` fields.
- [x] 1.2 Add shared helpers for standardized error body creation.
- [x] 1.3 Update the global error handler to convert unexpected errors and Hono `HTTPException` values to the shared contract.
- [x] 1.4 Update the not-found handler to use the shared contract.
- [x] 1.5 Replace route-local duplicate `{ error: string }` OpenAPI schemas with the shared backend error schema.

## 2. backend-response-mechanics

- [x] 2.1 Add a shared HTTP response helper for no-store JSON.
- [x] 2.2 Convert public commerce and newsletter routes away from duplicated route-local `jsonNoStore`.
- [x] 2.3 Convert internal stock and order routes away from duplicated route-local `jsonNoStore`.
- [x] 2.4 Convert Stripe webhook, not-found, and fallback handlers away from duplicated route-local `jsonNoStore`.
- [x] 2.5 Preserve route-specific successful response bodies without adding a generic success envelope.

## 3. Error Route Migration

- [x] 3.1 Convert public commerce and newsletter route errors to the shared error helper.
- [x] 3.2 Convert internal stock and order route errors to the shared error helper.
- [x] 3.3 Convert Stripe webhook route errors to the shared error helper.

## 4. Client Compatibility

- [x] 4.1 Regenerate backend OpenAPI output and the `@blackbox/api-client` package.
- [x] 4.2 Update public checkout/newsletter frontend error readers to accept the standardized contract while preserving old `{ error: string }` fallback parsing.
- [x] 4.3 Update internal stock frontend error parsing to accept the standardized contract while preserving old `{ error: string }` fallback parsing.

## 5. Tests

- [x] 5.1 Update public API route tests to assert status, `error`, `code`, `requestId`, and `Cache-Control: no-store` for representative errors.
- [x] 5.2 Update internal route tests to assert standardized missing-operator, invalid-request, and not-found errors.
- [x] 5.3 Update webhook and app-level tests to assert standardized webhook validation, 404, and fallback 500 errors.
- [x] 5.4 Add or update tests proving raw validation dumps, provider payloads, stack traces, secrets, and internal binding details are not exposed.

## 6. Validation

- [x] 6.1 Run `pnpm test:unit`.
- [x] 6.2 Run `pnpm check`.
- [x] 6.3 Run `pnpm build`.

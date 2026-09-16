## Why

BlackBox already has structured, browser-safe errors, but consumers must know its custom shape. RFC 9457 provides a standard machine-readable error representation while retaining the existing stable codes and generated OpenAPI clients.

## What Changes

- Return RFC 9457 problem details from BlackBox-owned JSON API error boundaries using `application/problem+json` and the actual HTTP failure status.
- Preserve `code`, optional `requestId`, and each route family's legacy `error` representation as documented extensions so existing clients survive independent releases and rollback; Hono message strings and CMS string-code/nested-object errors are not interchangeable.
- Centralize safe problem types/titles and migrate shared Hono errors, validation, exceptions, and BlackBox-owned CMS/publication boundary errors.
- Keep upstream EmDash, Cloudflare Access/edge, and provider-owned response contracts explicit exceptions; consumers handle non-JSON failures safely.
- Regenerate public/internal OpenAPI and clients and verify old/new client/server combinations. Success bodies keep their route-specific shapes.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `backend-error-responses`: Standard problem-details fields, media type, safe extensions, and deploy-skew handling.

## Impact

Revised on 2026-09-17 after accepted EmDash cutover and runtime-publication rollout. Reuse those receipts and reconcile affected API/auth/publication contracts against the implementation revision; no blanket unfinished-EmDash blocker remains. This can run independently of HTTP/3 verification; [the current sequence](../verify-http3-transport-coverage/proposal.md) records all five follow-ups.

Touches shared backend HTTP responses/contracts, app-owned CMS boundary helpers where applicable, generated clients, consumer error normalization, tests, and API documentation. No dependency or success-envelope migration is expected. The media-type change needs a compatibility check even though legacy fields are preserved; it must not alter upstream EmDash media types or auth behavior.

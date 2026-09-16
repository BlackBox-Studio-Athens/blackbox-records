## Why

BlackBox already has structured, browser-safe errors, but consumers must know its custom shape. RFC 9457 provides a standard machine-readable error representation while retaining the existing stable codes and generated OpenAPI clients.

## What Changes

- Return RFC 9457 problem details from BlackBox-owned JSON API error boundaries using `application/problem+json` and the actual HTTP failure status.
- Preserve `code`, optional `requestId`, and the legacy `error` message as documented extension fields so existing clients survive independent releases and rollback.
- Centralize safe problem types/titles and migrate shared Hono errors, validation, exceptions, and BlackBox-owned CMS/publication boundary errors.
- Keep upstream EmDash, Cloudflare Access/edge, and provider-owned response contracts explicit exceptions; consumers handle non-JSON failures safely.
- Regenerate public/internal OpenAPI and clients and verify old/new client/server combinations. Success bodies keep their route-specific shapes.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `backend-error-responses`: Standard problem-details fields, media type, safe extensions, and deploy-skew handling.

## Impact

Blocked until `replace-sveltia-with-emdash-operations` completes final acceptance/handoff and spec reconciliation. Recheck its final API/auth/publication boundaries before applying. This can follow or run independently of HTTP/3 verification; [the sequence](../verify-http3-transport-coverage/planning-evidence.md) records all five follow-ups.

Touches shared backend HTTP responses/contracts, app-owned CMS boundary helpers where applicable, generated clients, consumer error normalization, tests, and API documentation. No dependency or success-envelope migration is expected. The media-type change needs a compatibility check even though legacy fields are preserved; it must not alter upstream EmDash media types or auth behavior.

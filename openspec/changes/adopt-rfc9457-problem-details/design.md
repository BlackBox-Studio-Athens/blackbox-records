## Context

See [proposal](proposal.md). `backend-error-responses` already standardizes `code`, `error`, and optional `requestId`; `responses.ts` owns the schema/body helper and `no-store`. EmDash adds app-owned guards/publication routes alongside upstream CMS responses. Re-inventory those after the prerequisite epic completes.

## Goals / Non-Goals

Provide one safe RFC 9457 contract for app-owned JSON errors and compatible generated clients. Keep upstream CMS/auth/provider responses, successful bodies, existing status meanings, and request-correlation policy intact. Safe field-level validation details are not required for this slice.

## Decisions

### Extend the existing shape

Use `type`, `title`, `status`, and `detail`, plus existing `code`, optional `requestId`, and `error` equal to `detail`. Use stable app-owned root-relative URI references `/problems/<code>` with a documented registry of descriptions, codes, titles and status mappings; resolve them against the response origin. URI references are permitted by RFC 9457 and avoid inventing an undeployed API domain. Known types get a stable title. `status` equals the real transport status. Omit `instance` unless an existing safe occurrence URI is available; `requestId` remains the diagnostic correlation extension. Do not expose a request URL/query that might carry personal or payment data.

Keep the `error` extension without a time-based removal promise. It costs little and protects old static clients and rollback. A later breaking-contract change can remove it with actual consumer evidence. New consumers choose `detail`, then `error`, then a safe fallback; branch on `code`/known `type`, never message wording.

### Keep ownership explicit

Cover public/internal BlackBox JSON routes, Hono validation/not-found/HTTPException/unexpected failures, and BlackBox-owned CMS/publication JSON failures. Adapt shared helper usage at the interface layer; do not reimplement the upstream EmDash response stack or change Cloudflare Access redirects/pages. Signed webhook acknowledgement semantics and non-JSON/streaming responses stay owned by their protocols. Document any excluded route family precisely after final inventory.

Keep `Cache-Control: no-store` and relevant auth/CORS/challenge headers. A malformed request or unexpected error returns a generic safe problem; raw Zod issues, request bodies, Stripe IDs, bindings, tokens and private content never enter `detail`. Client parsers tolerate HTML/plain-text edge/auth errors without treating them as trusted display copy.

### Make code-first OpenAPI prove compatibility

Use the existing Zod/OpenAPI route schema pipeline and generated public/internal separation. Document `application/problem+json` for migrated failures. Do not advertise a media type the route does not actually return. Test `openapi-typescript-fetch` JSON parsing for `+json`; if adjustment is needed, make the smallest client normalization change. Reuse the existing mock handlers and error tests.

## Risks / Trade-offs

- Old clients may gate on content type → verify current clients with the new media type before server rollout.
- CMS boundary formats differ → enumerate app-owned versus upstream cases and keep upstream-compatible consumers.
- Overly descriptive failures leak private data → use a fixed safe mapping and regression fixtures.
- Generated documents drift from deployed output → test actual response status/media/schema against both API documents.

## Migration Plan

After the EmDash gate, ship compatible readers first if required, then migrate server response helpers/contracts and regenerate clients. Exercise old reader/new server, new reader/old server, unknown extensions/types, auth HTML, and rollback. Retain legacy fields so reverting to the previous server does not strand new readers. No schema migration or hosted write is required for error-only diagnostics. Follow the normal UAT and PRD release process.

## References

- [RFC 9457](https://www.rfc-editor.org/rfc/rfc9457.html): problem types, standard members, extensions, and security considerations.
- [OpenAPI 3.1 media types](https://spec.openapis.org/oas/v3.1.1.html#media-type-object): document the actual error representation.

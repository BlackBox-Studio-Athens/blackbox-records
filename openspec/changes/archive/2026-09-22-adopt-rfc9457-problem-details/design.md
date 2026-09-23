## Context

See [proposal](proposal.md). `backend-error-responses` and `apps/backend/src/interfaces/http/responses.ts` already standardize Hono `code`, string `error`, optional `requestId`, and `no-store`. Accepted EmDash/runtime publication adds separate app-owned boundaries in `cms/index.ts` and `cms/publication-routes.ts`: some return `{ error: 'PUBLICATION_UNAVAILABLE' }`, others `{ error: { code: 'CMS_NOT_INITIALIZED' } }`. These are not the Hono message contract. Public renderer HTML/plain-text failures and upstream EmDash responses are separate protocols, not JSON envelopes to rewrite.

## Goals / Non-Goals

Provide one safe RFC 9457 contract for app-owned JSON errors and compatible generated clients. Keep upstream CMS/auth/provider responses, successful bodies, existing status meanings, and request-correlation policy intact. Safe field-level validation details are not required for this slice.

## Decisions

### Extend the existing shape

Use a shared base of `type`, `title`, `status`, `detail`, safe lower-snake-case `code`, and optional `requestId`. Hono keeps `error === detail`. Migrated app-owned CMS routes retain their existing safe string-code or nested-object `error` shape and values; add standard members beside it rather than replacing it. Define explicit typed legacy extensions per family over the shared base, not an unvalidated `unknown` field or a second independent problem contract. Preserve any existing response discriminator required by that family's clients. Use stable app-owned root-relative URI references `/problems/<code>` with a documented registry of descriptions, normalized codes, titles and status mappings, including mappings from legacy CMS codes; resolve them against the response origin. Known types get a stable title and `status` equals the real transport status. Omit `instance` unless an existing safe occurrence URI is available; `requestId` remains the diagnostic correlation extension. Do not expose request queries, tokens or payment data.

Keep legacy extensions without a time-based removal promise. A later breaking-contract change can remove them with consumer evidence. New Hono consumers prefer `detail`, then the legacy message, then safe fallback text. CMS consumers prefer safe `detail`, otherwise map their known legacy string/nested code to approved copy; never display an object, raw code or arbitrary remote body. Branch on stable codes/known types, not message wording.

### Keep ownership explicit

Cover public/internal BlackBox JSON routes, Hono validation/not-found/HTTPException/unexpected failures, and BlackBox-owned CMS/publication JSON failures, including `/_emdash/api/blackbox/content-publications`. Reuse a context-independent problem-body builder through thin Hono and native Response adapters; do not make CMS depend on Hono request context merely to construct an error. Preserve private/no-store versus public no-store and existing challenge/CORS headers. Do not reimplement upstream EmDash or change Access redirects, renderer HTML/plain-text failures, signed webhook acknowledgement semantics or streams. Inventory retained legacy publication/recovery routes separately from active runtime publication; do not reactivate their old GitHub build flow just to test errors.

Keep `Cache-Control: no-store` and relevant auth/CORS/challenge headers. A malformed request or unexpected error returns a generic safe problem; raw Zod issues, request bodies, Stripe IDs, bindings, tokens and private content never enter `detail`. Client parsers tolerate HTML/plain-text edge/auth errors without treating them as trusted display copy.

### Make code-first OpenAPI prove compatibility

Use the existing Zod/OpenAPI route schema pipeline and generated public/internal separation. The current documents register Hono routes only; native CMS routes are not automatically included. Document `application/problem+json` for migrated Hono failures and verify native CMS contracts with their existing clients/fixtures without claiming generated coverage. Do not advertise a media type the route does not return. Test `openapi-typescript-fetch` JSON parsing for `+json`; if adjustment is needed, make the smallest client normalization change. Reuse existing mock handlers and error tests, including the new delivery-quote route's validation/error boundary when documenting failures.

## Risks / Trade-offs

- Old clients may gate on content type → verify current clients with the new media type before server rollout.
- CMS boundary formats differ → enumerate app-owned versus upstream cases and keep upstream-compatible consumers.
- Overly descriptive failures leak private data → use a fixed safe mapping and regression fixtures.
- Generated documents drift from deployed output → test actual response status/media/schema against both API documents.

## Migration Plan

With the recorded EmDash/runtime-publication acceptance reused, ship compatible readers first if required, then migrate response helpers/contracts and regenerate clients. Exercise old/new server-reader combinations for Hono, CMS string-code and CMS nested-object fixtures, unknown extensions/types, auth HTML and rollback. Retain legacy fields so rollback does not strand readers. Use Local failure fixtures first; no live publication, payment or hosted malformed mutation is needed to establish error compatibility. Hosted diagnostics still need a traced, budgeted endpoint. Follow normal UAT/PRD code promotion, not editorial publication, for the rollout.

## References

- [RFC 9457](https://www.rfc-editor.org/rfc/rfc9457.html): problem types, standard members, extensions, and security considerations.
- [OpenAPI 3.1 media types](https://spec.openapis.org/oas/v3.1.1.html#media-type-object): document the actual error representation.

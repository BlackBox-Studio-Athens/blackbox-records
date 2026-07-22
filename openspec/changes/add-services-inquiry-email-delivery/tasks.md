## 1. Email Application

- [x] 1.1 Add the Services Inquiry input/service types, fixed service-to-alias map, bounded validation, and provider-safe purpose/tag values under the existing email application module.
- [x] 1.2 Build the escaped BlackBox HTML and equivalent plain-text Services Inquiry template with the approved subject and field order.
- [x] 1.3 Extend `TransactionalEmailCommand` with optional validated `replyTo`, preserve the configured support fallback for existing callers, and add focused regression tests.
- [x] 1.4 Implement the stateless Services Inquiry send use case with Worker-owned idempotency, UAT sink routing, content-free outcome logging, and unit coverage for every alias and provider failure.

## 2. Public Worker Contract

- [x] 2.1 Add strict OpenAPI request/response schemas for `POST /api/services/inquiries`, including required fields, service enum, optional fields, exact length limits, `400` validation, and provider-safe `503` failure.
- [x] 2.2 Add the route-local Services Inquiry service and route registration by reusing `createEmailRuntimeServices`; reject browser recipient overrides and return `status: submitted` only after provider acceptance.
- [x] 2.3 Add HTTP tests for valid submission, each service route, invalid/unknown fields, dynamic visitor `Reply-To`, Local mock behavior, UAT sink behavior, and unavailable email runtime/provider responses.
- [x] 2.4 Regenerate and verify the public OpenAPI documents and `@blackbox/api-client` artifacts.

## 3. Services Form UX

- [x] 3.1 Replace primary mailto submission with the generated public API client, native required/email controls, bounded values, pending protection, and preserved values after failure.
- [x] 3.2 Add the single optional adaptive details control for General, Tour Booking, Merch Printing, and Vinyl Printing with the approved labels and concise hints.
- [x] 3.3 Add stable accessible idle, submitting, field-error, provider-error, and inline success states, including `Send another inquiry`, without redirect, reload, or new tab.
- [x] 3.4 Replace scripted `window.open` handling with a normal selected-alias `mailto:` link using CRLF formatting, plus visible/copyable recipient and inquiry summary fallback with clipboard-failure behavior.
- [ ] 3.5 Update the no-JavaScript fallback and Services inquiry copy from `Compose Inquiry`/mail-client-only wording to the server submission and fallback behavior.
- [ ] 3.6 Update focused frontend tests for validation, adaptive prompt selection, API success/error handling, form reset, correct alias/CRLF mailto output, and copy fallback.

## 4. Architecture and Operations

- [ ] 4.1 Update `module-boundaries.manifest.json` and its focused architecture expectations so `apps/web/src/components/services/**` has explicit existing-module ownership and new public HTTP files remain inside `public-commerce-http`.
- [ ] 4.2 Extend the existing Resend UAT smoke with one synthetic Services Inquiry submission that proves provider acceptance and managed-sink routing without persisting or printing visitor content.
- [ ] 4.3 Update operator documentation for the endpoint, Local/UAT/PRD behavior, four Cloudflare-forwarded aliases, inline-only confirmation, no visitor receipt, and the explicit absence of CAPTCHA, rate limiting, and D1 persistence.

## 5. Verification and Rollout

- [ ] 5.1 Run focused frontend, backend, HTTP, email-template, API-generation, architecture, and UAT-smoke contract tests.
- [ ] 5.2 Run `pnpm test:unit`, `pnpm check`, and `pnpm build` against the final implementation tree.
- [ ] 5.3 Use Browser Use on mobile and desktop to verify required fields, all adaptive prompts, pending/error preservation, inline success, send-another reset, no overflow, no unintended navigation, mail-app fallback, and copy fallback.
- [ ] 5.4 Deploy the Worker before the static frontend, run the synthetic UAT inquiry against `uat-sink@ambkime.resend.app`, and record redacted evidence.
- [ ] 5.5 Before PRD acceptance, manually send one probe to each of `info@`, `booking@`, `merch@`, and `vinyl@blackboxrecordsathens.com` and confirm Cloudflare Email Routing forwards all four to the existing Gmail inbox.

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
- [x] 3.5 Update the no-JavaScript fallback and Services inquiry copy from `Compose Inquiry`/mail-client-only wording to the server submission and fallback behavior.
- [x] 3.6 Update focused frontend tests for validation, adaptive prompt selection, API success/error handling, form reset, correct alias/CRLF mailto output, and copy fallback.

## 4. Architecture and Operations

- [x] 4.1 Update `module-boundaries.manifest.json` and its focused architecture expectations so `apps/web/src/components/services/**` has explicit existing-module ownership and new public HTTP files remain inside `public-commerce-http`.
- [x] 4.2 Extend the existing Resend UAT smoke with one synthetic Services Inquiry submission that proves provider acceptance and managed-sink routing without persisting or printing visitor content.
- [x] 4.3 Update operator documentation for the endpoint, Local/UAT/PRD behavior, four Cloudflare-forwarded aliases, inline-only confirmation, no visitor receipt, and the explicit absence of CAPTCHA, rate limiting, and D1 persistence.

## 5. Verification and Rollout

- [x] 5.1 Run focused frontend, backend, HTTP, email-template, API-generation, architecture, and UAT-smoke contract tests.
- [x] 5.2 Run `pnpm test:unit`, `pnpm check`, and `pnpm build` against the final implementation tree.
- [x] 5.3 Use Browser Use on mobile and desktop to verify required fields, all adaptive prompts, pending/error preservation, inline success, send-another reset, no overflow, no unintended navigation, mail-app fallback, and copy fallback.
- [x] 5.4 Deploy the Worker before the static frontend, run the synthetic UAT inquiry against `uat-sink@ambkime.resend.app`, and record redacted evidence.
- [x] 5.5 Before PRD acceptance, manually send one probe to each of `info@`, `booking@`, `merch@`, and `vinyl@blackboxrecordsathens.com` and confirm Cloudflare Email Routing forwards all four to the existing Gmail inbox.

### Local acceptance evidence — 2026-07-22

- Focused acceptance passed: frontend form/fallback/API-wrapper tests (36), backend email/HTTP/OpenAPI tests (83), architecture/UAT-smoke contracts (19), and generated API-client tests (6). `pnpm generate:api` produced no diff.
- Full acceptance passed: `pnpm test:unit` (web 535, backend 284 + 224, API client 6), `pnpm check`, and `pnpm build` (350 pages).
- Native Codex Browser Use passed at desktop and mobile widths against the built local site and Local mock Worker. It covered native required/length constraints, all four adaptive prompts and aliases, pending and provider-error value preservation, inline success, reset/focus, accessible status/alert regions, exact CRLF mailto formatting, visible/copyable fallback, unchanged URL/tab count, and no horizontal overflow.
- Clipboard success was rendered and verified. Clipboard-unavailable and rejection behavior remains covered by focused tests because Browser Use does not expose a safe page-mutation seam for forced Clipboard API failure.
- Evidence contains no visitor content, provider response, or secret. No deployment, Resend call, or provider mutation occurred.

### Rollout evidence — 2026-07-23

- The cumulative local tree at `f637c1ea41c1148b9890b061c88c5cae1a4a097b` deployed to the `blackbox-records-backend-uat` Worker through `pnpm deploy:backend:uat` with Wrangler 4.94.0 at `2026-07-23T08:13Z`, before the final static deployment. No PRD target was deployed; the provider deployment identifier is intentionally omitted.
- The redacted Resend smoke at `.codex-artifacts/smoke/uat/resend-uat/20260723081351/` passed at `2026-07-23T08:13:53Z`: Worker health, newsletter registration, and the Services inquiry against `uat-sink@ambkime.resend.app` returned HTTP 200 with zero issues, and the inquiry check recorded the `managed-uat-sink` recipient policy.
- GitHub Actions run `29990598101` checked out the exact cumulative SHA from the authorized temporary ref and completed successfully. Workspace checks, the 350-page UAT build, and GitHub Pages deployment completed; the UAT deploy finished at `2026-07-23T08:17:33Z`, while both PRD jobs were skipped. GitHub's jobs API retained a stale queued unit-test entry after the workflow reached success; the exact tree had already passed the full local unit suite.
- The deployed Services page returned HTTP 200 with the `[TEST] Services | Blackbox Records` title, required name/email/service/message controls, all four service choices, the visible `info@blackboxrecordsathens.com` mail-app/copy fallback, and no console warnings or errors.
- The broader hosted UAT static smoke passed the Services route with no page or console errors. Its only failure was an unrelated Store listing-price readiness timeout, which is outside this change.
- Exactly one content-minimal probe was sent to each service alias under redacted run `routing-probe-20260723T052005Z-[redacted]`. Resend accepted each send at `2026-07-23T05:20:09Z`, `05:20:12Z`, `05:20:16Z`, and `05:20:19Z`; all four outbound records reached provider state `delivered`. Provider message identifiers, recipients, headers, and content are omitted.
- Cloudflare Email Routing activity recorded exactly one matching event per alias at `2026-07-23T05:20:10Z`, `05:20:13Z`, `05:20:17Z`, and `05:20:20Z`. Every event reported `action=forward` and `status=delivered` to the configured verified destination. The destination and routing event identifiers are omitted; no Gmail login or connector was used.

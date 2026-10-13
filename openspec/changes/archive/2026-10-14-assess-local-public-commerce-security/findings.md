# Findings, 2026-10-12

Source: `main` at `0bb8b89cdf303730fe66d15b766a153e89366f14`. PRD release observed on 2026-10-12: `047c3ae4bd6126900014258caa3e0fb8147cfff6`, run 557. Raw output: `.codex-artifacts/security/2026-10-12/` (ignored); install paths are in `checkpoint.md` there.

No critical or high finding. Price, quantity and idempotency tampering, Stripe webhook signatures, `/api/internal/*` rejection and CORS held in every test. The material risks are unthrottled public forms that produce email or contact records.

## Ranked findings

| #   | Severity | Area                | Status                  | Finding                                                                                                                                                      |
| --- | -------- | ------------------- | ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1   | Medium   | Services inquiry    | Confirmed Locally       | No rate limit or bot check. Each request sends one email from the shared Resend account; exhausting Resend quota makes paid-order emails fail without retry. |
| 2   | Medium   | Newsletter          | Confirmed Locally       | Single opt-in with no rate limit: anyone can add arbitrary addresses, recorded as consented, to the newsletter audience. No address length cap.              |
| 3   | Medium   | Supply chain        | Confirmed (zizmor)      | Deploy workflows use tag-pinned third-party actions while holding Cloudflare and Stripe credentials.                                                         |
| 4   | Low      | Notify me alerts    | Code-confirmed, not run | No per-client limit; junk addresses can fill the 2,000 per-item pending cap, blocking real shoppers and spending the 40/day send budget.                     |
| 5   | Low      | Public API errors   | Confirmed Locally       | Malformed path parameters return 500 instead of 400 on four public routes.                                                                                   |
| 6   | Low      | Public HTML headers | Confirmed on PRD        | PRD documents set no CSP, `frame-ancestors`/`X-Frame-Options`, `X-Content-Type-Options` or `Referrer-Policy`; the custom domain sends no HSTS.               |
| 7   | Info     | Checkout contract   | Confirmed Locally       | `lines` has no maximum (delivery quote caps at 100). 5,000 duplicate lines were rejected after merging; no impact beyond parse cost.                         |
| 8   | Info     | Delivery quote      | Confirmed Locally       | A body-less `POST /api/store/delivery-quote` returns 503 instead of 400.                                                                                     |
| 9   | Info     | Services inquiry    | Unconfirmed             | `name` and `bandOrProject` accept CR/LF and flow into the email subject. Delivery uses Resend's JSON API, not SMTP; Resend's handling was not tested.        |
| 10  | Info     | Dependencies        | Triaged                 | OSV-Scanner and `pnpm audit` flag 13 packages; none is in the Worker or renderer request path.                                                               |

### 1. Services inquiry can exhaust the transactional email quota (Medium)

- Location: `postServicesInquiryRoute` (`apps/backend/src/interfaces/http/contracts/public-contracts.ts:563`); `sendServicesInquiry` (`apps/backend/src/application/email/services-inquiry.ts`); Resend `quota_exceeded` maps to `retryable: false` (`apps/backend/src/infrastructure/resend/resend-email-gateway.ts`), and paid-order delivery retries only retryable failures (`apps/backend/src/application/commerce/orders/paid-order-delivery-processing.ts:80`).
- Evidence: 12 rapid valid submissions all returned 200 and each logged `services_inquiry_email_outcome` with `status: 'sent'` (Resend no-network mock). The only public limiter in `apps/backend/src` is the withdrawal form's 429.
- Reproduction (Local only): `for i in $(seq 12); do curl -s -o /dev/null -w "%{http_code} " -X POST -H 'content-type: application/json' -d '{"name":"P","email":"p@example.com","message":"m","service":"General"}' http://127.0.0.1:8787/api/services/inquiries; done`
- Minimal fix: a per-IP limit on the three public form routes (findings 1, 2 and 4). The PRD API runs on `workers.dev`, where zone WAF rules do not apply, so use the Workers rate-limiting binding (confirm Free availability first) or serve the API from the zone and add one WAF rate-limiting rule. Separately, let paid-order delivery reschedule `quota_exceeded`.

### 2. Newsletter registration accepts unverified addresses without limit (Medium)

- Location: `newsletterRegistrationBodySchema` (`public-contracts.ts:295`, `email: z.string().trim().email()` without `.max`); `registerNewsletterContact` (`apps/backend/src/application/email/newsletter-registration.ts`) creates the provider contact directly.
- Evidence: 12 rapid registrations returned 200; a 5,000+ character address returned 200 `registered`. Cross-site `text/plain` and form-encoded posts return 415, so a browser CSRF cannot do this; a script can.
- Minimal fix: the rate limit from finding 1, `.max(254)` on the email, and a confirmation email before the contact joins the audience.

### 3. Tag-pinned third-party actions in deploy workflows (Medium)

- Location: `.github/workflows/*`; third-party `pnpm/action-setup@v6.1.0` and `cloudflare/wrangler-action@v4.1.3` (53 `unpinned-uses` in total). No template injection, excessive permissions or `pull_request_target`. Raw: `zizmor.txt`.
- Minimal fix: pin to full commit SHAs (`zizmor --fix` proposes them); Renovate keeps them current.

### 4. Notify me cap can be filled with junk (Low)

- Location: `AVAILABILITY_ALERT_PENDING_CAP = 2_000` and `AVAILABILITY_ALERT_DAILY_BUDGET = 40` (`apps/backend/src/domain/commerce/availability-alerts.ts`); `requestAvailabilityAlert` (`apps/backend/src/application/commerce/checkout/request-availability-alert.ts`).
- Evidence: code only. No Local item is Coming Soon or Repressing, and stock state was not changed to create one. Validation held: ineligible items 400, unknown item 404, missing consent 400.
- Minimal fix: the rate limit from finding 1.

### 5. Malformed path parameters return 500 (Low)

- Location: `storeItemParamsSchema` and `checkoutSessionParamsSchema` (`public-contracts.ts:45-55`) accept any non-empty string; the domain parsers (`apps/backend/src/domain/commerce/ids.ts`) then throw `ZodError`, which the error handler returns as 500 and logs as `http_request_error`.
- Evidence: 500 for `GET /api/store/items/UPPER_case`, `GET /api/store/items/UPPER_case/variants`, `POST /api/store/items/UPPER_case/availability-alerts` and `GET /api/checkout/sessions/xx%20yy/state`; Schemathesis found the same server errors. Bodies hold only a generic problem and request ID, no stack.
- Minimal fix: reuse the domain regexes in the two param schemas so validation returns 400.

### 6. Missing security headers on PRD HTML (Low)

- Evidence (`hosted-headers.txt`): `https://blackbox-records-web.pages.dev/` and `/store/` return only `Cache-Control`, `Content-Type` and `X-Release-SHA`; `pages.dev` is HSTS-preloaded through the `.dev` TLD. `https://blackboxrecordsathens.com/` currently serves a separate static page with a strict CSP, `nosniff` and `Referrer-Policy`, but no HSTS. The PRD Worker returns no `Access-Control-Allow-Origin` for a foreign origin.
- Impact: no framing or injection hardening; payment happens on Stripe-hosted Checkout, which limits impact.
- Minimal fix: add `Content-Security-Policy: frame-ancestors 'self'` (extend later), `X-Content-Type-Options: nosniff` and `Referrer-Policy: strict-origin-when-cross-origin` in the gateway; enable HSTS on the zone once every subdomain is HTTPS.

### 7–10. Informational

- 7: add `.max(100)` to `startCheckoutBodySchema.lines` (`public-contracts.ts:205`) to match the delivery quote.
- 8: return 400 for a missing delivery-quote body.
- 9: reject control characters in single-line inquiry fields.
- 10: by `pnpm why`, `axios` and `smol-toml@1.6.1` come from Nx, `handlebars` from eslint-plugin-boundaries, `braces`/`brace-expansion` from tooling, `mysql2` and `deepmerge-ts` from the Prisma CLI, `undici` from Miniflare/Wrangler and shadcn, `source-map-js` from Vite, `sharp` from build image processing and `@modelcontextprotocol/sdk` from EmDash (staff/CMS). `http-cache-semantics` is imported only by Astro's build-time remote image cache (`astro/dist/assets/build/remote.js`). Update through Renovate.

## Checks that passed

| Area               | Result                                                                                                                                                                                                                                                                                                                                                                          |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Stripe webhook     | Unsigned, wrong-secret, malformed and stale-timestamp signatures all 400. Verification uses `constructEventAsync` with the configured secret; a missing secret fails closed.                                                                                                                                                                                                    |
| `/api/internal/*`  | Local: a non-loopback `Host` is refused (403); loopback is allowed by the documented Local bypass. UAT/PRD: `Cf-Access-Jwt-Assertion` is verified with RS256, issuer, audience and `exp`, and the forwarded email header is ignored; `operator-identity.worker.test.ts` passed (cached Nx result). PRD sets `PRODUCT_ENVIRONMENT: PRD`, so the Local branch cannot apply there. |
| Checkout tampering | Extra price or amount fields 400 (strict schema); quantity 10, 0, -1, 1.5 and `"1"` 400; duplicate lines summing past 9 rejected; slug/variant mismatch 400; sold-out and mixed pay-what-you-want rejected; foreign `Origin` rejected; unknown item 404. Prices come only from server-side offers.                                                                              |
| Idempotency        | Missing key 409 `idempotency_key_required`; non-v4 key 400; same key and body replays the session; same key with a different body 409.                                                                                                                                                                                                                                          |
| Input validation   | Newsletter, inquiry, alert and withdrawal bodies are strict; oversized inquiry fields 400; CR/LF in the newsletter email 400; deeply nested JSON 400 without a stack. Inquiry HTML escapes every field.                                                                                                                                                                         |
| CORS and CSRF      | Preflight echoes only configured origins, without credentials; foreign, `null` and suffix-spoofed origins get none, including on `/api/internal/*`. Non-JSON cross-site posts return 415.                                                                                                                                                                                       |
| Secrets in history | gitleaks: 37 hits, all fixtures or identifiers. A targeted pass over `git log -p --all` for `whsec_`, `re_`, `sk_live_` and `rk_live_` found only fixtures (`whsec_fixture_…`, `re_mock_…`) and Prisma wasm-bindgen identifiers.                                                                                                                                                |
| Semgrep CE         | One result: `react-dangerouslysetinnerhtml` at `apps/web/src/components/app-shell/view/ShellOverlayPanel.tsx:182`. False positive: the HTML is a same-origin Astro fragment from `buildOverlayFragmentUrl` (`routing.ts:80`), built only from a parsed overlay route.                                                                                                           |

## Unconfirmed or not covered

- `GET /api/checkout/sessions/cs_test_doesnotexist/state` returned 200 `open` because stripe-mock answers any ID with a fixture; real Stripe behavior is unverified. Session IDs are unguessable.
- A GET with a body returns a Miniflare `TypeError` with a stack; this is the Local runtime, not application code.
- Not observed: Cloudflare dashboard WAF or rate-limiting rules, provider-side validation in Stripe and Resend, and the account's actual Resend quota.
- Semgrep's TypeScript rules do not parse the 70 `.astro` files (only 6 generic rules ran on them). No browser-driven XSS testing.
- OWASP ZAP was not run: it needs a large download and would mostly repeat finding 6.

## Coverage and tool versions

| Tool                           | Version     | Target                                                   | Result                                                                                                                         |
| ------------------------------ | ----------- | -------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| gitleaks                       | 8.30.1      | 1,566 commits                                            | 37 hits, 0 secrets                                                                                                             |
| `pnpm audit --prod`            | pnpm 12.6.0 | production graph                                         | 8 high, 6 moderate, 3 low; none runtime-reachable                                                                              |
| OSV-Scanner                    | 2.6.0       | `pnpm-lock.yaml`, 1,658 packages                         | 13 vulnerable packages; none runtime-reachable                                                                                 |
| zizmor                         | 1.30.1      | `.github/workflows`                                      | 53 `unpinned-uses`, 5 low style notes                                                                                          |
| Semgrep CE                     | 1.180.0     | 427 code files in `apps/web/src`, `apps/backend/src`     | 80 rules, 1 result (false positive), 22 s in WSL                                                                               |
| Schemathesis                   | 4.30.1      | Local Worker public OpenAPI 3.1, 13 operations, 83 cases | Server errors are finding 5 and 8; the rest are spec-conformance notes (404 instead of 405, undocumented 400/409, Local stubs) |
| Scripted checks (Node 24.21.0) | n/a         | Local Worker, 60 cases                                   | `local-checks.txt`                                                                                                             |
| curl                           | n/a         | 4 hosted GETs                                            | `hosted-headers.txt`                                                                                                           |

## Rerun commands

From the repository root, after `pnpm local:status` and `pnpm dev`. `D=.codex-artifacts/security/<date>`.

```sh
/c/Users/SVall/sec-tools/bin/gitleaks.exe git --redact --report-format json --report-path $D/gitleaks-history.json .
pnpm audit --prod --json > $D/pnpm-audit-prod.json
/c/Users/SVall/sec-tools/bin/osv-scanner.exe scan source --lockfile pnpm-lock.yaml --format json --output-file $D/osv-scanner.json
uvx zizmor .github/workflows > $D/zizmor.txt
curl -s http://127.0.0.1:8787/api/store/openapi.json -o $D/public-openapi.json
PYTHONUTF8=1 uvx schemathesis run $D/public-openapi.json --url http://127.0.0.1:8787 -n 20 --checks all \
  -H "Origin: http://127.0.0.1:4321" --report junit --report-junit-path $D/schemathesis-junit.xml
pnpm test apps/backend/src/interfaces/http/auth/operator-identity.worker.test.ts
```

Schemathesis writes `.hypothesis/` and `.schemathesis/` in the working directory; move them under `$D` afterwards.

Semgrep on native Windows did not finish in 15 minutes. Run it in WSL on a code-only copy instead: pack the files with `rg --files apps/web/src apps/backend/src -g '*.{ts,tsx,js,mjs,cjs,jsx,astro}' -g '!**/generated/**' -g '!*.test.*' -g '!*.spec.*' -g '!**/test/**'` into a tar, extract it under `/tmp/sgsrc` in Ubuntu-24.04, then run `semgrep scan --metrics=off -j 6 --config p/javascript --config p/typescript --config p/owasp-top-ten --json --output /tmp/semgrep.json apps` (Semgrep CE from PyPI in a venv).

The scripted-check script is not kept in the repository; `local-checks.txt` lists every case and result. Hosted header reads use `curl -s -D - -o /dev/null <url>` for the four URLs above and nothing more.

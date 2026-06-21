## 0. Resend Provider Proof

- [x] 0.1 Install or locate the Resend CLI, authenticate with `resend login` or CI-safe `RESEND_API_KEY`, and verify `resend --version` runs in the operator environment.
- [x] 0.2 Run `resend doctor --json` manually and confirm the CLI can reach the intended Resend account/team without committing proof or provider-readiness evidence.
- [x] 0.3 Confirm the intended Resend account stays on the Free tier and supports transactional email volume, marketing contact allowance, automation limits, and `blackboxrecordsathens.com` as the single verified sending domain.
- [x] 0.4 Confirm Cloudflare is authoritative for `blackboxrecordsathens.com`, add the Resend DNS records in Cloudflare, resolve SPF/DKIM/DMARC alignment, and set up Cloudflare Email Routing only where `support@blackboxrecordsathens.com` reply routing is needed for this task.
- [x] 0.5 Run read-only CLI checks for `blackboxrecordsathens.com` domain readiness, sender readiness, Contacts, Topics, and Segments before Worker runtime email implementation begins.
- [x] 0.6 Prove the official `resend` SDK imports and supports the required send/idempotency/contact/topic shape in the Worker toolchain, or record the exact SDK gap before discussing a REST fallback.
- [x] 0.7 Record manual checkpoints for Cloudflare Email Routing setup, DNS, SPF/DKIM/DMARC alignment, API-key creation, Topic/Segment setup, and Cloudflare Worker secret upload; do not continue to live UAT/PRD provider acceptance until the required checkpoints pass or are explicitly accepted.

## 1. SDK-Backed Runtime Contract

- [x] 1.1 Add Worker Resend runtime bindings and validation coverage for API key, `orders@blackboxrecordsathens.com` sender, `support@blackboxrecordsathens.com` reply-to, `blackboxrecordsathens@gmail.com` ops recipient, required newsletter Topic config, optional/deferred newsletter Segment config, Free tier assumptions, and UAT recipient/contact sink.
- [x] 1.2 Add a closed TypeScript-native modulith-style backend email application module with a clean public API, rich repo-owned template builders, newsletter contact registration, recipient/contact routing, deterministic idempotency key creation, provider-safe errors, and hidden internals.
- [x] 1.3 Add a Resend SDK infrastructure gateway that wraps the official `resend` package and maps SDK success/failure results without exposing provider payloads outside the backend boundary.
- [x] 1.4 Document manual provider readiness commands and checkpoints without adding a committed verifier script, readiness report, or evidence artifact.

## 2. Paid Order Email

- [x] 2.1 Extend Stripe Checkout Session mapping to capture shopper email safely from `customer_details.email` with `customer_email` fallback.
- [x] 2.2 Publish an in-process `CheckoutOrderPaid` application event only after first-time paid reconciliation applies, with replay/non-paid/needs-review safeguards and deterministic idempotency keys.
- [x] 2.3 Design rich shopper HTML/text email content that matches the current BlackBox site visual language, including subject/preheader, order reference, line item summary, total paid, safe payment received wording, fulfillment expectations, reply-to support CTA, and no tax-invoice/VAT-receipt or marketing-block claim.
- [x] 2.4 Design ops HTML/text email content that matches the current BlackBox site visual language while staying action-first, including subject/preheader, top fulfillment action list, order reference, item/variant/quantity, payment state, required shopper contact, structured shipping address details, and shopper-send-failure warnings without raw provider payload dumps.
- [x] 2.5 Add provider-safe tags/categories for paid-order shopper, paid-order ops, and newsletter signup sends where Resend supports them.
- [x] 2.6 Add provider-safe email outcome logging for order reference, message purpose, idempotency key, status, and safe reason without raw provider payloads.
- [x] 2.7 Handle Resend `409 concurrent_idempotent_requests` as retry-safe/non-fatal and `409 invalid_idempotent_request` as a config/bug warning.
- [x] 2.8 Add tests and previews for `CheckoutOrderPaid` event publication, shopper email, ops email, rich template content, subject/preheader, plain text, mobile-width rendering, dark-mode-safe colors, long title/address cases, missing shopper email, shopper send failure with ops warning, replay suppression, provider failure handling, Resend 409 handling, UAT sink routing, and PRD recipient routing.

## 3. Newsletter Registration

- [x] 3.1 Add a provider-safe Worker newsletter registration endpoint for the existing homepage/about signup forms.
- [x] 3.2 Add clear newsletter consent UX for site forms and checkout opt-in, including copy for BlackBox Records news, releases, distro updates, and event notes, plus unsubscribe-anytime language and privacy/support context.
- [x] 3.3 Add shopper newsletter opt-in during purchase, preserving explicit unchecked consent and avoiding browser exposure of Resend IDs or secrets.
- [x] 3.4 Add Resend Contact create/update and required explicit Topic opt-in behavior through the backend email boundary; use sink Contact behavior in UAT and real subscriber Contact behavior in PRD; keep Segment assignment optional/deferred.
- [x] 3.5 Store safe consent evidence in Resend Contact properties: consent source, consent copy version, consent timestamp, and newsletter Topic ID.
- [x] 3.6 Add tests for valid signup, invalid email, duplicate signup/update, provider failure, consent-required behavior, consent evidence, explicit Topic opt-in, UAT sink Contact routing, PRD contact routing, and free-tier guardrails.

## 4. Docs, Boundaries, And Validation

- [x] 4.1 Update module-boundary manifest and audits for email application and Resend SDK infrastructure ownership.
- [x] 4.2 Update README/env docs with Resend SDK runtime usage, newsletter signup behavior, Free tier limits, `blackboxrecordsathens.com` sending-domain setup, Cloudflare Email Routing inbound alias behavior where it supports reply routing, CLI verification, manual DNS/secret checkpoints, Local/UAT/PRD config, and runtime-vs-verification boundaries.
- [x] 4.3 Run OpenSpec validation, unit tests, check, and build; record any provider-side checks that remain manual.

## 5. Email Art Direction Polish

- [x] 5.1 Add non-secret Worker email brand config for `EMAIL_BRAND_LOGO_URL` and `EMAIL_BRAND_HOME_URL`, with validation through the existing `PRODUCT_ENVIRONMENT` and `ProductEnvironmentProfile` flow, Local/UAT/PRD Wrangler values, runtime-config verifier categories, docs, and tests. UAT should point at the GitHub Pages UAT logo/home URLs; PRD should point at the Cloudflare Pages PRD logo/home URLs until a custom public site domain is approved.
- [x] 5.2 Refactor the paid-order email frame into explicit email-safe BlackBox design tokens: near-black shell, hard-edged 620px panel, off-white text, muted metadata, restrained Store Blood warning/accent treatment, email-safe font stack, mobile table behavior, and no generic provider receipt styling.
- [x] 5.3 Add the BlackBox logo header lockup using the configured public HTTPS logo URL, explicit dimensions, useful alt text, a home link, and image-blocked-safe fallback behavior so blocked images still identify `BlackBox Records` and never hide transactional content.
- [x] 5.4 Redesign the shopper confirmation as a compact editorial receipt: logo lockup, stable human-readable order reference, item/quantity summary with optional product image, total paid, safe payment received wording, fulfillment expectations, support CTA, and separate payment-document note without newsletter or marketing upsell blocks.
- [x] 5.5 Redesign the ops fulfillment email as an action-first internal note: logo lockup, subject/preheader, top fulfillment checklist, stable order reference, order/item/variant/quantity summary with optional product image, required shopper contact, structured shipping address details, and prominent shopper-send-failure warnings without raw Stripe, D1, webhook, shipping, or Resend payload dumps.
- [x] 5.6 Extend previews and tests for logo-loaded and logo-blocked states, product image rendering and image-blocked-safe live text, mobile-width rendering, long item/address/name cases, UAT sink routing, required shopper contact, shopper send failure warning, dark/light client color behavior, text fallbacks, and snapshot coverage.
- [x] 5.7 Add a visual QA path for rendered email preview HTML using the native Codex Browser Use plugin when previews are rendered through a local file or route; record Browser Use as not required only if the task remains source/spec/test-only without rendered email inspection.
- [x] 5.8 Run `pnpm openspec -- validate integrate-resend-email --type change --strict`, `pnpm openspec -- validate --all --strict`, `pnpm test:unit`, `pnpm check`, and `pnpm build`; record any provider-side or email-client checks that remain manual.

Implementation notes:

- Runtime implementation uses the official Resend SDK through the backend email boundary; no provider payloads or secrets cross into the browser.
- Paid-order references use a stable `BBR-YYYY-MM-DD-<three custom dictionary words>` shape from `unique-names-generator` with repo-owned label/distro dictionaries, seeded from order identity rather than generated randomly during template rendering.
- Paid-order item summaries may include catalog-backed public product thumbnails, but all shopper and ops transactional facts remain live text so image-blocked clients still show the full order meaning.
- Newsletter signup and purchase opt-in use Resend Contacts with explicit Topic opt-in; Segment assignment remains optional/deferred.
- Welcome email behavior, newsletter broadcast composition/sending, and provider account/domain/key automation remain deferred unless explicitly added during review.
- UAT proof completed with sandbox Worker deploy, required Resend Worker secrets, required Resend contact properties, and `pnpm smoke:resend-uat` passing against the deployed sandbox Worker.
- Browser Use was unavailable in the active tool session for email preview QA. Rendered local preview HTML was inspected through the documented DevTools fallback, including shopper and ops previews, logo request status, accessibility snapshots, console cleanliness, and mobile screenshots saved under `.codex-artifacts/email-previews/`.

## 0. Resend Provider Proof

- [ ] 0.1 Install or locate the Resend CLI, authenticate with `resend login` or CI-safe `RESEND_API_KEY`, and verify `resend --version` runs in the operator environment.
- [ ] 0.2 Run `resend doctor --json` and capture redacted proof that the CLI can reach the intended Resend account/team.
- [ ] 0.3 Confirm the intended Resend account stays on the Free tier and supports transactional email volume, marketing contact allowance, automation limits, and `blackboxrecordsathens.com` as the single verified sending domain.
- [ ] 0.4 Run read-only CLI checks for `blackboxrecordsathens.com` domain readiness, sender readiness, Contacts, Topics, and Segments before Worker runtime email implementation begins.
- [ ] 0.5 Prove the official `resend` SDK imports and supports the required send/idempotency/contact/topic shape in the Worker toolchain, or record the exact SDK gap before discussing a REST fallback.
- [ ] 0.6 Record manual checkpoints for Cloudflare Email Routing setup, DNS, SPF/DKIM/DMARC alignment, API-key creation, Topic/Segment setup, and Cloudflare Worker secret upload; do not continue to live UAT/PRD provider acceptance until the required checkpoints pass or are explicitly accepted.

## 1. SDK-Backed Runtime Contract

- [ ] 1.1 Add Worker Resend runtime bindings and validation coverage for API key, `orders@blackboxrecordsathens.com` sender, `support@blackboxrecordsathens.com` reply-to, ops recipient, required newsletter Topic config, optional/deferred newsletter Segment config, Free tier assumptions, and UAT recipient/contact override.
- [ ] 1.2 Add a backend email application module with library-style entrypoints, rich repo-owned template builders, newsletter contact registration, recipient/contact routing, deterministic idempotency key creation, and provider-safe errors.
- [ ] 1.3 Add a Resend SDK infrastructure gateway that wraps the official `resend` package and maps SDK success/failure results without exposing provider payloads outside the backend boundary.
- [ ] 1.4 Add `resend:verify` CLI diagnostics with read-only account/domain/sender checks and ignored non-secret readiness output.

## 2. Paid Order Email

- [ ] 2.1 Extend Stripe Checkout Session mapping to capture shopper email safely from `customer_details.email` with `customer_email` fallback.
- [ ] 2.2 Trigger paid-order email notifications only after first-time paid reconciliation applies, with replay/non-paid/needs-review safeguards and deterministic idempotency keys.
- [ ] 2.3 Design rich shopper and ops HTML/text email content for this epic, including order summary, fulfillment expectations, support contact, and ops-safe fulfillment context.
- [ ] 2.4 Add tests for shopper email, ops email, rich template content, missing shopper email, replay suppression, provider failure handling, UAT sink routing, and PRD recipient routing.

## 3. Newsletter Registration

- [ ] 3.1 Add a provider-safe Worker newsletter registration endpoint for the existing homepage/about signup forms.
- [ ] 3.2 Add clear newsletter consent UX for site forms and checkout opt-in, including copy for BlackBox Records news, releases, distro updates, and event notes, plus unsubscribe-anytime language and privacy/support context.
- [ ] 3.3 Add shopper newsletter opt-in during purchase, preserving explicit unchecked consent and avoiding browser exposure of Resend IDs or secrets.
- [ ] 3.4 Add Resend Contact create/update and required explicit Topic opt-in behavior through the backend email boundary; keep Segment assignment optional/deferred.
- [ ] 3.5 Store safe consent evidence in Resend Contact properties: consent source, consent copy version, consent timestamp, and newsletter Topic ID.
- [ ] 3.6 Add tests for valid signup, invalid email, duplicate signup/update, provider failure, consent-required behavior, consent evidence, explicit Topic opt-in, UAT-safe routing, PRD contact routing, and free-tier guardrails.

## 4. Docs, Boundaries, And Validation

- [ ] 4.1 Update module-boundary manifest and audits for email application and Resend SDK infrastructure ownership.
- [ ] 4.2 Update README/env docs with Resend SDK runtime usage, newsletter signup behavior, Free tier limits, `blackboxrecordsathens.com` sending-domain setup, Cloudflare Email Routing inbound alias behavior, CLI verification, manual DNS/secret checkpoints, Local/UAT/PRD config, and runtime-vs-verification boundaries.
- [ ] 4.3 Run OpenSpec validation, unit tests, check, and build; record any provider-side checks that remain manual.

Planning notes:

- Runtime implementation was intentionally discarded before review completion; these tasks remain unchecked until the spec is approved and implementation restarts.
- Resend CLI/provider checks and official SDK compatibility remain the first required implementation step and are not yet complete.
- Newsletter signup and purchase opt-in are now in scope through Resend Contacts and Topic/Segment enrollment.
- Welcome email behavior, newsletter broadcast composition/sending, and provider account/domain/key automation remain deferred unless explicitly added during review.

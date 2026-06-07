## Context

The Worker already owns checkout creation, verified Stripe webhooks, D1 order state, and stock changes. Email delivery is not yet modeled in baseline specs, and provider setup for Resend requires both repo verification and explicit operator-owned account/DNS/secret steps.

Resend has two different roles in this change:

- Runtime email provider called by the Worker through the official Resend SDK.
- Setup/diagnostic provider CLI used by operators and scripts before deployment.

This change includes paid-order transactional email, rich BlackBox-designed shopper and ops email templates, Resend-backed newsletter registration for existing signup forms, and shopper newsletter opt-in during purchase. Welcome email behavior, newsletter broadcast composition/sending, and provider resource automation should be proposed separately after this boundary is reviewed.

## Goals / Non-Goals

**Goals:**

- Keep Resend API keys, sender config, and ops recipients in Worker runtime config.
- Send rich paid-order shopper and ops emails only after the first verified paid Stripe reconciliation.
- Register newsletter subscribers through Resend Contacts and Topic/Segment enrollment from existing site forms and purchase opt-in.
- Keep the runtime and provider setup compatible with the Resend Free tier.
- Provide a `resend:verify` script for diagnostics and readiness checks.
- Keep local tests deterministic through application-level provider mocks.

**Non-Goals:**

- No repo-owned newsletter broadcast composition/sending.
- No welcome email in this change unless explicitly added during review.
- No Resend provider account, API key, domain, DNS, template, Segment, Topic, or automation creation/mutation automation.
- No Resend CLI usage in production runtime.
- No public exposure of Resend provider IDs, API keys, D1 internals, Stripe secrets, raw webhook payloads, or raw shipping payloads.
- No automatic DNS mutation or Cloudflare Worker secret upload unless a later approved provider-automation slice adds credentials and explicit safeguards.

## Decisions

- **Use the official Resend SDK behind an infrastructure gateway.** Runtime delivery and newsletter contact operations use the `resend` package for email sending, Contact create/update, and Topic/Segment enrollment where supported. Route handlers, order reconciliation, and frontend code must not import the SDK directly. If a required provider operation is not supported by the SDK or fails in Cloudflare Workers, document the gap before adding a REST fallback.
- **Model email as an internal backend library boundary.** Add backend application services for transactional email under a closed email module, backed by a Resend SDK infrastructure gateway. This keeps a clean cut without creating a new workspace package before multiple runtimes need it.
- **Use provider idempotency and local replay checks.** Shopper and ops paid emails use deterministic idempotency keys based on checkout session plus message purpose. Replayed Stripe webhook events and non-applied reconciliation results do not call Resend. Provider idempotency is a retry aid, not the only duplicate-send guard.
- **Keep templates repo-owned and designed in this epic.** Rich shopper and ops HTML/text builders live in source with unit tests. Resend Templates are not required for v1, preventing dashboard drift from becoming runtime behavior.
- **Keep newsletter registration provider-owned but app-mediated.** The Worker exposes a provider-safe newsletter registration endpoint, validates consent and email input, and creates or updates Resend Contacts with a required newsletter Topic opt-in through the backend email boundary. Segment assignment is optional and deferred until audience grouping is needed.
- **Capture newsletter consent evidence.** Newsletter registration stores safe consent evidence in Resend Contact properties, including consent source, copy version, consent timestamp, and newsletter Topic ID. The public form and checkout checkbox use clear BlackBox marketing copy, identify BlackBox as the sender, link to privacy/support context, and keep provider responses hidden from the browser.
- **Require explicit Topic subscription.** The Resend newsletter Topic is configured so Contacts do not receive newsletter Broadcasts unless they explicitly subscribe. Double opt-in, welcome email, honeypot, rate limiting, and CAPTCHA are not part of this change unless approved later.
- **Stay inside Resend Free tier.** The change must not require more than one verified custom domain, more than 3,000 transactional emails per month, more than 100 transactional emails per day, more than the free marketing contact allowance, dedicated IPs, paid overage, or paid support features.
- **Use `blackboxrecordsathens.com` as the verified sending domain.** The domain is bought through Spaceship and delegated to Cloudflare nameservers, so Cloudflare is the DNS control plane for Resend records and Cloudflare Email Routing records. The domain becomes the single Resend Free-tier sending domain for `orders@blackboxrecordsathens.com` transactional mail and future `newsletter@blackboxrecordsathens.com` newsletter mail, while Cloudflare Email Routing handles inbound aliases and catch-all forwarding to Gmail. Runtime reply-to uses `support@blackboxrecordsathens.com`. DNS verification, SPF/DKIM/DMARC alignment, any SPF record merging, and Cloudflare Email Routing setup remain manual operator checkpoints. Runtime implementation may proceed against mocks and provider proof, but UAT/PRD live provider acceptance cannot complete until the domain DNS and Resend verification are done.
- **Use Resend CLI for verification only.** `resend:verify` runs CLI commands in JSON mode for `doctor` and read-only domain/sender readiness checks. It writes only non-secret readiness reports to ignored local files.
- **Gate runtime work on Resend SDK and CLI proof.** The first implementation step is validation: prove `resend --version`, `resend doctor --json`, Free-tier account fit, read-only `blackboxrecordsathens.com` domain/sender/contact/topic checks, and a Worker-compatible SDK import/send/contact shape for the intended account/team, or record an explicit manual checkpoint before continuing.
- **Route email by Product Environment.** UAT is the Worker sandbox runtime target and sends every application email to `blackboxrecordsathens+TESTING@gmail.com` through `RESEND_UAT_RECIPIENT_OVERRIDE_EMAIL`, while preserving intended recipients in safe test content/tags. PRD is the Worker production runtime target and ignores that override.
- **Use explicit runtime config names.** The Worker runtime contract includes `RESEND_API_KEY`, `RESEND_FROM_EMAIL=orders@blackboxrecordsathens.com`, `RESEND_REPLY_TO_EMAIL=support@blackboxrecordsathens.com`, `RESEND_OPS_TO_EMAIL`, `RESEND_UAT_RECIPIENT_OVERRIDE_EMAIL=blackboxrecordsathens+TESTING@gmail.com`, and `RESEND_NEWSLETTER_TOPIC_ID`. `RESEND_NEWSLETTER_SEGMENT_ID` is optional and deferred.

## Risks / Trade-offs

- **SDK Cloudflare Worker compatibility issue** -> stop implementation and record the exact SDK gap before proposing a REST fallback.
- **Provider rate limits or outages** -> log paid-order email failures without undoing paid order reconciliation or stock changes.
- **Email send succeeds but later webhook replay occurs** -> deterministic idempotency keys prevent duplicate sends within provider idempotency windows, and local first-paid-transition checks avoid runtime replay sends.
- **Operator setup drift** -> `resend:verify` supports JSON diagnostics and read-only resource checks, and docs list manual DNS/secret checkpoints separately.
- **Missing shopper email in Stripe session** -> send ops notification with missing-email context and skip shopper confirmation rather than failing order reconciliation.

## Migration Plan

1. Configure and validate Resend Free tier account fit, CLI access, `blackboxrecordsathens.com` domain/sender/contact/topic checks, and SDK compatibility with redacted proof; record any DNS, Cloudflare Email Routing, or secret setup that remains manual.
2. Add OpenSpec deltas and validate `integrate-resend-email` strictly.
3. Add backend env contract, Resend SDK gateway, email/newsletter services, paid webhook trigger, rich email templates, verification script, and tests.
4. Add environment-aware recipient/contact routing and UAT sink tests.
5. Update docs with runtime-vs-verification boundaries and manual DNS/secret checkpoints.
6. Validate locally with mocked Resend gateway behavior, then run required repo gates.
7. Operator manually creates/verifies the single sending domain/subdomain DNS and stores real Worker secrets before UAT/PRD provider testing.

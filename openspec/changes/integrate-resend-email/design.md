## Context

The Worker already owns checkout creation, verified Stripe webhooks, D1 order state, and stock changes. `NewsletterSignup.astro` currently renders a static form with no backend endpoint. Email delivery is not yet modeled in baseline specs, and provider setup for Resend requires both repo automation and explicit operator-owned account/DNS/secret steps.

Resend has two different roles in this change:

- Runtime email provider called by the Worker through HTTPS REST requests.
- Setup/diagnostic provider CLI used by operators and scripts before deployment.

## Goals / Non-Goals

**Goals:**

- Keep Resend API keys, sender config, Segment/Topic IDs, and ops recipients in Worker runtime config.
- Send paid-order shopper and ops emails only after the first verified paid Stripe reconciliation.
- Add newsletter signup capture with explicit single opt-in consent, Contact enrollment, optional Topic opt-in, and a welcome email.
- Provide a `resend:setup` script for diagnostics and non-secret provider resource preparation.
- Keep local tests deterministic through provider mocks and an optional test API base URL.

**Non-Goals:**

- No repo-owned newsletter broadcast sending.
- No Resend CLI usage in production runtime.
- No public exposure of Resend provider IDs, API keys, D1 internals, Stripe secrets, raw webhook payloads, or raw shipping payloads.
- No automatic DNS mutation or Cloudflare Worker secret upload unless a later approved provider-automation slice adds credentials and explicit safeguards.

## Decisions

- **Use Worker `fetch` instead of the Resend SDK at runtime.** Workers can call Resend's REST API directly with explicit headers, idempotency keys, and test base URL override. This avoids SDK/runtime compatibility risk and keeps production runtime independent from the setup CLI.
- **Model email as an application boundary.** Add backend application services for transactional email and newsletter subscription, backed by an infrastructure Resend client. Stripe webhook routes call the email service only after order reconciliation returns a first-time paid application result.
- **Use provider idempotency and local replay checks.** Shopper and ops paid emails use deterministic idempotency keys based on checkout session plus message purpose. Replayed Stripe webhook events and non-applied reconciliation results do not call Resend.
- **Keep templates repo-owned.** HTML/text builders live in source with unit tests. Resend Templates are not required for v1, preventing dashboard drift from becoming runtime behavior.
- **Use Resend CLI for setup only.** `resend:setup` runs CLI commands in JSON mode for `doctor`, domain inspection, Segment/Topic checks, and optional API key creation. It writes only non-secret IDs/reports to ignored local files.
- **Gate runtime work on Resend CLI proof.** The first implementation step is CLI configuration and validation: prove `resend --version`, `resend doctor --json`, and read-only domain/Segment/Topic checks work for the intended account/team, or record an explicit manual checkpoint before continuing.
- **Use single opt-in newsletter consent.** The UI requires an explicit checkbox. The Worker stores consent metadata as Resend Contact properties and sends the welcome email only for a new opt-in transition.
- **Route email by Product Environment.** UAT is the Worker sandbox runtime target and sends every application email to `blackboxrecordsathens@gmail.com` through `RESEND_UAT_RECIPIENT_OVERRIDE_EMAIL`, while preserving intended recipients in safe test content/tags. PRD is the Worker production runtime target and ignores that override.
- **Keep UAT newsletter sink-only.** Public UAT newsletter signups validate consent and send a test welcome to the sink, but do not create Resend Contacts for submitted addresses. PRD owns real Contact, Segment, Topic, and welcome-email behavior.

## Risks / Trade-offs

- **Provider rate limits or outages** -> return provider-safe errors for newsletter signup and log paid-order email failures without undoing paid order reconciliation or stock changes.
- **Email send succeeds but later webhook replay occurs** -> deterministic idempotency keys prevent duplicate sends within provider idempotency windows, and local first-paid-transition checks avoid runtime replay sends.
- **Operator setup drift** -> `resend:setup` supports JSON diagnostics and resource checks, and docs list manual DNS/secret checkpoints separately.
- **Missing shopper email in Stripe session** -> send ops notification with missing-email context and skip shopper confirmation rather than failing order reconciliation.
- **Contact already exists** -> treat existing subscribed/segment-enrolled contacts as idempotent success and do not expose provider details to the browser.
- **UAT contact pollution** -> avoid storing arbitrary public UAT submissions in Resend Contacts; use `resend:setup` with controlled operator-owned resources for provider setup checks.

## Migration Plan

1. Configure and validate Resend CLI access with redacted proof, or record the exact manual checkpoint blocking provider validation.
2. Add OpenSpec deltas and validate `integrate-resend-email` strictly.
3. Add backend env contract, Resend client, email services, newsletter route, paid webhook trigger, templates, setup script, tests, and generated API client changes.
4. Update newsletter UI and docs.
5. Add environment-aware recipient routing and UAT newsletter sink-only tests.
6. Validate locally with mocked Resend behavior, then run required repo gates.
7. Operator manually creates/verifies sending domain DNS and stores real Worker secrets before UAT/PRD provider testing.

## Context

The Worker already owns checkout creation, verified Stripe webhooks, D1 order state, and stock changes. Email delivery is not yet modeled in baseline specs, and provider setup for Resend requires both repo verification and explicit operator-owned account/DNS/secret steps.

Resend has two different roles in this change:

- Runtime email provider called by the Worker through the official Resend SDK.
- Setup/diagnostic provider CLI used by operators and scripts before deployment.

This change intentionally limits scope to paid-order transactional email. Newsletter signup, Contact Segment/Topic enrollment, welcome email behavior, and provider resource automation should be proposed separately after the transactional boundary is reviewed.

## Goals / Non-Goals

**Goals:**

- Keep Resend API keys, sender config, and ops recipients in Worker runtime config.
- Send paid-order shopper and ops emails only after the first verified paid Stripe reconciliation.
- Provide a `resend:verify` script for diagnostics and readiness checks.
- Keep local tests deterministic through application-level provider mocks.

**Non-Goals:**

- No repo-owned newsletter broadcast sending.
- No newsletter signup endpoint, Contact enrollment, Segment/Topic enrollment, or welcome email in this change.
- No Resend provider resource creation or mutation automation.
- No Resend CLI usage in production runtime.
- No public exposure of Resend provider IDs, API keys, D1 internals, Stripe secrets, raw webhook payloads, or raw shipping payloads.
- No automatic DNS mutation or Cloudflare Worker secret upload unless a later approved provider-automation slice adds credentials and explicit safeguards.

## Decisions

- **Use the official Resend SDK behind an infrastructure gateway.** Runtime delivery uses the `resend` package for email sending and any other supported Resend operation. Route handlers, order reconciliation, and frontend code must not import the SDK directly. If a required provider operation is not supported by the SDK or fails in Cloudflare Workers, document the gap before adding a REST fallback.
- **Model email as an internal backend library boundary.** Add backend application services for transactional email under a closed email module, backed by a Resend SDK infrastructure gateway. This keeps a clean cut without creating a new workspace package before multiple runtimes need it.
- **Use provider idempotency and local replay checks.** Shopper and ops paid emails use deterministic idempotency keys based on checkout session plus message purpose. Replayed Stripe webhook events and non-applied reconciliation results do not call Resend. Provider idempotency is a retry aid, not the only duplicate-send guard.
- **Keep templates repo-owned.** HTML/text builders live in source with unit tests. Resend Templates are not required for v1, preventing dashboard drift from becoming runtime behavior.
- **Use Resend CLI for verification only.** `resend:verify` runs CLI commands in JSON mode for `doctor` and read-only domain/sender readiness checks. It writes only non-secret readiness reports to ignored local files.
- **Gate runtime work on Resend SDK and CLI proof.** The first implementation step is validation: prove `resend --version`, `resend doctor --json`, read-only domain/sender checks, and a Worker-compatible SDK import/send shape for the intended account/team, or record an explicit manual checkpoint before continuing.
- **Route email by Product Environment.** UAT is the Worker sandbox runtime target and sends every application email to `blackboxrecordsathens@gmail.com` through `RESEND_UAT_RECIPIENT_OVERRIDE_EMAIL`, while preserving intended recipients in safe test content/tags. PRD is the Worker production runtime target and ignores that override.

## Risks / Trade-offs

- **SDK Cloudflare Worker compatibility issue** -> stop implementation and record the exact SDK gap before proposing a REST fallback.
- **Provider rate limits or outages** -> log paid-order email failures without undoing paid order reconciliation or stock changes.
- **Email send succeeds but later webhook replay occurs** -> deterministic idempotency keys prevent duplicate sends within provider idempotency windows, and local first-paid-transition checks avoid runtime replay sends.
- **Operator setup drift** -> `resend:verify` supports JSON diagnostics and read-only resource checks, and docs list manual DNS/secret checkpoints separately.
- **Missing shopper email in Stripe session** -> send ops notification with missing-email context and skip shopper confirmation rather than failing order reconciliation.

## Migration Plan

1. Configure and validate Resend CLI access plus SDK compatibility with redacted proof, or record the exact manual checkpoint blocking provider validation.
2. Add OpenSpec deltas and validate `integrate-resend-email` strictly.
3. Add backend env contract, Resend SDK gateway, email services, paid webhook trigger, templates, verification script, and tests.
4. Add environment-aware recipient routing and UAT sink tests.
5. Update docs with runtime-vs-verification boundaries and manual DNS/secret checkpoints.
6. Validate locally with mocked Resend gateway behavior, then run required repo gates.
7. Operator manually creates/verifies sending domain DNS and stores real Worker secrets before UAT/PRD provider testing.

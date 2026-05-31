## 0. Resend CLI Configuration And Provider Proof

- [ ] 0.1 Install or locate the Resend CLI, authenticate with `resend login` or CI-safe `RESEND_API_KEY`, and verify `resend --version` runs in the operator environment.
- [ ] 0.2 Run `resend doctor --json` and capture redacted proof that the CLI can reach the intended Resend account/team.
- [ ] 0.3 Run read-only CLI checks for the target environment's sending domain, newsletter Segment, and optional Topic before any Worker runtime email implementation begins.
- [ ] 0.4 Record any required manual checkpoints for DNS, API-key creation, or Cloudflare Worker secret upload; do not continue to runtime email work until CLI validation passes or the checkpoint is explicitly accepted.

## 1. Provider Setup And Runtime Contract

- [ ] 1.1 Add Worker Resend runtime bindings and validation coverage for API key, sender, ops recipient, newsletter Segment, optional Topic, and optional test API base URL.
- [ ] 1.2 Add a Resend REST infrastructure client with explicit `User-Agent`, bearer auth, JSON errors, idempotency-key support, contact upsert/enrollment, and test base URL override.
- [ ] 1.3 Add `resend:setup` CLI automation with dry-run/apply modes, JSON diagnostics, Segment/Topic/domain checks, optional API-key creation, and ignored non-secret setup output.

## 2. Paid Order Email

- [ ] 2.1 Add repo-owned paid-order shopper and ops HTML/text template builders with unit tests and no secret/provider payload exposure.
- [ ] 2.2 Extend Stripe Checkout Session mapping to capture shopper email safely from `customer_details.email` with `customer_email` fallback.
- [ ] 2.3 Trigger paid-order email notifications only after first-time paid reconciliation applies, with replay/non-paid/needs-review safeguards and deterministic idempotency keys.

## 3. Newsletter Subscription

- [ ] 3.1 Add `POST /api/newsletter/subscriptions` OpenAPI contract, route, service, and generated API client support.
- [ ] 3.2 Implement newsletter subscription Resend behavior for single opt-in consent, Contact upsert, Segment/Topic enrollment, consent metadata, idempotent existing subscribers, and first-opt-in welcome email.
- [ ] 3.3 Wire the static Astro newsletter form to the Worker endpoint with explicit consent UI, accessible status/error states, and browser-safe provider failures.

## 4. Docs, Boundaries, And Validation

- [ ] 4.1 Update module-boundary manifest and audits for email application/infrastructure and newsletter route ownership.
- [ ] 4.2 Update README/env docs with Resend CLI setup, manual DNS/secret checkpoints, Local/UAT/PRD config, and runtime-vs-setup boundaries.
- [ ] 4.3 Run OpenSpec validation, unit tests, check, build, and Browser Use newsletter UI verification; record any provider-side checks that remain manual.

## 5. Environment-Aware Delivery Amendment

- [ ] 5.1 Add environment-aware recipient routing so UAT/sandbox sends all Resend application emails to `blackboxrecordsathens@gmail.com` and PRD/production sends to buyer and ops recipients.
- [ ] 5.2 Add Worker config validation for `RESEND_UAT_RECIPIENT_OVERRIDE_EMAIL` in UAT and ensure PRD ignores the UAT override.
- [ ] 5.3 Update newsletter behavior so UAT validates consent and sends sink welcome tests without creating/updating Resend Contacts, while PRD keeps real Contact/Segment/Topic enrollment.
- [ ] 5.4 Add tests and docs for UAT paid-order routing, PRD recipient routing, UAT newsletter sink-only behavior, PRD newsletter enrollment, and runtime config verification.

Planning notes:

- Runtime implementation was intentionally discarded before review completion; these tasks remain unchecked until the spec is approved and implementation restarts.
- Resend CLI/provider checks remain the first required implementation step and are not yet complete.


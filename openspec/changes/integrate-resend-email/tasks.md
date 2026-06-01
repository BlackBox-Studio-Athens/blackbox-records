## 0. Resend Provider Proof

- [ ] 0.1 Install or locate the Resend CLI, authenticate with `resend login` or CI-safe `RESEND_API_KEY`, and verify `resend --version` runs in the operator environment.
- [ ] 0.2 Run `resend doctor --json` and capture redacted proof that the CLI can reach the intended Resend account/team.
- [ ] 0.3 Run read-only CLI checks for the target environment's sending domain and sender readiness before any Worker runtime email implementation begins.
- [ ] 0.4 Prove the official `resend` SDK imports and supports the required send/idempotency shape in the Worker toolchain, or record the exact SDK gap before discussing a REST fallback.
- [ ] 0.5 Record any required manual checkpoints for DNS, API-key creation, or Cloudflare Worker secret upload; do not continue to runtime email work until validation passes or the checkpoint is explicitly accepted.

## 1. SDK-Backed Runtime Contract

- [ ] 1.1 Add Worker Resend runtime bindings and validation coverage for API key, sender, ops recipient, and UAT recipient override.
- [ ] 1.2 Add a backend email application module with library-style entrypoints, repo-owned template builders, recipient routing, deterministic idempotency key creation, and provider-safe errors.
- [ ] 1.3 Add a Resend SDK infrastructure gateway that wraps the official `resend` package and maps SDK success/failure results without exposing provider payloads outside the backend boundary.
- [ ] 1.4 Add `resend:verify` CLI diagnostics with read-only account/domain/sender checks and ignored non-secret readiness output.

## 2. Paid Order Email

- [ ] 2.1 Extend Stripe Checkout Session mapping to capture shopper email safely from `customer_details.email` with `customer_email` fallback.
- [ ] 2.2 Trigger paid-order email notifications only after first-time paid reconciliation applies, with replay/non-paid/needs-review safeguards and deterministic idempotency keys.
- [ ] 2.3 Add tests for shopper email, ops email, missing shopper email, replay suppression, provider failure handling, UAT sink routing, and PRD recipient routing.

## 3. Docs, Boundaries, And Validation

- [ ] 3.1 Update module-boundary manifest and audits for email application and Resend SDK infrastructure ownership.
- [ ] 3.2 Update README/env docs with Resend SDK runtime usage, CLI verification, manual DNS/secret checkpoints, Local/UAT/PRD config, and runtime-vs-verification boundaries.
- [ ] 3.3 Run OpenSpec validation, unit tests, check, and build; record any provider-side checks that remain manual.

Planning notes:

- Runtime implementation was intentionally discarded before review completion; these tasks remain unchecked until the spec is approved and implementation restarts.
- Resend CLI/provider checks and official SDK compatibility remain the first required implementation step and are not yet complete.
- Newsletter signup, Contact Segment/Topic enrollment, welcome email behavior, and provider resource automation are intentionally deferred to later OpenSpec changes.

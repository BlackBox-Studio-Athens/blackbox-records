## 1. Current-State Audit

- [x] 1.1 Inspect current sandbox Stripe webhook endpoint state with Stripe CLI/API and record redacted endpoint URL, status, livemode, and enabled event coverage locally.
- [x] 1.2 Inspect sandbox Worker secret/binding visibility through Wrangler or Cloudflare tooling without printing `STRIPE_WEBHOOK_SECRET`.
- [ ] 1.3 Confirm the six-hour sandbox cron remains configured in `apps/backend/wrangler.jsonc` and deployed Worker state.
- [x] 1.4 Re-read `scripts/start-stripe-sandbox-listener.ts` and document the exact behavior that currently syncs a transient `stripe listen` secret into the sandbox Worker.

## 2. Webhook Endpoint Verifier

- [x] 2.1 Add a root script `stripe:webhooks:verify` that runs a TypeScript verifier with explicit `--env sandbox` argument parsing.
- [x] 2.2 Implement Stripe webhook endpoint lookup for the sandbox account, matching the exact deployed Worker webhook URL and rejecting missing, disabled, duplicate, wrong-mode, or Connect-only matches.
- [x] 2.3 Verify required catalog event subscriptions: `product.created`, `product.updated`, `product.deleted`, `price.created`, `price.updated`, and `price.deleted`.
- [x] 2.4 Report extra enabled events as redacted diagnostics, preserving compatibility with checkout events on the same route without treating extra events as failure by default.
- [x] 2.5 Add Worker secret-presence classification that reports `present`, `missing`, or `unverified` without exposing secret values.
- [x] 2.6 Make verifier output distinguish endpoint configuration proof from signing-secret match proof.
- [x] 2.7 Add focused unit tests for URL matching, event-set validation, duplicate endpoints, disabled endpoints, test/live mode mismatch, redaction, and secret-presence classification.

## 3. Setup and Secret Rotation Path

- [x] 3.1 Add an explicit setup path or operator runbook for creating/registering the sandbox Stripe webhook endpoint with the deployed Worker URL.
- [x] 3.2 Keep the first implementation verify-only; do not create, update, delete, or rotate Stripe webhook endpoints from the verifier in this slice.
- [x] 3.3 Document that endpoint creation or secret rotation must be followed by `wrangler secret put STRIPE_WEBHOOK_SECRET --env sandbox` without logging the secret.
- [x] 3.4 For an already-existing endpoint, document the manual secret reveal/copy path because Stripe endpoint retrieval does not return the secret value after creation.
- [x] 3.5 Add failure messaging for the case where endpoint URL/events are valid but secret match remains unproven until manual secret update or delivery evidence exists.

## 4. Listener and Smoke Contract

- [x] 4.1 Change `scripts/start-stripe-sandbox-listener.ts` so it cannot silently overwrite the deployed sandbox Worker's primary `STRIPE_WEBHOOK_SECRET` with a transient listener secret.
- [x] 4.2 Update paid sandbox smoke guidance so persistent Stripe Dashboard webhook delivery is the preferred deployed-sandbox path after the endpoint is configured.
- [x] 4.3 Keep `stripe listen` available only for local Worker diagnostics or explicitly-marked temporary smoke investigation.
- [x] 4.4 If temporary listener forwarding to the deployed Worker remains necessary, add an explicit multi-secret or isolated-mode design before implementing it.
- [x] 4.5 Add tests or script-level checks that prevent accidental secret sync regression in the listener helper.

## 5. Operator Proof and Documentation

- [x] 5.1 Update sandbox UAT or commerce operator docs with the persistent endpoint URL, required catalog event list, and secret-handling steps.
- [x] 5.2 Add `pnpm stripe:webhooks:verify --env sandbox` to the sandbox readiness/preflight evidence path beside `pnpm stripe:catalog:verify --env sandbox`.
- [x] 5.3 Document the layered guarantee: webhook near-real-time sync, Store Offer read reconciliation, checkout start revalidation, scheduled backstop, and manual catalog verification.
- [x] 5.4 Update any smoke evidence wording that currently implies `stripe listen` proves persistent webhook readiness.
- [x] 5.5 Keep all docs redacted: no Stripe webhook signing secrets, full endpoint IDs, Stripe object IDs, account-private IDs, or Dashboard screenshots with sensitive content.

## 6. Validation

- [x] 6.1 Run the verifier against sandbox: `pnpm stripe:webhooks:verify --env sandbox`.
- [x] 6.2 Run catalog proof after endpoint setup: `pnpm stripe:catalog:verify --env sandbox`.
- [x] 6.3 Run targeted unit tests for the webhook verifier and listener-secret regression coverage.
- [x] 6.4 Run a sandbox checkout smoke that proves deployed Worker webhook delivery without relying on a transient listener as persistent readiness evidence.
- [x] 6.5 Run `pnpm test:unit`.
- [x] 6.6 Run `pnpm check`.
- [x] 6.7 Run `pnpm build`.
- [x] 6.8 Run `openspec validate verify-stripe-sandbox-webhook-endpoint --type change --strict`.
- [x] 6.9 Run `openspec validate --all --strict`.

### Current Sandbox Endpoint Evidence

- 2026-05-24: `pnpm stripe:webhooks:verify --env sandbox` reached one enabled account endpoint for the sandbox Worker webhook URL; output was redacted and showed livemode `false`.
- 2026-05-24: the same verification failed because the endpoint is missing required catalog events: `product.created`, `product.updated`, `product.deleted`, `price.created`, `price.updated`, and `price.deleted`.
- 2026-05-24: checkout events remain present as extra allowed events on the shared route; Worker `STRIPE_WEBHOOK_SECRET` presence is reported as present; deployed cron state remains unverified without `CLOUDFLARE_ACCOUNT_ID` and `CLOUDFLARE_API_TOKEN`.
- 2026-05-24: after manual Stripe endpoint event repair, `pnpm stripe:webhooks:verify --env sandbox` passed: the persistent sandbox endpoint is enabled, test-mode, uniquely matched, and covers the required Product and Price catalog events. Signing-secret match remains not provable through Stripe list/retrieve APIs.
- 2026-05-24: `pnpm stripe:catalog:verify --env sandbox` passed after endpoint repair with 11 variants checked and zero Product Projection, Price Authority, D1 readiness, or Store Offer snapshot issues.
- 2026-05-24: `pnpm smoke:stripe-sandbox -- --scenario happy_path_paid` created a paid, complete Stripe Checkout Session with matching Checkout projection, but failed because the sandbox D1 `CheckoutOrder` remained `pending_payment`; evidence is at `.codex-artifacts/stripe-sandbox-smoke/20260524102502/happy_path_paid/evidence.json`.
- 2026-05-24: follow-up Stripe API inspection found the matching `checkout.session.completed` event still had `pending_webhooks = 1`, so persistent webhook delivery or signing-secret match is not proven.
- 2026-05-24: after the sandbox Worker `STRIPE_WEBHOOK_SECRET` was updated from the persistent Stripe endpoint, `pnpm smoke:stripe-sandbox -- --scenario happy_path_paid` passed with evidence at `.codex-artifacts/stripe-sandbox-smoke/20260524103358/happy_path_paid/evidence.json`; the evidence shows a paid `CheckoutOrder`, Checkout Session amount `2800`, currency `EUR`, matching Product name, and matching Product image.

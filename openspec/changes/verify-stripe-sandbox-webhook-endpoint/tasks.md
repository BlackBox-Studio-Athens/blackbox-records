## 1. Current-State Audit

- [ ] 1.1 Inspect current sandbox Stripe webhook endpoint state with Stripe CLI/API and record redacted endpoint URL, status, livemode, and enabled event coverage locally.
- [ ] 1.2 Inspect sandbox Worker secret/binding visibility through Wrangler or Cloudflare tooling without printing `STRIPE_WEBHOOK_SECRET`.
- [ ] 1.3 Confirm the six-hour sandbox cron remains configured in `apps/backend/wrangler.jsonc` and deployed Worker state.
- [ ] 1.4 Re-read `scripts/start-stripe-sandbox-listener.ts` and document the exact behavior that currently syncs a transient `stripe listen` secret into the sandbox Worker.

## 2. Webhook Endpoint Verifier

- [ ] 2.1 Add a root script `stripe:webhooks:verify` that runs a TypeScript verifier with explicit `--env sandbox` argument parsing.
- [ ] 2.2 Implement Stripe webhook endpoint lookup for the sandbox account, matching the exact deployed Worker webhook URL and rejecting missing, disabled, duplicate, wrong-mode, or Connect-only matches.
- [ ] 2.3 Verify required catalog event subscriptions: `product.created`, `product.updated`, `product.deleted`, `price.created`, `price.updated`, and `price.deleted`.
- [ ] 2.4 Report extra enabled events as redacted diagnostics, preserving compatibility with checkout events on the same route without treating extra events as failure by default.
- [ ] 2.5 Add Worker secret-presence classification that reports `present`, `missing`, or `unverified` without exposing secret values.
- [ ] 2.6 Make verifier output distinguish endpoint configuration proof from signing-secret match proof.
- [ ] 2.7 Add focused unit tests for URL matching, event-set validation, duplicate endpoints, disabled endpoints, test/live mode mismatch, redaction, and secret-presence classification.

## 3. Setup and Secret Rotation Path

- [ ] 3.1 Add an explicit setup path or operator runbook for creating/registering the sandbox Stripe webhook endpoint with the deployed Worker URL.
- [ ] 3.2 Keep the first implementation verify-only; do not create, update, delete, or rotate Stripe webhook endpoints from the verifier in this slice.
- [ ] 3.3 Document that endpoint creation or secret rotation must be followed by `wrangler secret put STRIPE_WEBHOOK_SECRET --env sandbox` without logging the secret.
- [ ] 3.4 For an already-existing endpoint, document the manual secret reveal/copy path because Stripe endpoint retrieval does not return the secret value after creation.
- [ ] 3.5 Add failure messaging for the case where endpoint URL/events are valid but secret match remains unproven until manual secret update or delivery evidence exists.

## 4. Listener and Smoke Contract

- [ ] 4.1 Change `scripts/start-stripe-sandbox-listener.ts` so it cannot silently overwrite the deployed sandbox Worker's primary `STRIPE_WEBHOOK_SECRET` with a transient listener secret.
- [ ] 4.2 Update paid sandbox smoke guidance so persistent Stripe Dashboard webhook delivery is the preferred deployed-sandbox path after the endpoint is configured.
- [ ] 4.3 Keep `stripe listen` available only for local Worker diagnostics or explicitly-marked temporary smoke investigation.
- [ ] 4.4 If temporary listener forwarding to the deployed Worker remains necessary, add an explicit multi-secret or isolated-mode design before implementing it.
- [ ] 4.5 Add tests or script-level checks that prevent accidental secret sync regression in the listener helper.

## 5. Operator Proof and Documentation

- [ ] 5.1 Update sandbox UAT or commerce operator docs with the persistent endpoint URL, required catalog event list, and secret-handling steps.
- [ ] 5.2 Add `pnpm stripe:webhooks:verify --env sandbox` to the sandbox readiness/preflight evidence path beside `pnpm stripe:catalog:verify --env sandbox`.
- [ ] 5.3 Document the layered guarantee: webhook near-real-time sync, Store Offer read reconciliation, checkout start revalidation, scheduled backstop, and manual catalog verification.
- [ ] 5.4 Update any smoke evidence wording that currently implies `stripe listen` proves persistent webhook readiness.
- [ ] 5.5 Keep all docs redacted: no Stripe webhook signing secrets, full endpoint IDs, Stripe object IDs, account-private IDs, or Dashboard screenshots with sensitive content.

## 6. Validation

- [ ] 6.1 Run the verifier against sandbox: `pnpm stripe:webhooks:verify --env sandbox`.
- [ ] 6.2 Run catalog proof after endpoint setup: `pnpm stripe:catalog:verify --env sandbox`.
- [ ] 6.3 Run targeted unit tests for the webhook verifier and listener-secret regression coverage.
- [ ] 6.4 Run a sandbox checkout smoke that proves deployed Worker webhook delivery without relying on a transient listener as persistent readiness evidence.
- [ ] 6.5 Run `pnpm test:unit`.
- [ ] 6.6 Run `pnpm check`.
- [ ] 6.7 Run `pnpm build`.
- [ ] 6.8 Run `openspec validate verify-stripe-sandbox-webhook-endpoint --type change --strict`.
- [ ] 6.9 Run `openspec validate --all --strict`.

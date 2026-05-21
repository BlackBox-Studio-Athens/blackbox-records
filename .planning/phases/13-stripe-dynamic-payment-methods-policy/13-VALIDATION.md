# Phase 13 Validation Strategy

## Planning Validation

- Phase 13 has discussion, context, research, and plan artifacts.
- BL-22 points to Phase 13 as the active dynamic payment methods plan.
- Launch readiness includes Payment Method Configuration evidence before go-live.
- Ubiquitous language contains the payment-method terms used by the phase.
- Runtime code and Stripe account state are unchanged in this planning slice.

## Implementation Validation

Phase 13 implementation adds the repo-owned command `pnpm stripe:payment-methods:verify`.

Local code-invariant evidence:

- `pnpm --filter @blackbox/backend exec vitest run test/infrastructure/stripe/stripe-checkout-gateway.test.ts test/http/public-commerce-routes.test.ts test/scripts/stripe-test-preflight.test.ts test/scripts/local-stack.test.ts` passed on 2026-05-21.
- `pnpm check` passed on 2026-05-21.
- Gateway construction now fails when `STRIPE_PAYMENT_METHOD_CONFIGURATION_ID` is missing or blank.
- Checkout Session creation sends `payment_method_configuration` and does not send `payment_method_types`.
- Browser-facing code still receives only hosted Checkout URLs and browser-safe capability state, not Payment Method
  Configuration IDs, provider names, Stripe IDs, D1 bindings, or feature-gate internals.

Stripe configuration script evidence:

- Dry-run is the default mode.
- `--apply` is required before create/update calls are made.
- Evidence output redacts Stripe secrets and redacts Payment Method Configuration IDs to prefix plus last four characters.
- Returned Stripe payment method keys are classified as allowed, banned, or other.
- The verifier fails if any returned non-allowed method is effectively on.
- The verifier reports dashboard/account-eligibility gaps when an allowed method is absent or not effectively on.

CI evidence:

- `.github/workflows/cloudflare-sandbox.yml` now runs `pnpm stripe:payment-methods:verify` after unit tests and
  workspace checks, before sandbox Worker deploy.
- The CI step uses server-side `secrets.STRIPE_SECRET_KEY` and `vars.STRIPE_PAYMENT_METHOD_CONFIGURATION_ID`.
- The CI step runs dry-run verification only; it does not pass `--apply`.
- Hosted Checkout browser inspection is not the Phase 13 CI gate.

Pending external evidence:

- A real test-mode Stripe API dry-run summary must be captured by CI or an operator shell with:
  `STRIPE_SECRET_KEY=<test key> STRIPE_PAYMENT_METHOD_CONFIGURATION_ID=<pmc id> pnpm stripe:payment-methods:verify`.
- The copied evidence must include script mode, returned method keys, banned-method result, allowed-method gaps if any,
  and only redacted Payment Method Configuration IDs.
- Live-mode verification remains pending until Go-Live / Launch Hardening.

## Browser Acceptance

Hosted Checkout browser inspection is not the Phase 13 CI gate. Optional Browser Use sanity evidence may be captured
before go-live, but API/config verification and unit invariants are the required Phase 13 acceptance path.

If optional Browser Use evidence is captured later, it should confirm that hosted Checkout does not visibly violate the
payment-method policy in the account/browser context being tested.

## Production Gate

Production validation waits for live Stripe access, final domain readiness, production webhook wiring, production
Worker/D1 configuration, and final go-live approval.

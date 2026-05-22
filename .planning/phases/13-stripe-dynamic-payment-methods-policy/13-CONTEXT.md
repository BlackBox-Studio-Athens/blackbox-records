# Phase 13: Stripe Dynamic Payment Methods Policy - Context

**Gathered:** 2026-05-20  
**Updated:** 2026-05-21  
**Status:** Ready for replanning  
**Source:** GSD discussion from checkout payment-method policy conversation and follow-up Phase 13 discussion

<domain>

## Phase Boundary

Phase 13 enables Stripe dynamic payment methods for BlackBox checkout through a named Payment Method Configuration while
guaranteeing buyers never see PayPal, Klarna, BNPL, bank-debit, bank-transfer, or mandate-style methods.

This phase owns the Stripe test-mode configuration automation, the Worker-side checkout configuration invariant, CI/API
verification, and phase evidence. It does not approve production cutover, live-mode mutation, BOX NOW automation, or
post-MVP non-Greece shipping.

</domain>

<decisions>

## Implementation Decisions

### Product Policy

- **D-01:** Production Checkout should use Stripe dynamic payment methods through a named Payment Method Configuration.
- **D-02:** Allowed buyer-visible methods are card rails, Apple Pay, Google Pay, and Link.
- **D-03:** PayPal must never be displayed.
- **D-04:** Klarna and all BNPL-style methods must never be displayed.
- **D-05:** Bank-debit, bank-transfer, and mandate-style methods must never be displayed.
- **D-06:** The implementation must verify the actual Stripe configuration response; banned method categories are policy
  groups, not a complete static enum.

### Stripe Automation Boundary

- **D-07:** Add a repo script as the canonical Stripe configuration automation surface. Do not leave Phase 13 as
  documentation-only commands.
- **D-08:** The script must be dry-run by default. It may list and verify existing Stripe test-mode Payment Method
  Configurations without mutating account state.
- **D-09:** The script may create or update the named `BlackBox merch checkout` Payment Method Configuration only when
  invoked with an explicit `--apply` flag.
- **D-10:** Configurable allowed methods should be enabled when present: `card`, `apple_pay`, `google_pay`, and `link`.
- **D-11:** Configurable banned methods should be disabled when present, including `paypal`, `klarna`, known BNPL
  methods, and bank-debit or mandate-style methods returned by Stripe.
- **D-12:** Banned methods pass verification only when Stripe reports them as unavailable, absent from the returned
  configuration, or effectively off. A returned banned method that is effectively on fails the script.
- **D-13:** Dashboard-only or account-eligibility gaps are allowed only when Stripe does not expose the control through
  API/CLI. The script must report those gaps instead of silently passing them.

### Evidence Format

- **D-14:** The script's required output is a redacted, planning-safe human summary that can be copied into
  `13-VALIDATION.md`.
- **D-15:** Payment Method Configuration IDs in evidence may show the Stripe object prefix and last four characters, but
  must not persist the full account-specific ID in committed docs.
- **D-16:** Evidence should record the exact payment method keys returned by Stripe and each returned key's allowed,
  banned, unavailable, or off status. Do not invent an exhaustive key list that Stripe did not return.
- **D-17:** Phase 13 implementation evidence belongs in
  `.planning/phases/13-stripe-dynamic-payment-methods-policy/13-VALIDATION.md`.

### Backend Configuration Invariant

- **D-18:** `STRIPE_PAYMENT_METHOD_CONFIGURATION_ID` is required for the application to run in the Phase 13 checkout
  mode. Missing configuration is an invalid application state, not a recoverable buyer-flow fallback.
- **D-19:** The missing-configuration failure should happen at `createStripeCheckoutGateway()` / gateway construction.
- **D-20:** Local stripe-mock, local stripe-test, sandbox, and production modes all require
  `STRIPE_PAYMENT_METHOD_CONFIGURATION_ID`; do not create a local-only exemption.
- **D-21:** Gateway/factory tests must prove the invariant: missing `STRIPE_PAYMENT_METHOD_CONFIGURATION_ID` throws before
  Checkout Session creation, and configured checkout payloads include `payment_method_configuration`.
- **D-22:** Checkout Session creation must remove hardcoded `payment_method_types: ['card']`.
- **D-23:** Browser code must never receive Payment Method Configuration IDs, provider names, Stripe IDs, D1 bindings, or
  internal feature-gate details.

### CI And Validation

- **D-24:** CI should verify Stripe configuration through the Stripe API/configuration response, not through hosted
  Checkout browser inspection.
- **D-25:** Normal CI must prove code invariants: Checkout Session creation sends `payment_method_configuration`, never
  sends `payment_method_types`, and missing `STRIPE_PAYMENT_METHOD_CONFIGURATION_ID` fails.
- **D-26:** A Stripe-backed CI job should verify the test-mode Payment Method Configuration by API and fail if any returned
  banned method is enabled or effectively on.
- **D-27:** Browser Use hosted Checkout validation is optional go-live sanity evidence, not the Phase 13 CI gate.
- **D-28:** Live-mode API verification repeats later as a go-live gate after live Stripe access, live Products/Prices,
  final domain, production webhook wiring, production Worker/D1 configuration, and final approval exist.
- **D-29:** Existing deterministic card-based sandbox smoke coverage for success, 3D Secure, decline, expired card, and
  related card paths must remain intact.

### the agent's Discretion

- Keep the script name, helper function names, and package script names concise and aligned with current repo script
  naming, as long as the dry-run, `--apply`, redaction, and CI verification decisions above are preserved.

</decisions>

<canonical_refs>

## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Planning Source Of Truth

- `.planning/ROADMAP.md` - Phase 13 scope, requirements, and plan count.
- `.planning/BACKLOG.md` - BL-22 dynamic payment methods policy and launch linkage.
- `.planning/LAUNCH-READINESS.md` - production evidence checklist and go-live gate.
- `.planning/UBIQUITOUS_LANGUAGE.md` - canonical terms for Dynamic Payment Methods, Payment Method Configuration, and
  Banned Payment Method.
- `.planning/phases/10-sandbox-verification-and-release-gate/10-DYNAMIC-PAYMENT-METHODS-WORKSTREAM.md` - initial
  workstream that Phase 13 promotes.
- `.planning/phases/13-stripe-dynamic-payment-methods-policy/13-RESEARCH.md` - Stripe and repo research for the phase.
- `.planning/phases/13-stripe-dynamic-payment-methods-policy/13-VALIDATION.md` - phase validation/evidence surface.

### Existing Code Seams

- `apps/backend/src/infrastructure/stripe/stripe-checkout-gateway.ts` - Checkout Session creation and gateway factory.
- `apps/backend/src/env.ts` - Worker runtime binding type surface.
- `apps/backend/wrangler.jsonc` - local/mock/sandbox Worker runtime variable binding surface.
- `apps/backend/test/infrastructure/stripe/stripe-checkout-gateway.test.ts` - existing gateway payload tests.
- `apps/backend/test/http/public-commerce-routes.test.ts` - public checkout route coverage that supplies bindings.
- `.github/workflows/cloudflare-sandbox.yml` - sandbox Worker CI/deploy workflow.
- `.github/workflows/cloudflare-pages.yml` - static frontend CI/deploy workflow and existing validation order.

### Stripe References

- `https://docs.stripe.com/payments/multiple-payment-method-configs?dashboard-or-api=api` - Payment Method
  Configurations through API/Dashboard.
- `https://docs.stripe.com/api/payment_method_configurations` - Payment Method Configurations API shape.
- `https://docs.stripe.com/payments/checkout/payment-methods` - Checkout payment method behavior.
- `https://docs.stripe.com/payments/payment-methods/dynamic-payment-methods` - dynamic payment method behavior.
- `https://docs.stripe.com/stripe-cli/keys` - Stripe CLI/API key permission and restricted-key context.

</canonical_refs>

<code_context>

## Existing Code Insights

### Reusable Assets

- `StripeCheckoutGateway` in `apps/backend/src/infrastructure/stripe/stripe-checkout-gateway.ts`: existing Stripe SDK
  wrapper and Checkout Session creation point.
- `createStripeCheckoutGateway()` in `apps/backend/src/infrastructure/stripe/stripe-checkout-gateway.ts`: existing
  configuration seam that already throws on missing `STRIPE_SECRET_KEY`.
- `AppBindings` in `apps/backend/src/env.ts`: typed Worker binding surface for adding
  `STRIPE_PAYMENT_METHOD_CONFIGURATION_ID`.
- Root `scripts/*.ts` pattern: repo-level scripts already use `tsx` and are covered by backend script tests.
- `apps/backend/test/scripts/*`: existing home for script behavior tests that keep secret redaction and preflight logic
  deterministic.

### Established Patterns

- Runtime business secrets and Stripe identifiers stay Worker-side; public Astro env vars are browser-safe only.
- Local and sandbox checkout flows are validated through typed scripts plus Vitest tests before deploy workflows run.
- Stripe account-specific values are either runtime secrets, local ignored files, or redacted evidence; committed planning
  docs must not carry full IDs or secret values.
- Phase 12 boundary work closed module internals; new code should extend documented root or module-owned entrypoints
  instead of adding compatibility facades.

### Integration Points

- Checkout Session creation currently sends `payment_method_types: ['card']`; Phase 13 removes this and sends
  `payment_method_configuration`.
- `apps/backend/wrangler.jsonc` local/mock env vars must gain non-secret placeholder/test configuration IDs where needed
  so every mode has the required binding.
- CI should add a Stripe API verification command only where a test-mode Stripe key/config ID is intentionally available;
  normal CI still relies on unit tests for code invariants.

</code_context>

<specifics>

## Specific Ideas

- Preferred Payment Method Configuration name: `BlackBox merch checkout`.
- Required script behavior: dry-run by default, `--apply` for create/update, planning-safe redacted summary output.
- Config ID evidence format: object prefix plus last four characters only.
- Required evidence target: `13-VALIDATION.md`.
- Required failure mode: missing `STRIPE_PAYMENT_METHOD_CONFIGURATION_ID` fails at gateway construction in all modes.
- CI validation target: API/config verification and unit invariants, not hosted Checkout browser inspection.

</specifics>

<deferred>

## Deferred Ideas

- Consider an in-house CLI for commerce operations scripts only after multiple scripts duplicate command parsing, env
  loading, redaction, and evidence-output behavior.
- Production live-mode checkout evidence waits for Go-Live / Launch Hardening.
- Production cutover and final domain switch remain outside Phase 13.
- BOX NOW automation remains reopen-only.
- Any future decision to allow PayPal, Klarna, BNPL, or bank-debit methods requires a new explicit product decision.

</deferred>

---

_Phase: 13-stripe-dynamic-payment-methods-policy_  
_Context gathered: 2026-05-20; revised: 2026-05-21_

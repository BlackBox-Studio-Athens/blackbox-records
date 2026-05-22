# Dynamic Payment Methods Workstream

> Promoted on 2026-05-20 to Phase 13:
> `.planning/phases/13-stripe-dynamic-payment-methods-policy/`.

## Summary

This is a GSD handoff plan for enabling Stripe dynamic payment methods in BlackBox checkout. It records the product
policy, Stripe automation boundary, and later backend changes, but it does not implement code, run Stripe CLI mutations,
or change Cloudflare configuration in this slice.

Production Checkout should use a named Stripe Payment Method Configuration, with Stripe ranking eligible methods for the
buyer while BlackBox controls which method families are allowed.

## Buyer-Facing Payment Policy

Allowed payment methods:

- card rails
- Apple Pay
- Google Pay
- Link

Banned payment methods:

- PayPal, even if the Stripe account supports it
- Klarna and every BNPL-style method, including examples such as Affirm and Afterpay/Clearpay
- bank-debit, bank-transfer, or mandate-style methods, including examples such as SEPA Debit, Bacs Direct Debit, ACSS
  Debit, BECS Direct Debit, US bank account, NZ bank account, PayTo, and similar methods returned by Stripe

The implementation must verify the actual Stripe configuration response. The banned list above is a policy category, not
an exhaustive static enum.

## Stripe CLI/API Automation Plan

Automate what Stripe exposes through CLI/API:

1. List existing Payment Method Configurations in sandbox/test mode.
2. Create or update a named configuration, recommended name: `BlackBox merch checkout`.
3. Turn on configurable allowed methods when present: `card`, `apple_pay`, `google_pay`, and `link`.
4. Turn off banned methods when present: `paypal`, `klarna`, known BNPL methods, and any bank-debit/mandate-style
   methods returned by Stripe.
5. Verify that every banned method is either unavailable or has effective display preference `off`.
6. Record the sandbox configuration ID as evidence without committing account-specific IDs unless explicitly approved.

Manual or Dashboard-only follow-up is allowed only when Stripe account eligibility, activation, review, wallet/domain
setup, or Dashboard controls cannot be completed through CLI/API.

## Future Backend Implementation

- Remove hardcoded `payment_method_types: ['card']` from Checkout Session creation.
- Add optional Worker runtime binding `STRIPE_PAYMENT_METHOD_CONFIGURATION_ID`.
- Pass `payment_method_configuration` to Stripe Checkout Session creation only when the binding is configured.
- Keep Payment Method Configuration IDs out of browser code and static Astro public env.
- Keep local stripe-mock and sandbox smoke deterministic by continuing to test card success, 3D Secure, card-declined,
  expired-card, and related card scenarios.
- Repeat configuration and verification for live mode only after live Stripe access, final domain, production webhook,
  production Worker/D1 configuration, and final go-live approval are available.

## Validation

GSD-only validation for this planning slice:

- Planning docs state the allowed and banned payment method policy.
- Planning docs no longer treat dynamic payment methods as unresolved product research.
- No code, Stripe CLI mutation, Cloudflare env change, or committed account-specific Stripe ID is introduced.
- `pnpm check` passes after Markdown updates.

Future implementation validation:

- Unit tests prove Checkout Session creation omits `payment_method_types`.
- Unit tests prove `payment_method_configuration` is passed only when configured.
- Stripe CLI/API verification fails if PayPal, Klarna, BNPL, or bank-debit style methods are effectively enabled in the
  selected configuration.
- Hosted Checkout browser validation confirms only eligible allowed methods appear for the buyer/account context.
- Required gates pass: `pnpm test:unit`, `pnpm check`, and `pnpm build`.

## References

- Stripe dynamic payment methods: <https://docs.stripe.com/payments/payment-methods/dynamic-payment-methods>
- Stripe payment method configurations: <https://docs.stripe.com/payments/multiple-payment-method-configs?dashboard-or-api=api>
- Stripe Payment Method Configurations API: <https://docs.stripe.com/api/payment_method_configurations>

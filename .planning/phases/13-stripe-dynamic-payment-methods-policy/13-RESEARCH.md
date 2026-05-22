# Phase 13 Research: Stripe Dynamic Payment Methods Policy

## Summary

Stripe supports dynamic payment methods for Checkout when the integration does not explicitly hardcode
`payment_method_types`. Stripe can rank eligible methods for conversion based on buyer and transaction context, while
Payment Method Configurations provide named scenarios that control which methods are available.

For BlackBox, the useful path is not "show every Stripe method." The useful path is "let Stripe rank a narrow allowed
set while the account configuration blocks unwanted payment families."

## Stripe Findings

- Dynamic payment methods allow Stripe Checkout to show eligible methods from the account/configuration instead of a
  code-owned `payment_method_types` list.
- Payment Method Configurations can be created through Dashboard or API and selected at checkout time.
- Each configurable method exposes availability and display preference. If `available` is false, buyers do not see the
  method because the method is not active or display preference is off.
- Stripe documentation says only methods relevant to the account country are shown/configurable in the configuration
  response, so implementation must verify the actual response instead of assuming every method key exists.
- Dashboard/manual steps can still be required for method eligibility, activation, review, wallet/domain setup, or
  controls not exposed by CLI/API.

## Repo Findings

- Checkout Session creation currently hardcodes `payment_method_types: ['card']` in
  `apps/backend/src/infrastructure/stripe/stripe-checkout-gateway.ts`.
- The gateway already reads Worker bindings through `AppBindings`, which is the right surface for an optional
  `STRIPE_PAYMENT_METHOD_CONFIGURATION_ID`.
- Current test expectations assert the hardcoded card-only payload, so future implementation must update gateway tests.
- Existing sandbox smoke must stay card-deterministic even if production uses dynamic payment methods.

## Recommended Implementation Shape

1. Add a Stripe CLI/API configuration script or documented command sequence that can list/create/update/verify the
   `BlackBox merch checkout` Payment Method Configuration.
2. Add a strict banned-method classifier that fails if PayPal, Klarna/BNPL, or bank-debit style methods are effectively
   enabled in the selected configuration.
3. Add optional Worker runtime binding `STRIPE_PAYMENT_METHOD_CONFIGURATION_ID`.
4. Remove `payment_method_types: ['card']` from Checkout Session creation.
5. Pass `payment_method_configuration` only when configured.
6. Preserve card-based smoke scenarios and document that dynamic methods are production configuration, not a replacement
   for deterministic card test cases.

## References

- Stripe dynamic payment methods: <https://docs.stripe.com/payments/payment-methods/dynamic-payment-methods>
- Stripe payment method configurations: <https://docs.stripe.com/payments/multiple-payment-method-configs?dashboard-or-api=api>
- Stripe Payment Method Configurations API: <https://docs.stripe.com/api/payment_method_configurations>

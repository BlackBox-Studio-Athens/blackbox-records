## ADDED Requirements

### Requirement: Stripe sandbox smoke verifies hosted Checkout surface

The system SHALL include a pre-payment Stripe sandbox smoke scenario that verifies the hosted Checkout amount and payment-method surface.

#### Scenario: UAT sandbox dynamic payment surface is verified

- **GIVEN** the deployed UAT sandbox storefront and Worker use the intended Stripe Payment Method Configuration
- **AND** the expected payment labels are configured for the documented browser, checkout country, amount, and currency context
- **WHEN** `pnpm smoke:stripe-sandbox -- --scenario checkout_surface` runs against that deployment
- **THEN** it reaches Stripe-hosted Checkout without submitting payment
- **AND** it asserts the expected Store Offer amount, currency, and configured dynamic payment method labels.

#### Scenario: Payment Method Configuration verifier runs before browser smoke

- **GIVEN** a sandbox `STRIPE_PAYMENT_METHOD_CONFIGURATION_ID` is configured for the Worker
- **WHEN** `pnpm stripe:payment-methods:verify` runs for the UAT sandbox environment
- **THEN** it reports whether the configuration exists, is active, and includes the expected candidate payment methods before hosted Checkout smoke evidence is accepted.

#### Scenario: Hosted Checkout surface drifts from storefront authority

- **GIVEN** the deployed sandbox storefront can redirect to Stripe-hosted Checkout
- **WHEN** `pnpm smoke:stripe-sandbox -- --scenario checkout_surface` runs
- **THEN** it records the hosted amount texts and visible payment method labels
- **AND** it fails before payment submission if the hosted amount or dynamic payment surface does not match expectations.

#### Scenario: Paid smoke scenarios run

- **GIVEN** paid smoke scenarios are selected
- **WHEN** the smoke runner starts
- **THEN** webhook listener and paid order reconciliation requirements remain separate from the pre-payment surface scenario.

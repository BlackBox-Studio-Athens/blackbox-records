## ADDED Requirements

### Requirement: Hosted Checkout amount matches Store Offer

The system MUST ensure the Stripe-hosted Checkout amount matches the Worker-authoritative Store Offer amount for each checkout line.

#### Scenario: Shopper reaches hosted Checkout

- **GIVEN** the Worker creates a Stripe Checkout Session for a Store Item variant
- **WHEN** hosted Checkout renders the payment page
- **THEN** the displayed amount matches the Worker Store Offer amount and currency for that variant.

#### Scenario: Store Offer and Stripe Price drift

- **GIVEN** the Store Offer amount or currency differs from the mapped Stripe Price
- **WHEN** checkout start is requested
- **THEN** the Worker revalidates the active Stripe Price before creating the Checkout Session
- **AND** rejects checkout with a catalog-drift error if the Stripe Price cannot be resolved unambiguously.

#### Scenario: Sandbox smoke detects hosted amount drift

- **GIVEN** the Worker creates a Stripe Checkout Session for a Store Item variant
- **WHEN** sandbox smoke reaches hosted Checkout before payment submission
- **THEN** the smoke fails if the hosted amount or currency differs from the Worker Store Offer evidence.

### Requirement: Hosted Checkout uses approved payment method configuration

The system MUST use the approved Stripe Payment Method Configuration for Stripe-backed Checkout Sessions and verify the visible hosted payment surface.

#### Scenario: Dynamic payment methods are expected

- **GIVEN** the UAT sandbox account, browser context, amount, currency, and shipping country are documented with expected dynamic payment labels
- **WHEN** hosted Checkout renders before payment submission
- **THEN** the smoke evidence includes the visible payment method labels
- **AND** a card-only surface fails validation when non-card labels are expected for that documented context.

#### Scenario: Payment method configuration cannot be verified

- **GIVEN** `STRIPE_PAYMENT_METHOD_CONFIGURATION_ID` is missing locally or on the deployed Worker
- **WHEN** payment method verification runs
- **THEN** the verification reports the gap without creating checkout acceptance evidence.

### Requirement: Paid checkout return avoids duplicate visual status surfaces

The system MUST keep the checkout return page from showing a full non-final recovery/status screen before the paid confirmation screen renders.

#### Scenario: Checkout return state is still resolving

- **GIVEN** a shopper has returned from Stripe Checkout
- **WHEN** the browser has not yet loaded the Worker-owned checkout state
- **THEN** the page exposes an accessible pending marker only
- **AND** it does not show retry, cart, item, or continue-shopping recovery actions.

#### Scenario: Paid checkout state is confirmed

- **GIVEN** the Worker returns a paid checkout state
- **WHEN** the checkout return page renders the result
- **THEN** the page shows one final success surface with next steps
- **AND** it does not show the non-final recovery/status card behind or before that success surface.

## ADDED Requirements

### Requirement: Store purchase readiness is visibly pending

The storefront SHALL show explicit loading feedback while Store Item purchase actions wait for Worker-confirmed Store Offer readiness.

#### Scenario: Store item purchase action is checking availability

- **GIVEN** a Store Item page has browser-safe static item data and must read the Worker Store Offer before enabling the purchase action
- **WHEN** the Store Offer read is in progress
- **THEN** the purchase action renders as a disabled busy action with visible spinner or equivalent loading affordance
- **AND** the label describes availability confirmation rather than checkout implementation internals
- **AND** the pending, ready, unavailable, and error states preserve stable button geometry.

#### Scenario: Store item purchase action becomes ready

- **GIVEN** the Worker Store Offer confirms the item can be added to StoreCart
- **WHEN** the purchase action changes to `Add To Cart`
- **THEN** the transition is visually calm and does not expose Stripe Price IDs, D1 IDs, stock authority, provider secrets, or authoritative payment state.

### Requirement: Checkout start handoff is visibly pending

The checkout page SHALL make hosted checkout creation and redirect handoff visibly pending in the CTA area after the shopper activates the checkout CTA.

#### Scenario: Shopper starts hosted checkout

- **GIVEN** checkout is ready and the shopper activates the Stripe checkout CTA
- **WHEN** the Worker checkout start request is in flight
- **THEN** the CTA is disabled, shows an inline pending affordance, and labels the operation as opening Stripe Checkout
- **AND** any under-button status copy reinforces the same pending handoff instead of becoming the only visible loading signal
- **AND** duplicate submission is blocked until redirect or error
- **AND** any failure leaves a visible actionable error without clearing the shopper's cart context.

#### Scenario: Checkout readiness detail is displayed

- **GIVEN** checkout readiness has been confirmed
- **WHEN** the checkout page displays detail text such as `You will finish payment on Stripe.`
- **THEN** adjacent CTA and under-button status states remain consistent with that readiness message
- **AND** later pending copy clearly distinguishes opening Stripe Checkout from already-confirmed readiness.

### Requirement: Checkout return pending state is visible

The checkout return page SHALL show a visible pending state while it confirms checkout session state with the Worker.

#### Scenario: Checkout return status is loading

- **GIVEN** the shopper returns from hosted Checkout with a session identifier
- **WHEN** the browser is waiting for the Worker checkout-state read
- **THEN** the page renders a visible payment-status confirmation state
- **AND** the pending region exposes `aria-busy` or `role="status"` with polite live announcement
- **AND** the page does not look empty while payment state is unknown.

### Requirement: Checkout loading feedback remains browser-safe

The storefront and checkout UI MUST keep loading feedback browser-safe and non-authoritative.

#### Scenario: Checkout loading copy is displayed

- **WHEN** checkout-related loading feedback is rendered to the browser
- **THEN** it describes availability, payment handoff, or payment status at user level
- **AND** it omits provider IDs, feature flag keys, D1 bindings, Worker secret names, raw provider errors, and internal evaluation details.

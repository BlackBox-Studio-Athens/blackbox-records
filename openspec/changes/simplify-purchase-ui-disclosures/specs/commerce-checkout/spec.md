## ADDED Requirements

### Requirement: Cart and payment handoff retain the label identity

The public header cart SHALL be borderless at rest while retaining its existing geometry, count, supplementary label and keyboard focus. Checkout SHALL retain the native Continue to Payment action and place the official monochrome Stripe badge beneath it without changing payment authority or surrounding page layout.

#### Scenario: Shopper opens the cart

- **WHEN** the header cart appears on a normal page or checkout
- **THEN** the bag has a transparent background and no permanent border
- **AND** its target remains at least 44 by 44 CSS pixels, with the correct count, accessible name, tooltip and visible keyboard focus.

#### Scenario: Shopper continues to hosted payment

- **WHEN** checkout is ready for payment
- **THEN** Continue to Payment retains the existing BlackBox button style
- **AND** the unmodified official white Stripe badge is centered underneath the action instead of a repeated payment explanation
- **AND** loading, quote failures, retry behavior and checkout idempotency remain unchanged.

#### Scenario: Shopper reviews the local change

- **WHEN** this presentation is implemented
- **THEN** existing artwork, typography, page columns, responsive ordering outside the changed purchase blocks and persistent player behavior remain intact
- **AND** a local commit does not authorize deployment or content publication.

## MODIFIED Requirements

### Requirement: Store purchase readiness is visibly pending

The storefront SHALL show explicit loading feedback while Store Item purchase actions wait for Worker-confirmed Store Offer readiness. Pending, ready and unavailable states SHALL share one geometry of 44px height and 14rem width beside artwork, full width on narrow screens; the unavailable state SHALL be a status element, not a disabled button.

#### Scenario: Store item purchase action is checking availability

- **GIVEN** a Store Item page has browser-safe static item data and must read the Worker Store Offer before enabling the purchase action
- **WHEN** the Store Offer read is in progress
- **THEN** the purchase action renders as a disabled busy action with a visible loading affordance
- **AND** the label describes availability confirmation rather than checkout implementation internals
- **AND** the pending, ready, unavailable, and error states preserve stable geometry.

#### Scenario: Store item purchase action becomes ready

- **GIVEN** the Worker Store Offer confirms the item can be added to StoreCart
- **WHEN** the purchase action changes to `Add To Cart`
- **THEN** the transition is visually calm and does not expose Stripe Price IDs, D1 IDs, stock authority, provider secrets, or authoritative payment state.

#### Scenario: Store item is not buyable

- **GIVEN** the Store Offer resolves to Sold Out, Out of Stock or another non-buyable label
- **WHEN** the purchase slot renders
- **THEN** it shows the label as status text with the Violet #7d58a0 edge and rgba(125,88,160,.16) surface for Sold Out and a dashed neutral box otherwise
- **AND** the element is not focusable, is exposed as status and keeps the purchase geometry.

### Requirement: Purchase status is clear without duplicate messaging

The storefront SHALL display the resolved non-buyable label in the approved compact, left-aligned, hard-edged noninteractive status element while retaining artwork, information, listening, and existing navigation. Enabled and pending actions and resolved noninteractive purchase states SHALL share the same responsive action geometry. Presentation tone SHALL follow the offer's typed state, not its label text, without changing eligibility. A shown expected month SHALL appear directly below the control as "Expected Month YYYY".

#### Scenario: Non-buyable offer resolves

- **WHEN** detail or compatibility-route purchase actions receive a non-ready offer
- **THEN** they display its label without using the text to decide eligibility or tone
- **AND** an adjacent successfully resolved price region does not repeat a status headline or invent a price, while standalone price/summary regions retain useful feedback
- **AND** detail and compatibility-route instructions to add the item are absent.

#### Scenario: Pending or failed request

- **WHEN** the purchase offer is loading or its read fails
- **THEN** the action stays disabled with pending feedback or neutral unavailable copy
- **AND** an older snapshot does not restore an enabled action.

#### Scenario: Stock is restored

- **WHEN** a subsequent fresh offer is ready
- **THEN** Add To Cart, its supporting hint, and current price return, and any expected month and Notify me form disappear
- **AND** checkout start still validates current authority.

#### Scenario: Accessible status

- **WHEN** status renders on a narrow screen or with increased text size
- **THEN** its text has at least 4.5:1 contrast, the control has a minimum 44px height, and there is no clipping or horizontal overflow
- **AND** the status is at most 14rem wide and 44px high, with a transparent near-black face
- **AND** pending busy feedback clears and the resolved purchase label is announced politely.

#### Scenario: Purchase states share geometry

- **WHEN** the action changes between Checking availability, Add To Cart, Coming Soon, Repressing, Sold Out or Checkout Paused
- **THEN** the control remains 224px wide and 44px high on desktop and fills the available action width on mobile
- **AND** the enabled Add To Cart state uses the Violet filled treatment while resolved statuses remain outlined, nonfocusable information rather than disabled buttons.

#### Scenario: Inventory states have a subtle visual distinction

- **WHEN** effective online stock is exhausted
- **THEN** Sold Out uses a solid Violet #7d58a0 edge and rgba(125,88,160,.16) surface
- **AND** Coming Soon and Repressing use a dashed neutral outline, the convention for "not here yet", with a small leading icon (a disc for Coming Soon, a circular arrow for Repressing) and a short line below: "First pressing on its way" or "More copies being pressed", followed by any shown expected month
- **AND** Checkout Paused uses the neutral gray outline, and an unavailable offer renders no status control
- **AND** styling does not determine purchase eligibility.

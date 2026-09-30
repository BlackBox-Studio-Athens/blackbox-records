# Spec Delta

## MODIFIED Requirements

### Requirement: StoreCart convenience state

The system SHALL treat `StoreCart` as browser convenience state only. Cart feedback SHALL happen in place: adding an item confirms on the purchase control, removing a line leaves an Undo window, and the drawer's Checkout action shows the quoted total once the delivery quote is known.

#### Scenario: Cart persists locally

- **GIVEN** the browser stores a cart draft
- **WHEN** the shopper returns to the store
- **THEN** local storage may restore display/routing data
- **AND** the Worker still validates all price, stock, payment, order, and eligibility authority before checkout.

#### Scenario: Item is added

- **WHEN** an Add to cart action succeeds
- **THEN** the cart drawer opens as before
- **AND** the same control reads Added for four seconds, keeps its width, announces the addition politely to assistive technology and then returns to Add to cart.

#### Scenario: Item is added before the cart is ready

- **WHEN** the shopper activates Add to cart before the shell's cart has finished loading
- **THEN** the request is kept and applied as soon as the cart is ready, opening the drawer
- **AND** the control reads Added only once the cart confirms the item arrived.

#### Scenario: Line is removed

- **WHEN** the shopper removes a cart line, or lowers its quantity below one
- **THEN** the line leaves the cart at once and the removal is announced politely
- **AND** an Undo action naming the removed item stays in its place for six seconds, paused while it has focus, and receives focus
- **AND** Undo restores the line at its position with its previous quantity.

#### Scenario: Checkout shows the quoted total

- **WHEN** the cart drawer has at least one line and its delivery quote is known
- **THEN** its Checkout action displays the quoted total (VAT and shipping included) beside the label, hidden from assistive technology so the action's name stays Checkout
- **AND** while the quote is loading or unavailable the action shows its label alone
- **AND** the Worker remains the authority for every amount at checkout.

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
- **THEN** it shows the label as status text with the Store Blood outline for Sold Out and a neutral outline otherwise
- **AND** the element is not focusable, is exposed as status and keeps the purchase geometry.

### Requirement: Checkout start handoff is visibly pending

The checkout page SHALL make hosted checkout creation and redirect handoff visibly pending in the CTA area after the shopper activates the checkout CTA. Before the shipping quote is available the CTA SHALL be a charcoal, outlined control that states what it is waiting for; when the quote arrives the same control SHALL fill to the primary style and show the amount to pay.

#### Scenario: Shipping quote is pending

- **GIVEN** checkout is otherwise ready
- **WHEN** the delivery quote is loading or absent
- **THEN** the CTA is disabled, marked busy, outlined in charcoal and reads Waiting for shipping quote
- **AND** no filled primary control is shown in the CTA area.

#### Scenario: Shipping quote arrives

- **WHEN** the delivery quote becomes available
- **THEN** the same control fills to the primary style, becomes enabled and shows the Stripe checkout label with the amount
- **AND** the change happens without moving the control.

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

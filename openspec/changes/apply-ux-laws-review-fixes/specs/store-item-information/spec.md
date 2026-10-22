# Spec Delta

## ADDED Requirements

### Requirement: Phone item pages keep the purchase action reachable

Below 40rem, a Store item page with a visible inline purchase action SHALL show a buy bar fixed to the bottom edge while that action is still below the viewport. The bar SHALL show the price, the item's existing status line and a control that performs the same action with the same label and feedback. It SHALL leave once the shopper reaches the inline action and SHALL NOT return after it is passed.

#### Scenario: Shopper opens a pre-order item on a phone

- **GIVEN** a 390 × 844 viewport on a pre-order item whose inline PRE-ORDER is below the first screen
- **WHEN** the page first renders
- **THEN** the buy bar is already present with the price, the Sea Green pre-order line and a PRE-ORDER control
- **AND** no entrance motion plays on first render.

#### Scenario: Shopper scrolls to the inline action

- **WHEN** the inline purchase action enters the viewport
- **THEN** the buy bar leaves
- **AND** it stays away while the shopper reads the content below that action
- **AND** it rises again only when the shopper scrolls back above the inline action.

#### Scenario: Shopper uses the bar's action

- **WHEN** the shopper activates the bar's control
- **THEN** the same add-to-cart request runs as for the inline action, showing Adding then Added in place and opening the cart
- **AND** the control has the inline action's accessible name, a 44px target and the shared focus ring.

#### Scenario: Item has no purchase action

- **WHEN** the item shows only a status such as Coming Soon or Sold Out, or the viewport is 40rem or wider
- **THEN** no buy bar is rendered.

### Requirement: Buy bar motion is compositor-only and respects reduced motion

The buy bar SHALL rise from the bottom edge in about 300 ms with an ease-out curve and leave in about 195 ms with an ease-in curve, animating only transform and opacity. Its state SHALL follow scroll position without scroll listeners, and a fast fling SHALL NOT leave it in a stale state. Under reduced motion it SHALL appear and leave without animation.

#### Scenario: Shopper flings past the inline action

- **WHEN** a single fast scroll moves the inline action from below the viewport to above it without an intermediate frame showing it
- **THEN** the bar ends hidden, as if the shopper had scrolled through the action.

#### Scenario: Reduced motion is requested

- **WHEN** `prefers-reduced-motion: reduce` applies
- **THEN** the bar changes state instantly with no transition.

#### Scenario: Bar animation runs

- **WHEN** the bar enters or leaves
- **THEN** no layout is performed during the transition frames.

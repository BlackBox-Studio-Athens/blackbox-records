# Spec Delta

## ADDED Requirements

### Requirement: Header cart control has a supplementary visible label

The public header SHALL show a compact English Cart label beneath its cart icon on pointer hover and keyboard focus without moving the header or changing the button's accessible item count, badge or cart-opening behavior.

#### Scenario: Shopper hovers the cart

- **WHEN** a hover-capable pointer rests on the header cart button
- **THEN** the square, dark label appears after 200 milliseconds with a 120-millisecond opacity fade
- **AND** it remains visible while the pointer is over the button, the label or the space between them
- **AND** it disappears when neither hover nor keyboard focus remains.

#### Scenario: Shopper uses the keyboard

- **WHEN** the cart button receives visible keyboard focus
- **THEN** the label appears immediately and the existing focus indicator remains visible
- **AND** Escape dismisses the label without moving focus or opening the cart
- **AND** dismissal persists until a new hover or focus interaction.

#### Scenario: Shopper activates the cart

- **WHEN** the shopper clicks, presses Enter or Space, or taps the cart button
- **THEN** the label is dismissed and the existing cart drawer opens
- **AND** touch activation needs only one tap.

#### Scenario: Shopper requests reduced motion

- **WHEN** the browser requests reduced motion
- **THEN** the label still identifies the cart but has no opacity fade.

#### Scenario: Cart count or shell route changes

- **WHEN** the cart is empty, contains one item or contains multiple items, or the shopper changes shell sections
- **THEN** the supplementary label remains Cart and is hidden from assistive technology
- **AND** the button retains its correct accessible name and count badge
- **AND** shell-owned cart state and player continuity are preserved.

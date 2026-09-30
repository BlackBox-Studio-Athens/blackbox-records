# Spec Delta

## MODIFIED Requirements

### Requirement: Header cart control has a supplementary visible label

The public header SHALL render its cart control only while the cart contains at least one item or the current route is a store route (the Store collections, Store Item pages and checkout pages). While rendered, it SHALL show a compact English Cart label beneath its cart icon on pointer hover and keyboard focus without moving the header or changing the button's accessible item count, badge or cart-opening behavior. The header SHALL reserve the control's space so its appearance or disappearance does not shift other header controls.

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

- **WHEN** the cart contains one item or multiple items, or the shopper changes shell sections with items in the cart
- **THEN** the control stays rendered, the supplementary label remains Cart and is hidden from assistive technology
- **AND** the button retains its correct accessible name and count badge
- **AND** shell-owned cart state and player continuity are preserved.

#### Scenario: Cart is empty away from the store

- **WHEN** the cart is empty and the current route is not a store route
- **THEN** the header renders no cart control and no cart fallback
- **AND** the header layout does not shift.

#### Scenario: Cart is empty on a store route

- **WHEN** the cart is empty and the route is a Store collection, Store Item or checkout page
- **THEN** the cart control is rendered with the accessible name Cart and no count badge.

#### Scenario: Cart drawer closes

- **WHEN** the shopper closes the cart drawer
- **THEN** focus returns to the header cart control when it is rendered
- **AND** otherwise focus moves to the main content landmark.

### Requirement: Matching listening actions identify the existing session

The shell SHALL mark shared controls for the active editorial source as disabled amber In player status across Store, Releases and details. Other sources SHALL retain Listen. The floating player's Open and Stop actions SHALL remain available on desktop and mobile. Stop SHALL arm on a first activation, reading Stop? for three seconds, and end the session only on a second activation within that window. Status MUST NOT claim verified playback.

#### Scenario: A session is minimized and its source appears elsewhere

- **WHEN** shell navigation, cached restoration or detail rendering shows the active source
- **THEN** its listening control displays In player and cannot open a second session
- **AND** the floating player remains the place to reopen or stop the existing session.

#### Scenario: A session is stopped or replaced

- **WHEN** Stop ends the session or another source replaces it
- **THEN** all previously matching controls return to their original enabled label
- **AND** a cached page is synchronized with the current source when restored.

#### Scenario: Stop is pressed once

- **WHEN** the shopper activates Stop in the floating player
- **THEN** the control reads Stop? and keeps its accessible name and position
- **AND** the session continues
- **AND** the control returns to Stop after three seconds without a second activation.

#### Scenario: Stop is pressed twice

- **WHEN** the shopper activates Stop? within the window
- **THEN** the session ends with the existing Stop semantics, including focus restoration and iframe removal.

#### Scenario: Store cards offer listening

- **WHEN** a Store collection renders a record with a verified source
- **THEN** its 112 × 44px listening action appears below artwork and before the title
- **AND** source-less records retain row alignment without displaying an invented action.
- **AND** Grid actions align with card text, while the Coverflow action centers beneath the active record.

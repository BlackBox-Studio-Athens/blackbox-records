# Spec Delta

## ADDED Requirements

### Requirement: Store card purchase controls count as cart intent

Pointer or keyboard focus on a Store listing card's purchase control SHALL start the same cart surface warm-up as the item page's add-to-cart control, without changing what loads at page start.

#### Scenario: Shopper hovers BUY on a Store card

- **WHEN** a pointer enters or focus reaches a Store card's BUY or Pre-order control
- **THEN** the cart drawer and delivery summary modules start loading if they have not loaded yet
- **AND** the initial app-shell closure budget is unchanged.

### Requirement: The floating player stacks above the phone buy bar

When the phone buy bar is visible and a player session is minimized, the floating player SHALL sit above the bar, moving with it, so neither covers the other's controls.

#### Scenario: Shopper listens while on a phone item page

- **GIVEN** a minimized player session and a visible buy bar at 390 × 844
- **WHEN** the bar is shown
- **THEN** the floating player sits fully above the bar and both remain operable
- **AND** when the bar leaves, the floating player returns to its usual bottom offset.

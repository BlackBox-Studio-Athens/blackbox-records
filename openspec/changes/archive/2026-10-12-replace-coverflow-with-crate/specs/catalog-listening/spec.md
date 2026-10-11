## MODIFIED Requirements

### Requirement: Listen is a separate accessible action

Listen SHALL open the existing single-session player without navigating to the item's purchase page. It SHALL be keyboard reachable and usable on narrow touch layouts while preserving ordinary item links and existing Store Crate gestures.

#### Scenario: Visitor activates Listen

- **WHEN** a visible Listen control is clicked, tapped, or activated with Enter or Space
- **THEN** the player opens for that item without following its item link
- **AND** the control is a button with visible focus and an accessible name.

#### Scenario: Visitor navigates or drags a card

- **WHEN** the visitor follows the item link or completes a Store Crate drag
- **THEN** the existing navigation or gesture completes
- **AND** it does not accidentally start a player
- **AND** cards hidden by the Store Crate do not expose extra keyboard stops.

#### Scenario: Both providers are available

- **WHEN** the visitor starts a new session without an existing provider preference
- **THEN** Bandcamp is selected first and Tidal is available through the existing provider switch
- **AND** a Tidal-only item opens Tidal directly.

#### Scenario: Visitor is only browsing

- **WHEN** a catalog page renders before listening intent
- **THEN** no per-item provider iframe or provider-discovery request is created
- **AND** the existing single-player load, close, minimize, switch-provider, and stop behavior governs listening after activation.

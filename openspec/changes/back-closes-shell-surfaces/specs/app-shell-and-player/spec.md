## ADDED Requirements

### Requirement: Back dismisses page-local browsing surfaces

The Store Crate, phone Artists sheet and Home full-video panel SHALL reuse the shell's marked history entry mechanism at the page's URL. Back SHALL dismiss only the topmost open surface without routing or scrolling the background. Explicit Close, Grid, Done, Escape and backdrop dismissal where offered SHALL consume the surface entry. Forward SHALL restore the surface when its page and content remain available. Closing video SHALL return focus to its Watch button.

#### Scenario: Shopper dismisses a browsing surface

- **GIVEN** Crate, Artists or full video is open
- **WHEN** the shopper presses Back
- **THEN** that surface closes in place and the underlying page retains its offset
- **AND** Forward restores the surface and its available local state.

#### Scenario: Explicit close leaves no empty history step

- **GIVEN** a shopper reached a page through shell navigation and opened a surface
- **WHEN** they close it with its controls, Escape or backdrop where offered
- **THEN** its history entry is consumed
- **AND** the next Back returns to the previous page or action.

#### Scenario: Surface is nested above another surface

- **GIVEN** a player is opened above Crate or a detail overlay
- **WHEN** Back closes the player
- **THEN** the underlying surface and page remain in place
- **AND** the next Back dismisses that underlying surface.

### Requirement: Detail history retains the background viewport

Opening, navigating between and closing detail overlays SHALL preserve the background listing's scroll offset. Back through nested details SHALL restore the previous detail before returning to the listing. Forward SHALL reopen the detail without routing the listing.

#### Scenario: Shopper returns through nested detail history

- **GIVEN** a shopper opened a release from a listing scrolled down the page and then opened its artist
- **WHEN** they press Back twice
- **THEN** the release detail reappears first and then closes
- **AND** the listing retains its original scroll offset and restores its trigger focus without scrolling.

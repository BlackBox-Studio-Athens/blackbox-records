## MODIFIED Requirements

### Requirement: Every listening action identifies the existing session

The shell SHALL mark shared controls for the active editorial source as disabled amber In player status across Store, Releases and details. Other sources SHALL retain Listen. The floating player's Open and Stop actions SHALL remain available on desktop and mobile. Stop SHALL end the session on its first activation without confirmation. Status MUST NOT claim verified playback.

#### Scenario: A session is minimized and its source appears elsewhere

- **WHEN** shell navigation, cached restoration or detail rendering shows the active source
- **THEN** its listening control displays In player and cannot open a second session
- **AND** the floating player remains the place to reopen or stop the existing session.

#### Scenario: A session is stopped or replaced

- **WHEN** Stop ends the session or another source replaces it
- **THEN** all previously matching controls return to their original enabled label
- **AND** a cached page is synchronized with the current source when restored.

#### Scenario: Store cards offer listening

- **WHEN** a Store collection renders a record with a verified source
- **THEN** its 112 × 44px listening action appears below artwork and before the title in Grid
- **AND** source-less records retain row alignment without displaying an invented action.
- **AND** Grid actions align with card text.

#### Scenario: The Store Crate's item in hand listens from its own card

- **WHEN** the Store Crate holds an item with a verified source
- **THEN** that item's own Store card offers its Listen action beside the bin, with its source, provider data and current session state
- **AND** activating it opens the player for that item, and closing the player returns focus to it
- **AND** it displays In player while that source is the active session.

#### Scenario: Stop is pressed once

- **WHEN** the shopper activates Stop in the floating player
- **THEN** the session ends with the existing Stop semantics, including focus restoration and iframe removal.
- **AND** no confirmation state or second activation is required.

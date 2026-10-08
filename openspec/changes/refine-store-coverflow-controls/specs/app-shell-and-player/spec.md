## MODIFIED Requirements

### Requirement: Matching listening actions identify the existing session

The shell SHALL mark shared controls for the active editorial source as disabled amber In player status across Store, Releases and details. Other sources SHALL retain Listen. The floating player's Open and Stop actions SHALL remain available on desktop and mobile. Status MUST NOT claim verified playback.

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

#### Scenario: Coverflow listens from the plaque

- **WHEN** Store Coverflow shows a front record with a verified source
- **THEN** the title plaque's Listen end is that record's listening action, taking its source, provider data and current session state, and the card's own Listen leaves presentation
- **AND** activating it opens the player for the front record, and closing the player returns focus to it
- **AND** it displays In player while that source is the active session
- **AND WHEN** the front record has no verified source, or the group leaves Coverflow
- **THEN** the plaque shows the record identity without a Listen end.

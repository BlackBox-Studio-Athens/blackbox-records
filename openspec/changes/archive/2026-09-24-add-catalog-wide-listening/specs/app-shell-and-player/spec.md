## RENAMED Requirements

- FROM: `### Requirement: Release fields exclusively author player sources`
- TO: `### Requirement: Editorial item fields exclusively author player sources`
- FROM: `### Requirement: Player sessions use stable Release identity`
- TO: `### Requirement: Player sessions use stable editorial source identity`

## ADDED Requirements

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
- **THEN** its 112 × 44px listening action appears below artwork and before the title
- **AND** source-less records retain row alignment without displaying an invented action.
- **AND** Grid actions align with card text, while the Coverflow action centers beneath the active record.

### Requirement: Equalizer motion communicates a listening action without asserting playback

Shared Listen controls and the persistent player's modal header and mini player SHALL use the selected decorative Fluid five equalizer. Motion SHALL be finite, preserve control position, and respect reduced-motion preferences. The equalizer MUST NOT assert that a third-party iframe is playing.

#### Scenario: Listener focuses or activates the player

- **WHEN** a listener hovers or focuses Listen, opens the modal, or interacts with the minimized player
- **THEN** the equalizer can animate for two brief cycles before settling
- **AND** existing provider loading, close/minimize, Stop and iframe continuity semantics remain unchanged.

#### Scenario: Listener requests reduced motion

- **WHEN** reduced motion is enabled
- **THEN** the bars remain static while action labels, visible focus and provider controls remain usable.

#### Scenario: Provider playback state is unknown

- **WHEN** an iframe is loaded or receives interaction without verified playback state
- **THEN** the shell retains truthful loading or Player Ready copy
- **AND** decorative bars are hidden from assistive technology.

## MODIFIED Requirements

### Requirement: Editorial item fields exclusively author player sources

The system MUST derive player providers only from validated Release or Distro provider fields while keeping Artist profile links and commerce links outside player input.

#### Scenario: Artist has provider profile links

- **WHEN** an Artist has Bandcamp or Tidal entries in `profile_links`
- **THEN** those entries remain outbound navigation
- **AND** they do not create player providers or prove that a Release or Distro item is playable.

#### Scenario: Release has zero provider sources

- **WHEN** both provider fields are absent from a Release or Distro item
- **THEN** derived player data is unavailable
- **AND** no Listen trigger or player iframe is created.

#### Scenario: Release has one or both provider sources

- **WHEN** one or both provider fields fully match their supported URL shapes
- **THEN** the shared player-data derivation returns stable editorial source identity, a nonblank display title, and a nonempty provider collection
- **AND** content does not author provider availability, layout, priority, or session state.

#### Scenario: Merch URL points to a music provider

- **WHEN** a Release `merch_url` points to Bandcamp or another provider
- **THEN** it remains commerce navigation and does not become player input.

### Requirement: Player sessions use stable editorial source identity

The persistent shell MUST distinguish session identity from display title, support both Release and Distro sources without cross-collection collisions, and retain established Release session identity across its listening surfaces.

#### Scenario: Player trigger opens a session

- **WHEN** a valid Release or Distro player trigger opens or switches a provider
- **THEN** session reuse and provider preference are keyed by stable editorial source identity
- **AND** formatted title and artist text remain display copy only.

#### Scenario: Two releases share display text

- **GIVEN** two Releases have the same formatted display title
- **WHEN** the user opens their player triggers
- **THEN** the shell treats them as distinct source sessions.

#### Scenario: Collections share a local ID

- **GIVEN** a Release and Distro source share the same collection-local ID
- **WHEN** the user opens their player triggers
- **THEN** the shell treats them as distinct source sessions.

#### Scenario: Same source appears on multiple surfaces

- **WHEN** a visitor activates the same editorial source from its catalog card, editorial detail, or Store Item listening action within the same document
- **THEN** it uses the same session identity and existing reuse rules
- **AND** it does not create a second simultaneous player.

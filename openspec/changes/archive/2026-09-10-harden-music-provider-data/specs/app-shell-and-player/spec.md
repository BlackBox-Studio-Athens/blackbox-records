## ADDED Requirements

### Requirement: Release fields exclusively author player sources

The system MUST derive player providers only from validated Release provider fields while keeping Artist links and commerce links outside player input.

#### Scenario: Artist has provider profile links

- **WHEN** an Artist has Bandcamp or Tidal entries in `profile_links`
- **THEN** those entries remain outbound navigation
- **AND** they do not create player providers or prove that a Release is playable

#### Scenario: Release has zero provider sources

- **WHEN** both Release provider fields are absent
- **THEN** derived player data is unavailable
- **AND** no listen trigger or player iframe is created

#### Scenario: Release has one or both provider sources

- **WHEN** one or both Release provider fields fully match their supported URL shapes
- **THEN** one builder returns player data with stable Release identity, nonblank display title, and a non-empty provider collection
- **AND** content does not author provider availability, layout, priority, or session state

#### Scenario: Merch URL points to a music provider

- **WHEN** a Release `merch_url` points to Bandcamp or another provider
- **THEN** it remains commerce navigation and does not become player input

### Requirement: Provider data is internally coherent

The system SHALL use discriminated provider and player-data types so provider ID, embed layout, URL, and availability cannot contradict each other.

#### Scenario: Bandcamp provider is derived

- **WHEN** a valid Bandcamp album or track embed is parsed
- **THEN** provider ID is `bandcamp`
- **AND** layout is respectively `bandcamp-album` or `bandcamp-track`

#### Scenario: Tidal provider is derived

- **WHEN** a valid Tidal album, track, playlist, or video URL is parsed
- **THEN** provider ID is `tidal`, layout is `tidal`, and the corresponding embed URL is derived

#### Scenario: Provider URL is only partially supported

- **WHEN** a provider URL contains an unsupported host, entity, path segment, or unconsumed trailing path
- **THEN** content validation rejects it
- **AND** no partial or ambiguous provider is derived

### Requirement: Player sessions use stable Release identity

The persistent shell MUST distinguish session identity from display title.

#### Scenario: Player trigger opens a session

- **WHEN** a valid Release player trigger opens or switches a provider
- **THEN** session reuse and provider preference are keyed by stable Release identity
- **AND** the formatted Release title remains display copy only

#### Scenario: Two releases share display text

- **GIVEN** two Releases have the same formatted display title
- **WHEN** the user opens their player triggers
- **THEN** the shell treats them as distinct Release sessions

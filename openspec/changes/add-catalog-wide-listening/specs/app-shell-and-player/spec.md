## RENAMED Requirements

- FROM: `### Requirement: Release fields exclusively author player sources`
- TO: `### Requirement: Editorial item fields exclusively author player sources`
- FROM: `### Requirement: Player sessions use stable Release identity`
- TO: `### Requirement: Player sessions use stable editorial source identity`

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

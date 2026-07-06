## ADDED Requirements

### Requirement: Artwork tool commands are standalone modules

The system SHALL keep the local artwork/distro tool package organized as standalone commands backed by separated command modules.

#### Scenario: Local tool commands resolve independently

- **WHEN** the local tool package is installed or executed in development
- **THEN** `artwork-fetcher`, `vinyl-mockup`, `cd-front-mockup`, `cassette-front-mockup`, `distro-sync`, and `release-date-research` resolve as standalone commands
- **AND** no command requires another command to run first

#### Scenario: Tool domains stay separated

- **WHEN** implementation organizes code under `tools/artwork-fetcher`
- **THEN** artwork fetching, mockup rendering, distro sync, and release-date research live behind separate module entrypoints
- **AND** CLI entrypoints call domain modules rather than other CLI runners
- **AND** distro sync does not own release-date candidate extraction or scoring
- **AND** Release Date Research does not import mockup rendering modules
- **AND** mockup rendering modules do not import Release Date Research modules

#### Scenario: Existing commands keep current behavior

- **WHEN** the module split lands
- **THEN** `artwork-fetcher`, `vinyl-mockup`, `cd-front-mockup`, `cassette-front-mockup`, and `distro-sync` keep their current behavior unless an implementation task explicitly changes it
- **AND** existing fixture-backed tests continue to cover dry-run and apply behavior where they already exist

## ADDED Requirements

### Requirement: Releases support optional singles and clips

The system SHALL let staff save ordered release-specific singles with a title and HTTPS listening URL, and ordered clips with a title and valid YouTube video ID. Incomplete or invalid entries MUST NOT be published.

#### Scenario: Upcoming release has media

- **GIVEN** a release is Upcoming and has saved singles or clips
- **WHEN** staff previews and publishes it
- **THEN** its release page displays those entries in authored order without requiring an album release date

#### Scenario: Media entry is incomplete

- **WHEN** a single lacks a title or valid listening URL, or a clip lacks a title or valid YouTube ID
- **THEN** publication validation identifies the field and keeps the accepted site unchanged

### Requirement: Release media is accessible and optional

The system SHALL present populated singles and clips beneath the release details with clear links and lazy video loading. It SHALL omit an empty group, require user action to play a clip, and work at mobile widths and by keyboard.

#### Scenario: Only singles exist

- **WHEN** a release has singles and no clips
- **THEN** the page shows the singles and omits the clips group

#### Scenario: No release media exists

- **WHEN** a release has no singles or clips
- **THEN** the page shows neither an empty media section nor placeholder controls

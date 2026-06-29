## ADDED Requirements

### Requirement: Public release dates render as metadata

The site SHALL render release dates from the existing `release_date` field as public metadata separate from summary, biography, article, or product description prose.

#### Scenario: Release detail shows the structured release date

- **WHEN** a visitor opens a release detail view for a release with `release_date`
- **THEN** the page shows the day-level release date as a quiet metadata item near the title/artist/release facts
- **AND** the date is not required to be repeated inside the summary or body text

#### Scenario: Release listing surfaces expose release timing without dominating the surface

- **WHEN** a visitor views a release list card, releases landing feature block, artist detail release reference, or release-derived store card
- **THEN** the surface shows release timing from `release_date` in a compact metadata treatment
- **AND** the metadata remains visually secondary to the release title and artwork

#### Scenario: Optional distro release dates remain metadata

- **WHEN** a distro item has `release_date`
- **THEN** the date appears as optional item metadata
- **AND** distro items without `release_date` do not render an empty date label

### Requirement: Decap explains release date semantics

Decap SHALL explain that editing `release_date` changes official release/item metadata, not CMS post text or commerce state. Releases `release_date` SHALL be described as used by the public site for display and ordering/latest release behavior. Distro `release_date` SHALL be described as optional known release metadata used for display.

#### Scenario: Editor changes a release date

- **WHEN** an editor edits the Releases collection `Release date` field
- **THEN** Decap help text explains the field is the official release date for the release
- **AND** Decap help text says the date is used by the site for display and ordering/latest release behavior

#### Scenario: Editor changes an optional distro release date

- **WHEN** an editor edits the Distro collection `Release date` field
- **THEN** Decap help text explains the field is optional known release metadata for the distro item
- **AND** Decap help text tells editors to leave it empty when unknown instead of inferring it from description text

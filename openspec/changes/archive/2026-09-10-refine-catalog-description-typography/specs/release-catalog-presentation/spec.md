## ADDED Requirements

### Requirement: Highlighted Release summaries use restrained editorial typography

The Releases page SHALL render optional `Latest out now` and `Upcoming` summaries with the existing mono font family while preserving each role's current font size, line height, color, width, spacing, sentence casing, and wrapping. Remaining catalog-card summaries and Release detail prose MUST remain on the body font.

#### Scenario: Latest Release summary renders

- **WHEN** the highlighted latest Release provides a summary
- **THEN** its summary uses the existing mono font family
- **AND** it gains no uppercase transformation or label-style letter spacing.

#### Scenario: Upcoming Release summary renders

- **WHEN** the selected Upcoming Release provides a summary
- **THEN** its summary uses the existing mono font family
- **AND** its existing smaller scale and subordinate hierarchy remain unchanged.

#### Scenario: Highlighted summary is absent

- **WHEN** the latest or Upcoming Release does not provide a summary
- **THEN** the corresponding summary remains omitted
- **AND** no placeholder or empty typography surface is added.

#### Scenario: Catalog cards and details render summaries

- **WHEN** a remaining Release card or Release detail page renders descriptive prose
- **THEN** that prose retains the body font
- **AND** the highlighted-summary accent does not become a catalog-wide body treatment.

#### Scenario: Highlighted summaries reflow

- **WHEN** a visitor views highlighted Release summaries at 320 or 390 CSS pixels
- **THEN** the summaries wrap without clipping, overlap, or horizontal page scrolling
- **AND** Release titles, metadata, formats, and actions retain their existing hierarchy and operability.

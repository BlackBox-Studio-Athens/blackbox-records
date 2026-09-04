## MODIFIED Requirements

### Requirement: Main-site UI brand assets are fit-for-purpose and fingerprinted

The system SHALL serve local main-site header and footer brand imagery at dimensions and cache identities appropriate to their rendered UI slots.

#### Scenario: Main-site brand logo renders

- **WHEN** the header or footer renders a repo-owned brand logo that does not require a stable public path
- **THEN** it uses a fit-for-purpose derivative through Astro or Vite's fingerprinted asset pipeline
- **AND** the transferred asset is no more than 40 KiB
- **AND** its intrinsic dimensions are no more than twice the largest required rendered dimension
- **AND** stable geometry and accessible semantics remain present.

#### Scenario: Stable public brand path is still required

- **GIVEN** Sveltia, email, metadata, or the PRD holding artifact requires a stable Public Brand Asset URL
- **WHEN** the main-site derivative is introduced
- **THEN** the required public original or dedicated public copy remains available
- **AND** the main site does not fetch that oversized public source when a fingerprinted derivative is available.

#### Scenario: PRD holding artifact shares an asset

- **WHEN** a font or logo source used by the PRD holding artifact changes
- **THEN** the holding artifact is rebuilt and its closed asset set is verified
- **AND** its no-API, no-analytics, no-third-party-request contract remains unchanged.

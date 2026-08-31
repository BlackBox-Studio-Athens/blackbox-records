## ADDED Requirements

### Requirement: Distro artwork uses approved source evidence

The system SHALL use matched repository artwork or verified artwork-fetcher output for current distro items.

#### Scenario: Existing matched artwork is available

- **WHEN** a canonical manifest row matches a current verified repository image
- **THEN** that image may be reused.

#### Scenario: Artwork is missing or uncertain

- **WHEN** no verified repository image exists
- **THEN** tools/artwork-fetcher produces verified, manual-review, or known-missing evidence before the content projection is accepted.

#### Scenario: Artwork is known missing

- **WHEN** tooling or an explicit human review records known-missing status
- **THEN** a generic format-appropriate fallback may be used
- **AND** fallback is not used merely because lookup was skipped.

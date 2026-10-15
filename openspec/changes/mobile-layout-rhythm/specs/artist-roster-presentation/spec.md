## ADDED Requirements

### Requirement: Artist release counts are inline information

Artists roster and Home artist cards SHALL render their existing release count as compact inline information alongside the Latest metadata, without a standalone statistic box or oversized value. Count derivation, current wording, artist ordering, photos and release links SHALL remain unchanged.

#### Scenario: An artist has one release

- **WHEN** the card renders at 390px or desktop width
- **THEN** the existing 1 Releases text appears in the metadata flow
- **AND** the 106×82px bordered counter and 35.2px value are absent.

#### Scenario: Credit and count need more room

- **WHEN** text is enlarged or metadata is long
- **THEN** the inline group wraps naturally without clipping or covering the Latest release link
- **AND** the displayed count remains source-derived rather than a preview fixture.

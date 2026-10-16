## ADDED Requirements

### Requirement: Artist roster uses compact two-column phone cards

The Artists roster SHALL use two columns from 360 CSS pixels with tighter card padding and the existing 3:4 photo frame. Source order, complete identity, release counts and links SHALL remain unchanged. Narrower widths and enlarged text SHALL reduce columns before content clips; page height SHALL remain intrinsic.

#### Scenario: Roster renders at the phone reference

- **WHEN** Artists renders at 390px with the round-2 reference content
- **THEN** two columns retain the 3:4 photo frame with tighter card padding
- **AND** the supplied page-height comparison is approximately 1583px instead of 3065px, without forcing a fixed page height.

#### Scenario: Roster needs more room

- **WHEN** the viewport is below 360px or enlarged text needs more width
- **THEN** cards reflow without clipped names, photos or links
- **AND** source order, count derivation and accessible targets remain intact.

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

## MODIFIED Requirements

### Requirement: Review Site Marker is the canonical status-cue term

The system SHALL retain `Review Site Marker` as the maintainer term for UAT status cues. The visible banner MAY be called the UAT banner. Its exact English copy SHALL be `UAT · TESTING ONLY`, `Data here is separate and does not transfer to or from the production site.`, and `Open production site`.

#### Scenario: Maintainer artifact names the cue

- **WHEN** a maintainer artifact names the combined cues
- **THEN** it uses Review Site Marker; UAT banner is also permitted for the visible banner.

#### Scenario: Public marker is rendered

- **WHEN** a public or Staff UAT page renders
- **THEN** its banner uses the exact English copy and the browser title starts with `[UAT] `
- **AND** public checkout retains `Test checkout. No real payment will be taken.`
- **AND** UAT remains a Product Environment, not a payment authority or a data-transfer operation.

#### Scenario: Environment terminology is discussed

- **WHEN** maintainers explain the banner
- **THEN** Local, UAT, and PRD remain the three Product Environments and the marker is a visible UAT cue.

## ADDED Requirements

### Requirement: Mobile Releases preserve aligned readable actions

The Releases page SHALL preserve its approved editorial hierarchy on small screens with consistent gutters, complete artwork, naturally wrapping metadata and usable touch controls, without disrupting shell-owned navigation or playback.

#### Scenario: Narrow viewport

- **WHEN** Releases renders from 320px through tablet widths
- **THEN** artwork, identity, release state, price and actions align coherently without horizontal document overflow
- **AND** long titles and metadata remain readable

#### Scenario: Existing desktop and shell behavior

- **WHEN** the viewport is desktop-sized or the shopper navigates through the persistent shell
- **THEN** the approved desktop composition and existing listening, purchase and player continuity remain available

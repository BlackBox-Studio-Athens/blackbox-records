## ADDED Requirements

### Requirement: Store Coverflow image slots match bounded cover geometry

The system SHALL declare Store Coverflow preview image slots from the rendered Coverflow cover geometry instead of ordinary catalog-grid card widths.

#### Scenario: Eligible Coverflow preview renders

- **WHEN** Store All, BlackBox Releases, populated Merch, or an eligible Store Distro group renders in Coverflow preview mode
- **THEN** each positioned cover advertises a responsive slot matching the bounded mobile and desktop Coverflow cover size
- **AND** the browser may select from the existing responsive width ladder without treating each cover as a full-width catalog card
- **AND** below-positioned cards remain lazy and do not become image-preload work.

#### Scenario: Complete catalog renders

- **WHEN** a Store collection is in catalog mode, Coverflow is ineligible or unsupported, or JavaScript is unavailable
- **THEN** ordinary Store and Distro card responsive sizes remain appropriate for the complete grid
- **AND** every canonical card and Content Image remains present and operable without a duplicate card graph.

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

### Requirement: Store Coverflow gives initial priority only to the first visible cover

The system SHALL reserve initial high image-fetch priority for the first visible active Store Coverflow cover while preserving ordinary catalog discovery behavior.

#### Scenario: Eligible Store Coverflow initially renders

- **WHEN** an eligible Store category renders its initial Coverflow preview
- **THEN** only the first active cover loads eagerly with high fetch priority
- **AND** neighboring, hidden, and below-positioned covers use native lazy loading
- **AND** Next or Previous interaction does not create a second runtime priority controller.

#### Scenario: Store Distro groups initially render

- **WHEN** the first rendered Store Distro group is Coverflow-eligible
- **THEN** only that group's first active cover receives initial high fetch priority
- **AND** every other cover in that group and every later group remains lazy
- **AND** a later below-fold Coverflow group does not receive initial high fetch priority.

#### Scenario: Ordinary catalog initially renders

- **WHEN** the first Store collection or Store Distro group is not Coverflow-eligible
- **THEN** its existing leading eager-image behavior remains unchanged
- **AND** remaining catalog images stay lazy without receiving high fetch priority.

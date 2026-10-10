# Spec Delta

## MODIFIED Requirements

### Requirement: Store Coverflow image slots match bounded cover geometry

The system SHALL declare Store Coverflow preview image slots from the rendered Coverflow cover geometry instead of ordinary catalog-grid card widths. Initial Store HTML SHALL describe the default Grid slots even for Coverflow-eligible collections.

#### Scenario: Eligible Coverflow preview renders

- **WHEN** Store All, BlackBox Releases, populated Merch, or an eligible Store Distro group renders in Coverflow preview mode
- **THEN** each positioned cover advertises a responsive slot matching the bounded mobile and desktop Coverflow cover size
- **AND** the browser may select from the existing responsive width ladder without treating each cover as a full-width catalog card
- **AND** below-positioned cards remain lazy and do not become image-preload work.

#### Scenario: Complete catalog renders

- **WHEN** a Store collection is in catalog mode, Coverflow is ineligible or unsupported, or JavaScript is unavailable
- **THEN** ordinary Store and Distro card responsive sizes remain appropriate for the complete grid
- **AND** every canonical card and Content Image remains present and operable without a duplicate card graph
- **AND** changing views updates slot hints for that presentation without replacing cards or fetching a second catalogue.

### Requirement: Store Coverflow gives initial priority only to the first visible cover

Store image priority SHALL follow the default Grid with a fixed leading set of at most four eager images and at most one expected LCP image receiving high fetch priority. Coverflow eligibility alone MUST NOT select preview-only loading behavior.

#### Scenario: Eligible Store Coverflow initially renders

- **WHEN** a Coverflow-eligible Store category renders directly
- **THEN** at most the first four cards use eager image loading, with at most one expected LCP image at high priority
- **AND** the initial presentation is Grid and remaining cards stay lazy even when eligible for Coverflow.

#### Scenario: Store Distro groups initially render

- **WHEN** the Store Distro category initially renders
- **THEN** its groups start in Grid and at most the first four cards of the first group use eager loading
- **AND** at most one expected LCP image receives high priority
- **AND** remaining cards and later groups stay lazy regardless of Coverflow eligibility.

#### Scenario: Ordinary catalog initially renders

- **WHEN** a collection is not Coverflow-eligible or enhancement is unavailable
- **THEN** its initial Grid uses the same bounded leading-card eager-loading rule
- **AND** remaining images stay lazy without competing high fetch priority
- **AND** a narrow viewport does not require JavaScript to calculate an exact eager row; the fixed set may span multiple rows.

#### Scenario: Shopper chooses Coverflow

- **WHEN** Coverflow is explicitly activated after the initial Grid
- **THEN** it reuses existing responsive images and native loading behavior
- **AND** activation or subsequent movement does not create a runtime priority controller, preload every cover, or promote competing high-priority images.

## ADDED Requirements

### Requirement: Compact Store artwork preserves complete product images

Store Grid and filtered-result cards SHALL use stable square artwork frames that show the full cover or physical product without changing source assets.

#### Scenario: Store artwork renders

- **WHEN** a Release, vinyl, CD, cassette, or merchandise image renders in the compact Grid
- **THEN** the whole image fits within the square frame without stretching or destructive cropping
- **AND** responsive image sizes reflect the real card slot, including the desktop browse pane
- **AND** images have appropriate text alternatives.

#### Scenario: An alternate product photo is available

- **WHEN** the separately specified alternate-photo behavior shows another image
- **THEN** it uses the same compact frame without shifting the card's dimensions
- **AND** missing alternates leave the existing primary image usable.

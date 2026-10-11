# Spec Delta

## MODIFIED Requirements

### Requirement: Each release tier keeps role-appropriate emphasis

The system SHALL keep the current Feature Wall as the primary release treatment, present the selected upcoming release as a smaller date-led editorial panel, and present remaining entries as a quiet image-led catalog grid. On desktop devices with hover and a fine pointer, artwork and catalog cards on `/releases/` MUST remain steady while their links and controls retain accessible interaction feedback.

#### Scenario: Featured release renders

- **WHEN** the featured release is available
- **THEN** its presentation retains linked artwork, status label, title, artist, semantic date, formats, optional summary, and existing available actions
- **AND** when all three actions are available, their visible order remains Listen, View Release, then the resolved commerce action
- **AND** the actions retain the current outlined rectangular treatment, visible focus, usable target size, and wrapping behavior
- **AND** Listen retains its status indicator and shell-player trigger behavior
- **AND** View Release retains release-detail navigation while the commerce action continues to use the label and destination supplied by the release-commerce owner

#### Scenario: Selected upcoming release renders

- **WHEN** the selected upcoming release is available
- **THEN** its section includes linked artwork, status text, title, artist, semantic release date, optional summary, and optional formats
- **AND** its scale and spacing remain subordinate to the Feature Wall
- **AND** it gains no new Store, checkout, or provider-owned action

#### Scenario: Remaining catalog renders

- **WHEN** one or more remaining catalog entries are available
- **THEN** the `Our Releases` section reuses the existing release-card detail, player-trigger, image, date, title, artist, focus, and overlay behavior
- **AND** it does not add search, filters, pagination, year grouping, a carousel, or placeholder entries

#### Scenario: Release artwork exposes one interaction language

- **WHEN** a pointer or keyboard user interacts with linked artwork in any release tier
- **THEN** the Feature Wall, Upcoming panel, and remaining catalog reuse a consistent artwork treatment
- **AND** on desktop devices with hover and a fine pointer, the artwork retains its resting crop without hover or focus zoom or transition
- **AND** mobile artwork retains its existing interaction behavior
- **AND** the artwork stays clipped to its frame
- **AND** reduced-motion preference removes the artwork transition and transform

#### Scenario: Desktop catalog card remains steady

- **WHEN** a visitor hovers an Our Releases card on a desktop device with hover and a fine pointer
- **THEN** the artwork frame retains its resting border and shadow
- **AND** View release stays visible and stationary before, during, and after card or Listen interaction
- **AND** card hover does not change the Listen button's appearance or start its equalizer animation
- **AND** keyboard focus remains visible on links and controls

#### Scenario: Desktop listening feedback belongs to the control

- **WHEN** a visitor hovers, focuses, or activates Listen on the desktop Releases page
- **THEN** the button retains its existing feedback and player-trigger behavior
- **AND** the active source retains its disabled In player status
- **AND** release detail overlays preserve the existing shell-owned player session
- **AND** release cards on artist pages retain their existing behavior

#### Scenario: Tier labels and dividers support the hierarchy

- **WHEN** all three tiers render
- **THEN** Latest out now and Upcoming are more prominent than release metadata while remaining subordinate to release titles
- **AND** Our Releases is sized below the page title and proportionately above catalog-card titles
- **AND** adjacent tier regions do not repeat separator rules that read as disconnected boxes

## ADDED Requirements

### Requirement: BlackBox release membership excludes Distro

Release-sourced canonical Store Items MUST belong to BlackBox Releases and All and MUST NOT belong to Distro. This presentation rule MUST preserve source, slug, price, stock and checkout identity.

#### Scenario: Disintegration is classified

- **WHEN** the release-sourced Disintegration Store Item is projected
- **THEN** All and BlackBox Releases include the same canonical item once
- **AND** Distro excludes it.

#### Scenario: Another BlackBox release is classified

- **WHEN** any release-sourced canonical Store Item is projected
- **THEN** the same separation applies without a title-specific exclusion.

#### Scenario: Distro merchandise is classified

- **WHEN** a distro-sourced Clothes item is projected
- **THEN** it remains in Distro, Merch and All through its existing identity.

## ADDED Requirements

### Requirement: Distro browse-group introductions use restrained editorial typography

The Store Distro category SHALL render each populated browse-group introduction with the existing mono font family while preserving its current sentence casing, font size, line height, color, width, spacing, and wrapping. Store orientation descriptions and Distro item-card summaries MUST remain on the body font.

#### Scenario: Distro group introduction renders

- **WHEN** `/store/distro/` renders an authored introduction beneath a populated browse-group heading
- **THEN** the introduction uses the existing mono font family
- **AND** it gains no uppercase transformation or label-style letter spacing.

#### Scenario: Distro orientation and item summaries render

- **WHEN** the Distro orientation description or a Distro item-card summary renders
- **THEN** that copy retains the body font
- **AND** the mono accent does not spread into repeated catalog or Store orientation copy.

#### Scenario: Distro introduction reflows

- **WHEN** a visitor views a Distro browse-group introduction at 320 or 390 CSS pixels
- **THEN** the introduction wraps within the viewport without clipping or horizontal page scrolling
- **AND** the surrounding group title and controls retain their existing hierarchy.

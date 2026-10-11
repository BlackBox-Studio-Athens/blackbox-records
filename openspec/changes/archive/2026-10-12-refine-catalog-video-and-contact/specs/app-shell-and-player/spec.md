## ADDED Requirements

### Requirement: Mobile footer links form a balanced navigation group

The mobile footer SHALL align all sitemap links as an intentional group, including Delivery information, while preserving their logical order, accessible targets and native destinations.

#### Scenario: Footer renders on a narrow screen

- **WHEN** the footer renders at a phone width
- **THEN** links use balanced columns and usable touch targets without horizontal overflow or an isolated delivery-information row.

#### Scenario: Footer is used on desktop

- **WHEN** a visitor follows a footer section link on desktop
- **THEN** the existing composition, destination and persistent shell/player navigation remain usable.

### Requirement: Staff footer text wraps naturally

The footer SHALL render the Staff description as one paragraph without inserting sentence-dependent line breaks.

#### Scenario: Staff saves a short description with several sentences

- **WHEN** Staff saves `No borders. No genres. Just noise.`
- **THEN** the footer keeps the sentences together whenever they fit and wraps only according to available width.

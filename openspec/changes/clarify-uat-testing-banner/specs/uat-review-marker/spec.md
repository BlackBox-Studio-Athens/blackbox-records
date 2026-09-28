## MODIFIED Requirements

### Requirement: Review Site Marker communicates review and payment status

The system SHALL identify public and Staff UAT pages with `UAT · TESTING ONLY` and `Data here is separate and does not transfer to or from the production site.`

#### Scenario: Reviewer opens a UAT shopper page

- **WHEN** a public or Staff UAT document renders
- **THEN** the banner reads `UAT · TESTING ONLY` and `Data here is separate and does not transfer to or from the production site.`
- **AND** its `Open production site` link opens `https://blackbox-records-web.pages.dev/` for public or `https://staff.blackboxrecordsathens.com/` for Staff in a new tab
- **AND** its browser title starts with `[UAT] `.

#### Scenario: Reviewer considers payment behavior

- **WHEN** the marker appears on store or checkout pages
- **THEN** it identifies testing without claiming checkout availability or replacing Worker and provider controls.

### Requirement: Review Site Marker uses layered test-site cues

The system MUST prefix public and Staff UAT browser titles with `[UAT] ` while preserving public metadata and checkout authority.

#### Scenario: Reviewer distinguishes browser tabs

- **WHEN** a public or Staff UAT document renders
- **THEN** its title starts with `[UAT] ` and public canonical, Open Graph, Twitter, and structured metadata retain their normal values.

#### Scenario: Reviewer reaches the final checkout action

- **WHEN** a UAT checkout page renders the final Stripe action
- **THEN** the static warning remains `Test checkout. No real payment will be taken.`
- **AND** Worker feature gates and provider configuration retain payment authority.

### Requirement: Review Site Marker persists with the app shell

The system MUST render one non-dismissible banner above navigation in each UAT shell, outside swapped content and scrolling Staff workspaces.

#### Scenario: Reviewer changes sections

- **WHEN** the user scrolls or changes sections at desktop or 320px mobile width
- **THEN** exactly one non-dismissible banner remains above the header, with readable wrapping and no overlapping controls
- **AND** keyboard users can follow the production link with a visible focus indicator
- **AND** public navigation and player continuity remain intact.

#### Scenario: Reviewer uses layered interface states

- **WHEN** a user opens navigation, cart, detail overlays, or the player
- **THEN** one banner remains in the persistent header boundary and does not cover controls.

#### Scenario: Reviewer opens a route directly

- **WHEN** a UAT route loads directly
- **THEN** its server-rendered document contains the same banner before client interaction.

### Requirement: Review Site Marker remains calm and responsive

The system SHALL show a full-width yellow banner with dark readable text, natural wrapping, and sufficient header space without clipping at 320px width or 200% page zoom.

#### Scenario: Marker renders at desktop width

- **WHEN** the UAT header renders at desktop width
- **THEN** a full-width yellow banner with dark text and an underlined production link appears above navigation.

#### Scenario: Marker renders at narrow mobile width

- **WHEN** the viewport narrows or text grows
- **THEN** the complete notice and production link wrap without horizontal overflow
- **AND** the header and public mobile menu account for the banner's actual height.

#### Scenario: Marker is viewed with browser page zoom

- **WHEN** browser zoom is 200% and the resulting CSS viewport remains at least 320px wide
- **THEN** all banner text and its link remain readable without clipping or overlap.

### Requirement: Review Site Marker is static and accessible

The system MUST communicate UAT identity through readable text with AA contrast, a keyboard-accessible production link, and no dismissal, animation, or live announcement.

#### Scenario: Assistive technology reads the marker

- **WHEN** the banner is exposed to assistive technology
- **THEN** its testing identity, separate-data explanation, and production link are available as readable text.

#### Scenario: Reviewer navigates by keyboard or requests reduced motion

- **WHEN** the production link receives keyboard focus
- **THEN** its focus outline is visible
- **AND** activating it opens the corresponding production root in a new tab, preserving the current UAT work.
- **AND** the banner has no animation, dismissal, or live announcement.

#### Scenario: A user opens a non-UAT build

- **WHEN** Local or PRD renders
- **THEN** neither the UAT banner nor `[UAT]` title prefix is rendered.

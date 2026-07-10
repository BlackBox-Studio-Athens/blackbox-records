## ADDED Requirements

### Requirement: Review Site Marker communicates review and payment status

The system SHALL identify every shopper-facing UAT page with the exact visible marker `Review site · test payments`.

#### Scenario: Reviewer opens a UAT shopper page

- **WHEN** a reviewer opens a shopper-facing page in UAT
- **THEN** the persistent header shows `Review site · test payments` directly beneath the BlackBox wordmark
- **AND** the complete marker is visible without requiring interaction.

#### Scenario: Reviewer considers payment behavior

- **WHEN** the marker is present on a store or checkout page
- **THEN** its wording communicates that payment activity is for testing
- **AND** the marker does not claim that checkout is available or replace Worker and Stripe controls.

### Requirement: Review Site Marker persists with the app shell

The system MUST render one marker inside the persistent header boundary so shell-managed content changes cannot remove or duplicate it.

#### Scenario: Reviewer changes sections

- **WHEN** a reviewer uses header, footer, or mobile navigation for a shell-managed section change
- **THEN** the marker remains visible in the fixed header throughout and after navigation
- **AND** it is not inserted into the swapped `<main>` content.

#### Scenario: Reviewer uses layered interface states

- **WHEN** a reviewer opens or closes a detail overlay, mobile navigation sheet, cart drawer, or player state
- **THEN** exactly one marker remains associated with the header
- **AND** the marker does not block, move, or control the layered interface.

#### Scenario: Reviewer opens a route directly

- **WHEN** a shopper-facing UAT route loads as a full document
- **THEN** the server-built header includes the same marker before client interaction.

### Requirement: Review Site Marker remains calm and responsive

The system SHALL style the marker as restrained secondary identity text within the existing BlackBox header rather than as an alert or promotion.

#### Scenario: Marker renders at desktop width

- **WHEN** the header renders at a desktop viewport
- **THEN** the marker is left-aligned beneath the wordmark in existing system typography and Soft Muted color
- **AND** it has no banner, pill, border, background, shadow, icon, animation, or route accent.

#### Scenario: Marker renders at narrow mobile width

- **WHEN** the CSS viewport is 320px wide at default text sizing
- **THEN** the full phrase remains legible without horizontal overflow, clipping, collision, or control overlap
- **AND** the implementation does not increase the 80px header height, hide words, use an acronym, or require a tooltip.

#### Scenario: Marker is viewed with browser page zoom

- **WHEN** browser page zoom is 200% and the resulting CSS viewport remains at least 320px wide
- **THEN** the complete marker and all header controls remain visible without overlap or loss of content
- **AND** this check is evaluated separately from the default-text 320px mobile case.

### Requirement: Review Site Marker is static and accessible

The system MUST communicate the review state through readable text rather than color, motion, or interaction.

#### Scenario: Assistive technology reads the marker

- **WHEN** the header is exposed to assistive technology
- **THEN** the marker has a readable text alternative that communicates `Review site. Test payments.`
- **AND** its visible text meets WCAG AA contrast against the header.

#### Scenario: Reviewer navigates by keyboard or requests reduced motion

- **WHEN** a reviewer navigates by keyboard or uses `prefers-reduced-motion: reduce`
- **THEN** the marker introduces no focus stop, live announcement, dismissal, hover dependency, or motion
- **AND** it remains visible as stable page context.

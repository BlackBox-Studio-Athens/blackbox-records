## ADDED Requirements

### Requirement: Homepage hero render work is bounded

The app shell SHALL preserve the homepage hero composition without continuous full-viewport raster effects.

#### Scenario: Homepage hero is visible

- **WHEN** the homepage hero renders in the first viewport
- **THEN** its primary image retains eager high-priority responsive delivery
- **AND** the approved monochrome, contrast, and static texture treatment does not require a runtime image filter, animated grain layer, or blending layer
- **AND** no hero visual-effect animation runs infinitely by default.

#### Scenario: Shopper passes the hero threshold

- **WHEN** the existing coarse hero scroll state changes to scrolled
- **THEN** decorative hero media no longer performs animation or paint work behind later content
- **AND** returning above the threshold restores the static hero composition without per-scroll custom-property writes or opacity-transition churn.

#### Scenario: Reduced motion is requested

- **WHEN** the browser reports a reduced-motion preference
- **THEN** nonessential hero motion remains disabled
- **AND** no fallback effect adds continuous filter, paint, or raster work.

### Requirement: Homepage hero scroll synchronization is route-scoped

The app shell SHALL connect hero scroll synchronization only while the current shell route owns the homepage hero.

#### Scenario: Non-home route is active

- **WHEN** the current shell-managed route is not Home
- **THEN** no homepage hero scroll listener or animation-frame callback is installed
- **AND** ordinary route scrolling does not query for a missing hero element.

#### Scenario: Shell route changes between Home and another section

- **WHEN** same-document navigation leaves or enters Home
- **THEN** hero synchronization is disconnected or connected with the route transition
- **AND** at most the existing coarse threshold state is mutated.

### Requirement: Initial app-shell work follows immediate intent

The app shell SHALL keep navigation-critical behavior eager while loading dormant shell-owned UI only after its first relevant intent.

#### Scenario: A normal route first hydrates

- **WHEN** `AppShell` hydrates on page load
- **THEN** same-document navigation interception, route state, focus reset, scroll reset, and required event bridges become ready immediately
- **AND** dormant cart drawer, player presentation, overlay presentation, mobile sheet content, and route-specific portal code are not all part of the initial eager closure
- **AND** the initial app-shell JavaScript closure is no more than 95 KiB Brotli.

#### Scenario: Shopper first requests dormant shell UI

- **WHEN** the shopper first opens the cart, player, detail overlay, mobile menu, or route-specific portal
- **THEN** the required code loads through a direct intent-owned path
- **AND** existing accessible loading feedback covers any visible delay
- **AND** the interaction completes without a full document navigation.

#### Scenario: Player code has loaded

- **WHEN** a player session is opened, minimized, reopened, carried through shell navigation, or stopped
- **THEN** the established single-session player behavior remains unchanged
- **AND** code splitting does not move player ownership into page-local content.

## MODIFIED Requirements

### Requirement: Homepage hero scroll opacity is transition-free

The app shell SHALL keep homepage hero opacity and visibility state free of CSS opacity transitions and per-scroll custom-property writes.

#### Scenario: Shopper scrolls through the homepage hero

- **GIVEN** the homepage hero is rendered in the persistent app shell
- **WHEN** the shopper scrolls from the hero into the next homepage section
- **THEN** the media layer, shade layer, and scroll indicator update their hero scrolled state without declaring opacity transitions
- **AND** scrolling does not repeatedly start and cancel opacity transitions for those scroll targets
- **AND** the app shell does not write `--homepage-hero-scroll-progress` on every scroll frame
- **AND** no removed grain layer remains part of the required scroll-state contract.

#### Scenario: Scroll state changes only at the coarse threshold

- **GIVEN** the homepage hero scroll sync is connected
- **WHEN** repeated scroll events stay on the same side of the hero scrolled threshold
- **THEN** the app shell does not mutate the hero class repeatedly
- **AND** the app shell toggles the scrolled class when the threshold state changes.

#### Scenario: Reduced motion remains respected

- **WHEN** the browser reports a reduced-motion preference
- **THEN** the homepage hero keeps nonessential animation and transition behavior disabled by the existing reduced-motion rules
- **AND** the scroll-state performance work does not remove visible content or status text.

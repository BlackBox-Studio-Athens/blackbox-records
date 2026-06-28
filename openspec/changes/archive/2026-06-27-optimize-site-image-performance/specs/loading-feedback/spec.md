## ADDED Requirements

### Requirement: Image Loading Feedback Is Quiet And Stable

The system SHALL use stable media frames and quiet placeholders for normal image loading instead of noisy per-image loaders.

#### Scenario: Content image has not decoded yet

- **WHEN** a card, hero, detail, or article image has a known image frame but the bytes have not decoded yet
- **THEN** the page displays the reserved frame with the existing surface/background treatment
- **AND** adjacent text, controls, and card dimensions do not shift when the image appears.

#### Scenario: Catalog grid images load progressively

- **WHEN** a product, distro, release, artist, news, or store grid renders before all card images finish loading
- **THEN** the grid remains usable and visually stable
- **AND** individual image loading does not show a spinner, progress meter, shimmer sweep, or status copy per card.

#### Scenario: Image reveal treatment is added

- **WHEN** implementation adds a visual reveal after an image loads
- **THEN** it uses opacity or color transition only, keeps duration at or below 300ms, and avoids layout-affecting transforms
- **AND** the reveal is disabled or materially reduced when `prefers-reduced-motion: reduce` is active.

### Requirement: Image Loading Feedback Is Not Used For Known Content

The system SHALL distinguish normal media streaming from asynchronous data loading.

#### Scenario: Static content already exists in the route document

- **WHEN** a static route document already includes the card, article, hero, or detail content and only image media is pending
- **THEN** the system does not replace the content with skeleton blocks or loading copy
- **AND** the image frame alone represents the pending media.

#### Scenario: Unknown asynchronous data is pending

- **WHEN** a route, overlay, checkout, cart, stock, or provider-backed region waits on unknown asynchronous data
- **THEN** existing loading-feedback rules for explicit pending states continue to apply
- **AND** this image-loading policy does not weaken status, `aria-busy`, disabled, or live-region requirements for actual async operations.

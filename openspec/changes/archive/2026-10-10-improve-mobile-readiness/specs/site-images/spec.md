## ADDED Requirements

### Requirement: Store listing cards use a two-width ladder

Store listing card images SHALL offer 360 and 720 pixel candidates only, so phones, Coverflow and high-density desktops share the 720 pixel transform and fewer unique transformations are requested.

#### Scenario: A Store listing renders

- **WHEN** a Store collection page renders its cards
- **THEN** each card image's `srcset` lists exactly the 360 and 720 pixel transforms.

### Requirement: Image fallback tries the src transform before the original

When a responsive image candidate fails, the browser fallback SHALL clear the responsive candidates and load the image's `src` transform first; only a failed `src` transform SHALL load the canonical public original, once.

#### Scenario: A srcset transform fails

- **GIVEN** a direct Images `srcset` candidate fails to load
- **WHEN** the fallback handles the error
- **THEN** the image loads its `src` transform
- **AND** the original is requested only if that transform also fails.

### Requirement: Home pre-order showcase images are responsive

The Home pre-order showcase SHALL deliver covers with 360 and 720 pixel candidates and slot-matched `sizes`, and band photos with 800, 1200 and 1800 pixel candidates at full viewport width; the showcase JSON SHALL carry these candidate sets and the browser SHALL validate them before use.

#### Scenario: Phone loads the Home showcase

- **WHEN** the showcase renders at 390 px wide on a high-density phone
- **THEN** each cover loads a candidate no wider than 720 pixels
- **AND** the band photo loads from the photo's responsive candidates instead of a single large source.

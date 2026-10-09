## ADDED Requirements

### Requirement: The listing-price read starts during parsing

The Store listing-price prefetch SHALL run as a classic inline script, so its one timed listing-price read per document starts while the document is parsed instead of after module evaluation; the consumer contract and request count stay unchanged.

#### Scenario: A Store collection document loads

- **WHEN** a Store collection document is parsed
- **THEN** the listing-price read starts from an inline classic script
- **AND** the document makes exactly one listing-price read.

### Requirement: Home showcase validation loads only for a buyable pre-order

The Home pre-order showcase SHALL load its validators and candidate data in parallel only after a buyable pre-order is known, and SHALL validate with a lazily imported `zod/mini` schema rather than the full Zod bundle; cart and money code keep full Zod.

#### Scenario: Home has no buyable pre-order

- **WHEN** Home loads while no pre-order is buyable
- **THEN** no showcase validator or Zod chunk is requested.

### Requirement: Positioned Coverflow cards opt out of paint skipping

Store listing cards SHALL keep native paint skipping, but cards positioned by an enhanced Coverflow SHALL use `content-visibility: visible` at every width, so the front card's price and purchase row is never clipped.

#### Scenario: Desktop Coverflow shows its front card

- **WHEN** an enhanced Coverflow renders at 1280 or 1440 px wide
- **THEN** the front card's price and Buy control are painted and clickable
- **AND** non-positioned listing cards still use `content-visibility: auto`.

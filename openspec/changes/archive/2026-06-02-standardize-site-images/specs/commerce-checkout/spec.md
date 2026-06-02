## ADDED Requirements

### Requirement: Store Images Remain Derived Display Data

The system SHALL keep shopper-facing store, cart, and checkout images derived from repo-owned product images.

#### Scenario: Cart or checkout stores image data

- **GIVEN** a StoreCart line, checkout summary, checkout return, or order summary includes an image
- **WHEN** the image value is stored or rendered in browser/runtime state
- **THEN** it is a Runtime Image Snapshot for display only
- **AND** it is not stock, price, payment, order, provider, or product-media authority.

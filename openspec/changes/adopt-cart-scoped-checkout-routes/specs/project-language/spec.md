## ADDED Requirements

### Requirement: Cart-scoped checkout language

The system SHALL distinguish Store Item pages from cart-scoped checkout pages in specs, code, tests, docs, and UI copy.

#### Scenario: Checkout route is named

- **WHEN** an artifact names the shopper checkout document route
- **THEN** it uses `/store/checkout/` for checkout review and payment start
- **AND** it uses `/store/checkout/return/` for hosted checkout return status.

#### Scenario: Store item route is named

- **WHEN** an artifact names a sellable item detail route
- **THEN** it uses `/store/{storeItemSlug}/`
- **AND** it does not describe `/store/{storeItemSlug}/checkout/` as the primary checkout route.

#### Scenario: Reserved checkout segment is named

- **WHEN** specs, docs, tests, or code discuss `checkout` as a store route segment
- **THEN** they treat `checkout` as reserved for cart checkout
- **AND** they do not use it as a `storeItemSlug`.

### Requirement: Store format and variant language

The system SHALL use distinct terms for the current one-Store-Item-per-format model and a future product-style variant selector model.

#### Scenario: Current format-specific item is described

- **GIVEN** a vinyl, CD, tape, or other physical format is separately sellable in the current storefront
- **WHEN** specs, docs, tests, or code describe the shopper URL
- **THEN** they describe it as a format-specific `StoreItem`
- **AND** they use a route shaped like `/store/{storeItemSlug}/`.

#### Scenario: Future product variant selector is described

- **WHEN** specs, docs, tests, or code describe one product-style page with multiple buyable options
- **THEN** they use variant-selector language
- **AND** they define how product identity differs from `storeItemSlug` and `variantId`.

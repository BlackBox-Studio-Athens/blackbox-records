## ADDED Requirements

### Requirement: Catalog generation requires canonical app identity

The system MUST validate one canonical app-owned source, Store Item slug, and variant identity for every physical sellable edition before provider or operational artifacts are emitted.

#### Scenario: Canonical identity is valid

- **GIVEN** all direct projections and explicit Release-to-Distro relations resolve to existing sources
- **WHEN** catalog validation runs
- **THEN** every physical sellable edition has one source owner, one unique `storeItemSlug`, and one unique current standard `variantId`
- **AND** Desired Catalog State, Product Projections, availability, and stock artifacts consume that same validated projection

#### Scenario: Catalog identity is ambiguous

- **GIVEN** the projected catalog contains a duplicate source tuple, Store Item slug, variant ID, repeated relation endpoint, or unresolved cross-source physical duplicate
- **WHEN** catalog generation runs
- **THEN** validation fails with the conflicting app identities
- **AND** no provider, availability, stock, or Store Offer artifact is written

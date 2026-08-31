## ADDED Requirements

### Requirement: The distro manifest is the sole emitted inventory source

The system SHALL generate current distro catalog entries only from the validated repository-owned Distro Inventory Source manifest.

#### Scenario: Catalog artifacts are generated

- **WHEN** distro Product Projection or Desired Catalog State is built
- **THEN** every emitted item maps to exactly one manifest row
- **AND** Astro content contributes only matched editorial projection data.

#### Scenario: Current content is absent from the manifest

- **WHEN** a distro content entry has no canonical manifest row
- **THEN** it is not emitted into current catalog artifacts or checkout eligibility.

#### Scenario: Approved historical extra is emitted

- **WHEN** Spinners or Wreckquiem is generated
- **THEN** its manifest row remains the authority
- **AND** currentSiteExtra records provenance only.

#### Scenario: Rejected duplicate is evaluated

- **WHEN** the Knot On Knot? source row is read
- **THEN** duplicateOf resolves to the canonical Knot On Knot row
- **AND** no second Store Item is emitted.

### Requirement: Distro desired prices form a closed EUR policy

The system SHALL project each emitted distro row to exactly one valid fixed or pay-what-you-want desired price.

#### Scenario: Numeric source price is projected

- **WHEN** sourcePrice is numeric
- **THEN** the fixed EUR amount equals that value in minor units.

#### Scenario: ΕΣ source price is projected

- **WHEN** sourcePrice is ΕΣ
- **THEN** the custom EUR price uses minimum 100, preset 500, and maximum 10000 minor units.

#### Scenario: Blank source price is projected

- **WHEN** sourcePrice is blank
- **THEN** the closed item-type default is used
- **AND** an unknown item type fails validation.

### Requirement: Stripe sync preserves fixed and custom price identity

The system SHALL map fixed desired prices to Stripe unit_amount and pay-what-you-want desired prices to custom_unit_amount.

#### Scenario: Price is created or reconciled

- **WHEN** catalog sync handles a valid distro desired price
- **THEN** it accepts only the matching price kind, EUR currency, and configured amount shape
- **AND** ambiguous or mismatched provider state fails closed.

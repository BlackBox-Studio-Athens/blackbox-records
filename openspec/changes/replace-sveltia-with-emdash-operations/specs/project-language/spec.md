## MODIFIED Requirements

### Requirement: Catalog Promotion terms

The system SHALL distinguish runtime catalog operations from Content Publication and Software Release. Old generated DesiredCatalogState and DesiredPrice terminology SHALL describe migration inputs only after cutover.

#### Scenario: Runtime item setup is described

- **WHEN** a member creates a sellable record
- **THEN** Item Setup means its bounded editorial, catalog, provider, and opening-stock operation
- **AND** Store Item, variant, source, Stock, StockChange, and Price Authority retain their existing meanings.

#### Scenario: Publication and deployment are described

- **WHEN** editorial content reaches the public site
- **THEN** Content Publication identifies a target content revision rendered with its approved code revision
- **AND** Software Release identifies application code, not an editorial label Release.

#### Scenario: Promotion artifacts and evidence are discussed

- **WHEN** setup, catalog repair, publication, or code promotion is reported
- **THEN** evidence identifies the specific operation, environment, code/content revision where applicable, and result
- **AND** no term implies shopper launch or live mutation permission.

### Requirement: Catalog ownership terms are canonical

The system SHALL preserve Catalog Field Ownership, Product Projection, Price Authority, and Sandbox Catalog Alignment terminology while replacing repository editorial authority with CMS editorial authority.

#### Scenario: Catalog Field Ownership is referenced

- **WHEN** an artifact names a field boundary
- **THEN** Catalog Field Ownership identifies one source of truth and its allowed sync direction.

#### Scenario: Product Projection is referenced

- **WHEN** CMS-owned presentation is sent to Stripe Products
- **THEN** it is called Product Projection, not bidirectional sync.

#### Scenario: Price Authority is referenced

- **WHEN** selling price is resolved
- **THEN** Price Authority means the bound Stripe Product's valid default Price
- **AND** a staff price form is a command input, not a second price authority.

#### Scenario: Sandbox Catalog Alignment is referenced

- **WHEN** UAT catalog, provider, and runtime state are verified
- **THEN** Sandbox Catalog Alignment states whether evidence is read-only, applied, mocked, or provider-backed.

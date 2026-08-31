## ADDED Requirements

### Requirement: Catalog-affecting deployment follows the verified artifact commit

The system SHALL deploy UAT catalog changes only from the artifact commit whose backend/provider state passed hosted readiness.

#### Scenario: Visible Store Item set changes

- **WHEN** UAT promotion prepares and verifies the catalog
- **THEN** Worker deployment and hosted listing readiness precede static deployment dispatch
- **AND** the independent push path does not publish that catalog-set commit first.

#### Scenario: Editorial content does not affect the catalog set

- **WHEN** a normal non-catalog static change passes repository gates
- **THEN** the standard static deployment path remains available.

#### Scenario: PRD launch gate is closed

- **WHEN** catalog automation evaluates PRD
- **THEN** it does not deploy a live catalog Worker or static launch surface
- **AND** production-go-live-readiness remains the owner of later PRD launch sequencing.

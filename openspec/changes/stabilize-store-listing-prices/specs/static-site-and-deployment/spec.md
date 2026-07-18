## ADDED Requirements

### Requirement: Catalog-affecting static deploy waits for listing readiness

The system MUST verify complete hosted listing-price readiness before deploying a static catalog change that alters the visible canonical Store Item set.

#### Scenario: New Store Item is ready for static publication

- **GIVEN** a catalog-affecting commit adds a visible canonical Store Item
- **WHEN** target-environment D1, Stripe, and Worker promotion finishes before static deployment
- **THEN** one hosted readiness gate compares all canonical published Store Item slugs with `/api/store/listing-prices`
- **AND** every slug has exactly one ready fixed or pay-what-you-want listing record before the static frontend deploys
- **AND** an independent push-triggered static workflow does not deploy that catalog commit before promotion and readiness pass.

#### Scenario: Listing readiness is incomplete

- **GIVEN** one or more canonical published Store Item slugs are missing, duplicated, or non-ready in the hosted listing-price projection
- **WHEN** the catalog-affecting deployment reaches the listing-readiness gate
- **THEN** static deployment stops before exposing the changed Store Item set
- **AND** the failure reports the affected app-owned slugs without exposing provider IDs or secrets.

#### Scenario: Static change is not catalog-affecting

- **GIVEN** a static-site commit does not alter the visible canonical Store Item set
- **WHEN** normal static deployment runs
- **THEN** it uses existing repository and build gates without requiring provider catalog mutation
- **AND** existing catalog artifact checks still guard against drift.

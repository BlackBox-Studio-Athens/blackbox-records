## ADDED Requirements

### Requirement: Catalog deployments use the gated source revision

All normal deployments SHALL follow the same source SHA and release readiness gate in pages.yml. No catalog-only bypass, artifact bot commit, or cross-workflow deployment dispatch SHALL exist.

#### Scenario: Source affects catalog or code

- **WHEN** repository gates and catalog preparation pass
- **THEN** UAT Worker deployment and hosted listing checks precede static publication
- **AND** smoke tests use that same source SHA.

#### Scenario: PRD launch is disabled

- **WHEN** the disabled PRD frontend is published
- **THEN** existing checkout launch controls remain unchanged.

## REMOVED Requirements

### Requirement: Catalog-affecting deployment follows the verified artifact commit

**Reason**: The approved single-release and Product-default model replaces this promotion-era contract.
**Migration**: Follow the replacement requirements above; preserve prices and operational state.

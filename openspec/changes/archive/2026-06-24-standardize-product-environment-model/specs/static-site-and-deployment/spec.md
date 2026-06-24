## ADDED Requirements

### Requirement: Deployment config maps through Product Environment

Static frontend and Worker deployment configuration SHALL express product targets as `LOCAL`, `UAT`, and `PRD` before naming platform resources.

#### Scenario: Worker config declares product target

- **WHEN** Wrangler config supplies backend runtime variables for local, UAT, or PRD Worker execution
- **THEN** it supplies the canonical Product Environment value through the repository-owned runtime binding
- **AND** Worker names, Wrangler target names, D1 database names, and Cloudflare resource names remain mapped implementation details.

#### Scenario: UAT Worker is deployed

- **WHEN** a repository-owned script deploys or validates the UAT Worker
- **THEN** the command path and output identify `UAT` as the Product Environment
- **AND** any reference to the sandbox Worker resource is labeled as the Worker deployment target for UAT.

#### Scenario: PRD Worker is deployed

- **WHEN** a repository-owned script deploys or validates the PRD Worker
- **THEN** the command path and output identify `PRD` as the Product Environment
- **AND** any reference to the production Worker resource is labeled as the Worker deployment target for PRD.

### Requirement: Local modes remain under LOCAL

The system SHALL keep deterministic local development modes under the `LOCAL` Product Environment.

#### Scenario: Local mock stack starts

- **WHEN** the local mock stack or local stripe-mock API mode starts
- **THEN** backend runtime config resolves to `LOCAL`
- **AND** `mock` or `mock-api` is treated as a local mode or Wrangler target alias, not as a Product Environment.

#### Scenario: Local UAT-connected stack starts

- **WHEN** local frontend code points at the deployed UAT Worker/API
- **THEN** local browser/runtime instructions describe the local shell as `LOCAL`
- **AND** provider writes remain handled by the deployed `UAT` Worker under UAT rules.

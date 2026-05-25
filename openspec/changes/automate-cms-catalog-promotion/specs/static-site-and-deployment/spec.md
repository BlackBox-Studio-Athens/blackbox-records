## ADDED Requirements

### Requirement: CMS catalog publishes coordinate frontend, Worker, D1, and provider state

The system SHALL treat a commerce-affecting CMS publish as a coordinated catalog promotion rather than a static frontend deploy only.

#### Scenario: CMS publish affects buyable catalog state

- **GIVEN** a Decap commit changes commerce-enabled release or distro content
- **WHEN** deployment automation runs
- **THEN** it promotes generated catalog artifacts, D1 readiness, Stripe catalog state, Worker deployment, static frontend deployment, and smoke evidence from the same artifact commit
- **AND** it does not consider the publish complete merely because the static frontend deployed.

#### Scenario: CMS publish is editorial-only

- **GIVEN** a Decap commit changes editorial content that does not affect Desired Catalog State
- **WHEN** deployment automation runs
- **THEN** the normal static frontend workflow deploys without provider catalog apply when frontend gates pass
- **AND** catalog artifact checks still prove no generated catalog drift exists.

#### Scenario: Artifact commit differs from CMS commit

- **GIVEN** automation creates a bot commit for generated catalog artifacts after a CMS commit
- **WHEN** Worker or frontend deployment starts
- **THEN** deployment uses the bot artifact commit
- **AND** Promotion Evidence links both the original CMS commit and the artifact commit.

### Requirement: UAT and PRD deployment topology stays parallel

The system MUST keep UAT and PRD deployment flows structurally equivalent while preserving environment isolation and the PRD-disabled gate.

#### Scenario: UAT promotion deploys

- **GIVEN** UAT catalog apply and verification pass
- **WHEN** UAT deployment runs
- **THEN** it deploys the sandbox Worker and UAT static surface configured for sandbox Worker APIs
- **AND** UAT smoke runs against the UAT surface and sandbox Worker.

#### Scenario: PRD promotion deploys after PRD opens

- **GIVEN** UAT proof passed, the PRD-open gate exists, and production catalog apply and verification pass for the same Desired Catalog State
- **WHEN** PRD deployment runs
- **THEN** it deploys the production Worker and Cloudflare Pages PRD static surface configured for production Worker APIs
- **AND** PRD smoke runs against the PRD surface and production Worker.

#### Scenario: Environment configuration is missing

- **GIVEN** a promotion target lacks required Stripe, D1, Worker, site URL, webhook, or smoke configuration
- **WHEN** deployment automation reaches that environment
- **THEN** the run fails before provider mutation or deployment for that environment
- **AND** the failure records the missing configuration key or external setup category without printing secret values.

### Requirement: PRD promotion is serialized and rerunnable

The system SHALL prevent overlapping PRD catalog promotions from racing each other.

#### Scenario: Multiple CMS publishes occur quickly

- **GIVEN** two commerce-affecting CMS commits are pushed close together
- **WHEN** PRD promotion workflows start
- **THEN** concurrency rules cancel, queue, or supersede stale runs so only the latest validated artifact commit can mutate production provider and D1 state after PRD opens
- **AND** skipped runs record that a newer commit superseded them.

#### Scenario: PRD promotion is retried

- **GIVEN** a PRD promotion failed after a transient provider, network, or deploy error
- **WHEN** the workflow is rerun for the same artifact commit
- **THEN** it resumes safely from current provider and D1 state
- **AND** idempotent apply and verification decide whether remaining changes are needed.

### Requirement: Rollback disables checkout without erasing evidence

The system MUST provide a deployment and catalog rollback path that preserves historical records.

#### Scenario: Bad PRD promotion reaches shopper surface

- **GIVEN** a promoted PRD item has incorrect Product Projection, Price, stock readiness, or checkout behavior after PRD opens
- **WHEN** rollback is invoked
- **THEN** checkout for affected variants is disabled through Worker/D1 catalog readiness or a corrective Desired Catalog State promotion
- **AND** Stripe Products, Stripe Prices, paid orders, stock ledger records, and Promotion Evidence are preserved.

#### Scenario: Static frontend needs rollback

- **GIVEN** provider and D1 state are correct but the static frontend deployment has a content or rendering issue
- **WHEN** frontend rollback runs
- **THEN** the rollback uses the existing static deployment rollback model
- **AND** Worker/provider state is not reset unless a catalog-specific rollback is also requested.

# catalog-promotion-automation Specification

## Purpose

Defines deterministic, fail-closed promotion of committed catalog artifacts through UAT while live PRD commerce remains behind its separate launch gate.

## Requirements

### Requirement: Release builds use one source revision

Each release SHALL use one source SHA and generate one canonical catalog build manifest consumed by the Worker and synchronizer. Generated data SHALL NOT require bot commits or duplicate committed catalogs.

#### Scenario: Content-only or mixed commit

- **WHEN** either reaches main
- **THEN** it follows the same generation, repository checks, catalog readiness, and deployment gate.

### Requirement: One release workflow gates deployment

The pages release workflow SHALL own preparation, UAT Worker deployment, static deployment, and same-SHA smoke tests. All stateful release runs SHALL share a non-cancelling lock.

#### Scenario: Invalid release item

- **WHEN** any intended item lacks valid catalog configuration
- **THEN** all deployment jobs are blocked
- **AND** intentional D1 sold-out or paused availability alone does not invalidate configured catalog state.

#### Scenario: A newer release arrives

- **WHEN** another release is already applying state
- **THEN** the running release finishes under the shared lock before another starts.

### Requirement: Live catalog preparation requires one-run authorization

Live Stripe and PRD D1 mutation SHALL require false-by-default, one-run confirmation. That authorization SHALL NOT enable shopper checkout. PRD launch-disabled frontend publication SHALL remain an intentional valid state.

#### Scenario: Confirmation is absent

- **WHEN** the release publishes the disabled PRD frontend
- **THEN** no live catalog or PRD D1 mutation occurs and existing launch controls remain unchanged.

### Requirement: Catalog release outcomes identify completed stages

The workflow SHALL report the source SHA and stage outcomes, including failed or skipped deployment and smoke stages. Ordinary reports SHALL exclude secrets, full provider IDs, and customer data.

#### Scenario: A deployment fails after preparation

- **WHEN** only some stages completed
- **THEN** the report identifies them and the same source SHA can be retried
- **AND** no reset or atomic cross-provider rollback is implied.

### Requirement: Catalog migration preserves trusted state

Migration SHALL export affected D1 state and validate all selected Product/Price bindings before provider writes. Missing/conflicting mappings SHALL require review. Known UAT reset damage MAY be recovered explicitly using only exact UAT identities and existing prices.

#### Scenario: Routine release after migration

- **WHEN** synchronization runs repeatedly
- **THEN** it preserves stock, reservations, checkout pauses, historical orders, and existing selling prices.

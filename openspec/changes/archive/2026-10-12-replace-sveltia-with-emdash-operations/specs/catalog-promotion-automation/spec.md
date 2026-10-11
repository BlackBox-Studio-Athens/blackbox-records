## MODIFIED Requirements

### Requirement: Release builds use one source revision

Each Software Release SHALL use one source SHA and explicit target content snapshot. Authoritative catalog records SHALL be runtime D1 data and SHALL NOT require artifact bot commits. Legacy generated migration/diagnostic inputs may remain until the documented cleanup; they SHALL NOT supply runtime fallback or overwrite live catalog data during ordinary publication.

#### Scenario: Code or content changes

- **WHEN** software is built
- **THEN** the backend resolves the current catalog from D1; any retained generated migration input is not runtime authority
- **AND** content publication uses its own approved-code and content-revision inputs without a Worker deploy.

#### Scenario: Content-only or mixed commit

- **WHEN** a code commit also changes editorial import inputs or test fixtures
- **THEN** it follows software verification without overwriting hosted CMS or runtime catalog data
- **AND** ordinary member publication does not create such a commit.

### Requirement: One release workflow gates deployment

The canonical software release workflow SHALL own application verification, compatible migrations, UAT Worker/public deployment, and revision-bound smoke. Content Publication SHALL use a separate trigger and the same target mutation lock, without provider catalog apply or backend deployment.

#### Scenario: A software candidate reaches UAT

- **WHEN** repository gates and compatible migrations pass
- **THEN** code deploys and hosted checks verify runtime catalog compatibility
- **AND** no routine full-catalog Stripe mutation or stock seed occurs.

#### Scenario: One existing item needs catalog repair

- **WHEN** a read-only check identifies an affected binding
- **THEN** targeted operational repair remains separate from software release
- **AND** a paused or sold-out item is not automatically reactivated.

#### Scenario: A newer release arrives

- **WHEN** another software or content deployment is changing the same target
- **THEN** the current mutation finishes before the next checks its deployment preconditions.

#### Scenario: Invalid release item

- **WHEN** an existing item has catalog drift but the software candidate is schema-compatible
- **THEN** that item stays unavailable for checkout and its targeted repair remains separate
- **AND** unrelated software deployment does not run a full-catalog apply or reset to repair it.

#### Scenario: PRD code is promoted without live catalog confirmation

- **WHEN** an accepted code candidate is promoted without batch catalog authorization
- **THEN** deployment performs no live Product or Price mutation
- **AND** unready items remain unavailable without preventing a compatible disabled-PRD deployment.

### Requirement: Live catalog preparation requires one-run authorization

Live batch catalog migration or repair SHALL require false-by-default, one-run confirmation. Routine staff price and Item Setup commands SHALL require explicit item-scoped confirmation and authorization. Neither approval SHALL enable shopper checkout.

#### Scenario: Confirmation is absent

- **WHEN** a code build, content publication, import dry-run, or readiness check runs
- **THEN** it performs no live Stripe or commerce-data mutation by implication.

#### Scenario: Confirmed bounded operation runs

- **WHEN** its environment, item or reviewed batch, and intended values are explicitly confirmed
- **THEN** only that operation may perform its approved writes
- **AND** PRD_LAUNCH_APPROVED and native_checkout_enabled remain independent.

### Requirement: Catalog release outcomes identify completed stages

Operational reports SHALL identify source/code revision where applicable, operation or content revision, environment, completed stages, and safe retry guidance without secrets, full provider IDs, or customer data.

#### Scenario: A setup or publication fails after partial completion

- **WHEN** the result is reported
- **THEN** completed provider/data/deployment steps remain distinguishable from pending work
- **AND** retry does not imply a reset or an atomic transaction across Stripe, D1, CMS, and static hosting.

#### Scenario: A deployment fails after preparation

- **WHEN** backend or static deployment stops after an earlier stage succeeded
- **THEN** evidence records the actual deployed code/content revisions and remaining stages
- **AND** compatible retry or code rollback preserves CMS edits, runtime catalog, stock, reservations, and orders.

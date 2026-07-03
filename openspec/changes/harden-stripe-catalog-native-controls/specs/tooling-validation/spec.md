## ADDED Requirements

### Requirement: Stripe-native catalog controls are validated

The system MUST validate Stripe-native catalog forensics, identity, orphan detection, and idempotency behavior with focused automated checks and operator docs.

#### Scenario: Catalog identity tests run

- **WHEN** catalog sync tests run
- **THEN** they cover lookup-key identity, metadata identity, missing identity, malformed identity, foreign Product Environment identity, and legacy sandbox identity.

#### Scenario: Orphan detection tests run

- **WHEN** catalog verification tests run
- **THEN** they cover active expected objects, active BlackBox-owned orphan objects, inactive historical objects, and objects whose ownership cannot be proven.

#### Scenario: Idempotency tests run

- **WHEN** catalog mutation tests run
- **THEN** they prove the same logical mutation reuses the same idempotency key
- **AND** changed amount, currency, Product Projection, repair target, or action purpose changes the key identity.

#### Scenario: Idempotency key safety tests run

- **WHEN** catalog idempotency helper tests run
- **THEN** they prove generated keys stay within Stripe's key length limit
- **AND** they cover request-shape fingerprints, child-key propagation, same-key same-parameter replay intent, and same-key different-parameter rejection intent.

#### Scenario: Report redaction tests run

- **WHEN** catalog reports or logs include Stripe correlation fields
- **THEN** tests prove secrets, raw provider payloads, full Product IDs, full Price IDs, full Event IDs, and full webhook endpoint IDs are redacted or omitted according to repository policy.

#### Scenario: Operator documentation is reviewed

- **WHEN** Stripe UAT catalog docs are updated
- **THEN** they include Stripe Workbench and Events investigation steps, fields to capture before cleanup, cleanup dry-run/apply order, and the limits of Stripe-native event retention.

#### Scenario: Stripe Search usage is reviewed

- **WHEN** Stripe Search is introduced or used in catalog tooling
- **THEN** tests or docs classify it as diagnostic, drift-discovery, or backfill tooling
- **AND** checkout authority remains covered by current-state reconciliation tests.

#### Scenario: Implementation is complete

- **WHEN** behavior-changing implementation finishes
- **THEN** targeted tests, `pnpm test:unit`, `pnpm check`, `pnpm build`, `pnpm openspec -- validate harden-stripe-catalog-native-controls --type change --strict`, and `pnpm openspec -- validate --all --strict` pass before completion is claimed.

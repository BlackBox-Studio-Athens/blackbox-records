## ADDED Requirements

### Requirement: Keyed operator stock retries apply one ledger effect

The system SHALL commit each keyed StockChange or StockCount and its request identity atomically, scoped to the verified actor, operation, and Product Environment, so a recognized retry does not repeat stock or ledger effects. Existing item/price/publication journals and paid-order stock/outbox deduplication SHALL retain their current contracts rather than being moved into a generic request journal.

#### Scenario: A stock adjustment acknowledgement is lost

- **WHEN** an operator retries the same key and normalized delta input
- **THEN** the original committed StockChange is identified without applying the delta again
- **AND** the UI refreshes current authoritative stock rather than treating the old result as current stock.

#### Scenario: A committed recount is retried

- **WHEN** the same key and original recount input identify an already committed StockCount
- **THEN** the system recognizes that result before rejecting its now-old revision
- **AND** no second recount or revision increment occurs.

#### Scenario: An uncommitted recount is stale

- **WHEN** the key does not identify a committed recount and its expected revision is stale
- **THEN** existing conflict behavior rejects the write without stock or ledger changes
- **AND** reassessment retains explicit operator intent and uses a new request identity.

#### Scenario: A key is reused for different input

- **WHEN** an operator reuses a scoped key with a different variant, delta/count, revision, reason, or notes
- **THEN** the system rejects the conflict without a write.

#### Scenario: Separate operations have identical quantities

- **WHEN** independently intentional stock operations use distinct keys
- **THEN** each is validated and may commit independently
- **AND** quantity equality is not used as deduplication identity.

#### Scenario: A concurrent write or restart occurs

- **WHEN** duplicate stock requests race or the process restarts after commit
- **THEN** durable transaction constraints retain one effect and its matching audit identity
- **AND** protected authorization is verified for every replay.

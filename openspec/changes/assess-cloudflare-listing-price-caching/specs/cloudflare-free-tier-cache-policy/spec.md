## ADDED Requirements

### Requirement: Listing-price caching requires a measured explicit decision

The system MUST preserve fresh no-store listing-price behavior until the completed EmDash topology has been assessed and the user has agreed to any changed freshness budget and cache mechanism.

#### Scenario: Cache assessment begins

- **WHEN** listing-price caching is investigated after EmDash acceptance and spec reconciliation
- **THEN** the assessment separates browsing demand from purchase volume and records current latency, payload, reads, operation cost, and snapshot update frequency where observable
- **AND** unmeasured quantities are labelled unknown rather than estimated as zero.

#### Scenario: Hosted measurements are proposed

- **WHEN** measurement would repeatedly touch hosted Worker, object, D1, or R2 operations
- **THEN** local rehearsal, current account-wide headroom, numeric request/operation caps, and stop conditions precede the run
- **AND** existing evidence is reused before new probes and no implicit provider or CMS write is accepted as a read-only test.

#### Scenario: Options are discussed

- **WHEN** the assessment is presented
- **THEN** it compares retaining no-store with conditional reads and supported browser/edge approaches, including freshness, invalidation, privacy, CORS, misses, and Free-tier exhaustion
- **AND** no nonzero TTL or new resource is treated as approved without the user's decision.

#### Scenario: Cache benefit is insufficient

- **WHEN** measured demand or platform restrictions do not justify additional caching
- **THEN** retaining no-store is a valid completed assessment outcome
- **AND** no cache lifecycle or background job is added merely to satisfy a performance proposal.

#### Scenario: A later caching implementation is accepted

- **WHEN** the user agrees to a concrete listing-price cache policy
- **THEN** affected listing/freshness contracts are revised before runtime changes, with explicit maximum stale time, target isolation, invalidation/failure/rollback behavior and measured operation budget
- **AND** Store Offer, checkout, stock, orders, capabilities, private staff/CMS and publication data retain their authoritative fresh-read boundaries.

# Spec Delta

## MODIFIED Requirements

### Requirement: Delivery retries are leased, bounded, and idempotent

The system SHALL use one compare-and-set lease path for immediate and scheduled delivery attempts and SHALL stop automatic attempts after five tries or 24 hours.

#### Scenario: Concurrent processors select one row

- **WHEN** two Worker invocations attempt to claim the same due delivery
- **THEN** only one active lease is created
- **AND** only its owner calls the provider.

#### Scenario: Transient failure is safe to retry

- **WHEN** a provider failure is classified transient inside the attempt and time bounds
- **THEN** the row remains pending with a future next-attempt time and no active lease
- **AND** the next email attempt reuses the same provider idempotency key.

#### Scenario: Automatic retry is no longer safe

- **WHEN** the maximum attempt count, 24-hour window, permanent error, or unsafe acceptance uncertainty is reached
- **THEN** the row becomes needs review
- **AND** scheduled processing skips it.

#### Scenario: Scheduled drain runs

- **WHEN** the 15-minute Worker Cron fires
- **THEN** it processes at most five due rows sequentially across `PaidOrderDelivery` work and pre-order estimate notices, paid-order deliveries first
- **AND** exits without provider work when none are due
- **AND** processes only those two kinds of work without invoking catalog verification or a generic job registry.

#### Scenario: Estimate notice is retried

- **WHEN** a pre-order estimate notice fails transiently
- **THEN** it follows the same lease, attempt and 24-hour bounds as a paid-order delivery
- **AND** a notice replaced by a newer estimate uses a new provider idempotency key so the newer email is not suppressed.

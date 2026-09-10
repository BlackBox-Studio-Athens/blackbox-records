## Purpose

Defines the minimal durable paid-order facts and bounded secondary deliveries needed for receipts, newsletter consent, and manual Greek fulfillment.

## ADDED Requirements

### Requirement: Current paid orders contain complete app-owned fulfillment facts

The system SHALL persist approved paid-order and line-item facts without storing raw provider payloads.

#### Scenario: First paid reconciliation commits

- **WHEN** a current CheckoutOrder completes first verified paid reconciliation
- **THEN** it contains paid amount, EUR currency, shopper contact, recipient, Greek address, and applicable newsletter-consent fields
- **AND** each CheckoutOrderLine retains immutable display name, option label, quantity, unit amount, and line amount.

#### Scenario: Required paid facts are incomplete

- **WHEN** a row marked paid lacks a required current fulfillment or line-item fact
- **THEN** the repository does not expose it as ready paid fulfillment
- **AND** no email, newsletter, or normal manual-fulfillment action starts from it.

#### Scenario: Provider data is mapped

- **WHEN** Stripe-collected payment and delivery data is persisted
- **THEN** only approved app-owned fields are stored
- **AND** raw Stripe objects, raw BOX NOW data, credentials, voucher data, and tracking automation state are omitted.

### Requirement: Paid delivery kinds and states are closed

The system SHALL represent secondary paid-order work only as shopper_confirmation, ops_fulfillment, or newsletter_registration, with status only pending, delivered, or needs_review.

#### Scenario: Paid order has no newsletter consent

- **WHEN** first paid reconciliation commits without complete consent
- **THEN** one shopper-confirmation row and one ops-fulfillment row exist
- **AND** no newsletter-registration row exists.

#### Scenario: Paid order has newsletter consent

- **WHEN** first paid reconciliation commits complete consent
- **THEN** exactly one newsletter-registration row also exists.

#### Scenario: Delivery is actively processed

- **WHEN** a Worker claims a due pending delivery
- **THEN** the row remains pending with an active lease and incremented attempt count
- **AND** no separate processing or failed status is created.

### Requirement: Paid facts and delivery rows commit before providers run

The system MUST commit paid order, stock, fulfillment, and applicable delivery rows atomically before any secondary provider call.

#### Scenario: Authoritative transaction fails

- **WHEN** any paid-order, stock, fulfillment, or delivery-row statement fails
- **THEN** the complete transaction rolls back
- **AND** reconciliation remains retryable.

#### Scenario: Secondary provider fails

- **WHEN** a provider call fails after the authoritative transaction committed
- **THEN** paid order and stock state remain committed
- **AND** only the corresponding delivery row remains pending or becomes needs review.

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
- **THEN** it processes at most five due rows sequentially
- **AND** exits without provider work when none are due
- **AND** processes only `PaidOrderDelivery` work without invoking catalog verification or a generic job registry.

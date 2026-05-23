## Purpose

Specify Worker-owned order state, webhook reconciliation, stock authority, and protected operator stock operations.

## Requirements

### Requirement: Webhook-authoritative order state

The system SHALL make verified Stripe webhooks authoritative for paid and non-paid CheckoutOrder transitions.

#### Scenario: Payment succeeds

- **GIVEN** a pending CheckoutOrder exists
- **WHEN** the Worker receives a verified paid Stripe webhook
- **THEN** the order transitions to paid once
- **AND** stock decrement happens only on the first paid transition.

### Requirement: Non-paid flows preserve stock

The system MUST leave stock untouched for failed, expired, canceled, unpaid, or needs-review checkout states.

#### Scenario: Checkout expires

- **GIVEN** a pending CheckoutOrder has no verified paid signal
- **WHEN** a verified non-paid or expiry signal is reconciled
- **THEN** the order records a non-paid state without decrementing stock.

### Requirement: D1 stock ledger authority

The system SHALL treat D1 as the source of truth for stock, with spreadsheets limited to temporary capture and reporting.

#### Scenario: Operator reconciles offline stock movement

- **GIVEN** stock has changed outside online checkout
- **WHEN** an operator records a known delta or recount
- **THEN** the Worker writes `StockChange` or `StockCount`
- **AND** `OnlineStock` remains the conservative checkout-facing quantity.

### Requirement: Protected operator stock operations

The system MUST expose stock operations only through the protected operator surface.

#### Scenario: Operator changes stock

- **GIVEN** a request targets internal stock APIs
- **WHEN** the Worker receives the request
- **THEN** it requires Cloudflare Access-authenticated operator identity
- **AND** persists the actor email with stock-write audit data.

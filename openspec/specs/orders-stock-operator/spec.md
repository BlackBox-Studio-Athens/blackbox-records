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

### Requirement: Stock workspace reads are visibly pending

The protected stock operations UI SHALL make stock workspace, search, variant load, and refresh reads visibly pending to operators.

#### Scenario: Stock workspace loads

- **GIVEN** an operator opens `/stock/`
- **WHEN** the protected UI is reading variants or initial stock data
- **THEN** the workspace displays a visible loading status that names the stock workspace operation
- **AND** controls that cannot be used safely are disabled with an understandable pending state.

#### Scenario: Operator refreshes selected stock

- **GIVEN** an operator has selected a variant
- **WHEN** the operator refreshes stock data
- **THEN** the refresh action shows a visible refreshing affordance
- **AND** the existing stock context remains visible until the refreshed data or an error arrives.

### Requirement: Stock mutations are visibly pending

The protected stock operations UI SHALL make StockChange and StockCount submissions visibly pending and prevent duplicate submission.

#### Scenario: Operator saves StockChange

- **GIVEN** an operator submits a StockChange
- **WHEN** the mutation is in flight
- **THEN** the StockChange form disables unsafe inputs and shows a visible `Saving StockChange` state on or near the submit action
- **AND** duplicate submission is blocked until success or error.

#### Scenario: Operator saves StockCount

- **GIVEN** an operator submits a StockCount
- **WHEN** the mutation is in flight
- **THEN** the StockCount form disables unsafe inputs and shows a visible `Saving StockCount` state on or near the submit action
- **AND** duplicate submission is blocked until success or error.

### Requirement: Stock loading errors preserve operator context

The protected stock operations UI SHALL preserve visible operator context when loading, refresh, or save operations fail.

#### Scenario: Stock operation fails

- **WHEN** a stock read, refresh, StockChange, or StockCount request fails
- **THEN** the UI displays a visible error message
- **AND** existing selected variant, last known stock, and editable operator input are not cleared unless the failed operation proves they are invalid.

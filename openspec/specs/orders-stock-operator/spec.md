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

The system SHALL treat D1 as the source of truth for stock, with spreadsheets limited to temporary capture and reporting, and MUST commit each operator stock mutation and its audit entry atomically without losing concurrent stock changes.

#### Scenario: Operator reconciles offline stock movement

- **GIVEN** stock has changed outside online checkout
- **WHEN** an operator records a known delta or a current recount
- **THEN** the Worker commits the quantity change and matching `StockChange` or `StockCount` together
- **AND** `OnlineStock` remains the conservative checkout-facing quantity.

#### Scenario: Operator delta races with paid checkout

- **GIVEN** initial physical and online quantities are one
- **WHEN** an operator adds one while a paid checkout consumes one
- **THEN** both successful effects are retained and final quantities are one
- **AND** both audit effects occur once without overwriting the sale.

#### Scenario: Two operator deltas compete

- **WHEN** concurrent valid deltas affect the same variant
- **THEN** each successful delta applies to current database state
- **AND** no update is lost and quantity invariants hold.

#### Scenario: Recount is stale

- **GIVEN** stock has changed since the operator read the recount's concurrency precondition
- **WHEN** the operator submits that recount
- **THEN** the Worker returns a conflict without changing stock or writing StockCount
- **AND** the UI refreshes current stock, preserves entered count and notes, and requires explicit reassessment before resubmission.

#### Scenario: Recount precondition distinguishes missing stock

- **WHEN** a recount supplies its required `expectedRevision`
- **THEN** an integer matches only that existing Stock revision and explicit null matches only an absent Stock row
- **AND** omitted or malformed values fail validation; a valid mismatched precondition returns a conflict without writes.

#### Scenario: Stock returns to the same quantity

- **GIVEN** an operator has read a recount revision
- **WHEN** a sale and restock restore the same quantities before submission
- **THEN** the changed revision still rejects the old recount
- **AND** background refresh does not substitute a newer revision for the operator's unchanged count.

#### Scenario: Mutation guard matches no row

- **WHEN** a conditional stock mutation changes zero rows
- **THEN** no matching StockChange or StockCount is committed
- **AND** the caller receives a conflict or failure rather than apparent success.

#### Scenario: Audit or quantity write fails

- **WHEN** any statement in an operator mutation fails
- **THEN** both the stock change and audit entry roll back
- **AND** the caller receives a failure rather than apparent success.

#### Scenario: Concurrent operation would make stock negative

- **WHEN** a stock mutation cannot satisfy physical or online quantity constraints at commit time
- **THEN** it fails without a partial stock or audit write
- **AND** no stale pre-read bypasses those constraints.

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

### Requirement: Operator APIs are never shared-cacheable

The system MUST prevent browser, CDN, and shared cache reuse of protected operator stock and order API responses.

#### Scenario: Operator reads stock

- **GIVEN** an authenticated operator opens the stock workspace
- **WHEN** the Worker returns variant search, stock detail, or stock history data
- **THEN** the response includes `Cache-Control: no-store`
- **AND** the response remains scoped to the current authenticated operator request.

#### Scenario: Operator reads orders

- **GIVEN** an authenticated operator opens order reconciliation data
- **WHEN** the Worker returns recent order or checkout session order state
- **THEN** the response includes `Cache-Control: no-store`
- **AND** cached order state cannot mask later webhook reconciliation.

### Requirement: Stock mutations invalidate UI assumptions

The system SHALL keep operator stock UI reads fresh after stock mutations.

#### Scenario: StockChange is recorded

- **GIVEN** an operator records a StockChange
- **WHEN** the Worker returns the mutation result
- **THEN** the response includes `Cache-Control: no-store`
- **AND** the UI uses the returned authoritative stock state or performs a fresh read, not a cached prior state.

#### Scenario: StockCount is recorded

- **GIVEN** an operator records a StockCount
- **WHEN** the Worker returns the mutation result
- **THEN** the response includes `Cache-Control: no-store`
- **AND** the previous stock detail or history response is not treated as authoritative after the mutation.

### Requirement: Access-protected routes avoid Cache API dependency

The system MUST NOT require the Cloudflare Workers Cache API for Cloudflare Access-protected operator routes.

#### Scenario: Protected operator surface is deployed

- **WHEN** stock or order operations are served through the protected operator hostname
- **THEN** cache behavior is controlled through response headers and fresh Worker reads
- **AND** implementation does not rely on `caches.default` for protected operator route correctness.

### Requirement: Hosted operator identity requires a verified Access assertion

The system MUST verify a Cloudflare Access JWT before any hosted /api/internal/* route reads or mutates application state.

#### Scenario: Valid assertion is received

- **WHEN** an RS256 assertion has a valid signature, configured issuer and audience, valid lifetime, and normalized email claim
- **THEN** the Worker derives OperatorIdentity from that claim
- **AND** internal route work may continue.

#### Scenario: Assertion is absent or invalid

- **WHEN** a hosted internal request lacks a valid assertion
- **THEN** the Worker returns a generic no-store unauthorized response
- **AND** performs no route-service construction, D1 read, or D1 mutation.

#### Scenario: Verification infrastructure is unavailable

- **WHEN** required hosted trust configuration or usable Access keys are unavailable
- **THEN** the Worker returns a generic no-store temporary-unavailable response
- **AND** does not fall back to any header identity.

### Requirement: Internal authentication is applied once

The system SHALL authenticate the complete /api/internal/* router through one shared middleware and SHALL provide only verified identity to its handlers.

#### Scenario: Internal route is mounted

- **WHEN** a stock or order handler runs
- **THEN** it receives OperatorIdentity from typed middleware context
- **AND** it does not parse Access or forwarded email headers.

#### Scenario: Stock mutation is recorded

- **WHEN** an authenticated operator writes StockChange or StockCount
- **THEN** actor email comes from the verified JWT claim.

#### Scenario: Public route is requested

- **WHEN** a shopper, Stripe webhook, newsletter, services, or CMS route runs
- **THEN** operator middleware is not applied
- **AND** its existing authentication contract remains unchanged.

### Requirement: Editorial and operator authentication remain separate

The system SHALL keep Sveltia GitHub authentication and Cloudflare Access operator authentication as independent boundaries.

#### Scenario: Same person is allowlisted for both systems

- **WHEN** a label member uses Sveltia and the operator stock surface
- **THEN** each system performs its own login and token validation
- **AND** neither reuses the other's token, cookie, callback, or auth helper.

### Requirement: CheckoutOrder transitions are compare-and-set

The system MUST apply paid and non-paid transitions only from pending_payment and MUST keep paid, not_paid, and needs_review terminal.

#### Scenario: Paid transition wins

- **WHEN** first paid reconciliation changes the order to paid
- **THEN** later expiry, failure, unpaid, or replayed events change no row.

#### Scenario: Non-paid transition wins

- **WHEN** verified expiry or asynchronous failure changes the order to not_paid
- **THEN** a later stale paid or non-paid update cannot silently overwrite it
- **AND** no stock mutation occurs.

### Requirement: Paid reconciliation consumes held stock atomically

The system SHALL commit first paid order state and stock effects in one transaction.

#### Scenario: Held checkout is paid

- **WHEN** sufficient physical and online stock still exists
- **THEN** deterministic StockChange rows, Stock decrement, OnlineStock decrement, and paid order state commit together.

#### Scenario: Operator reconciliation removed held stock

- **WHEN** the held quantity can no longer be consumed safely
- **THEN** no partial stock mutation commits
- **AND** the order follows the established needs-review outcome.

### Requirement: Uncertain provider binding remains operator-actionable

The system MUST preserve a pending hold when a created provider session cannot be proven non-payable.

#### Scenario: Session expiry cannot be confirmed

- **WHEN** post-provider binding compensation cannot confirm terminal state
- **THEN** the order remains pending_payment
- **AND** redacted diagnostics identify it for metadata-webhook recovery or operator reconciliation.

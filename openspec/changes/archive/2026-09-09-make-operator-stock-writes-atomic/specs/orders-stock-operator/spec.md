## MODIFIED Requirements

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

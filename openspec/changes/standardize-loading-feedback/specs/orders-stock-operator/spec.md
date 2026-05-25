## ADDED Requirements

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

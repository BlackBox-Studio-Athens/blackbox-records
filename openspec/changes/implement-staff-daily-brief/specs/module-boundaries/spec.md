## MODIFIED Requirements

### Requirement: Analytics reporting has one closed application owner

A closed analytics application module SHALL own protected reporting orchestration, provider reads and retained Visits aggregates. HTTP and scheduled runtime consumers SHALL use its declared public root. Orders SHALL retain ownership of authoritative filtered order/line aggregation. Staff SHALL consume only generated browser-safe internal API contracts.

#### Scenario: Protected or scheduled analytics is composed

- **WHEN** HTTP reads or the existing schedule invokes analytics
- **THEN** native project metadata declares the analytics root and dependencies
- **AND** browser code imports no provider, database or Worker implementation.

#### Scenario: Staff requests a filtered report

- **WHEN** the protected HTTP layer or existing schedule composes analytics
- **THEN** consumers use the declared analytics root and native Nx dependencies
- **AND** filtered Store reads pass through the Orders public root
- **AND** the browser receives aggregate report contracts only

## ADDED Requirements

### Requirement: Staff frontend is an independent workspace boundary

The system SHALL treat the public web application and staff application as separate workspace packages with no source-level imports between them.

#### Scenario: Staff code needs an API contract

- **WHEN** the staff application consumes internal stock request or response types
- **THEN** it imports the documented `@blackbox/api-client/internal` workspace-package export
- **AND** it does not import source from `apps/web` or `apps/backend`.

#### Scenario: Frontend application ownership is audited

- **WHEN** module-boundary validation runs
- **THEN** `apps/web` and `apps/staff` are registered as distinct workspace boundaries
- **AND** staff-owned routes, components, API helpers, styles, and tests resolve to the staff boundary without an ownership exception.

#### Scenario: Public application is inspected after the move

- **WHEN** repository boundary and unused-code audits inspect `apps/web`
- **THEN** no compatibility facade or forwarding import preserves the former stock route ownership
- **AND** remaining public code does not depend on the staff application.

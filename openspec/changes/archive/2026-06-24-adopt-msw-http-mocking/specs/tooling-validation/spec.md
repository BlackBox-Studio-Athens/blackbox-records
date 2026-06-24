## ADDED Requirements

### Requirement: MSW is test-only

The system SHALL use MSW only as a test harness for browser-facing HTTP behavior.

#### Scenario: HTTP mock is needed

- **GIVEN** a frontend or generated-client test exercises checkout or stock HTTP behavior
- **WHEN** the test needs request and response mocking
- **THEN** MSW handlers may provide typed public/internal API fixtures without adding runtime frontend code.

### Requirement: MSW does not replace backend authority

The system MUST keep backend route tests, generated API contracts, local stripe-mock, Stripe sandbox evidence, and Browser Use acceptance checks authoritative for their scopes.

#### Scenario: Contract drift is suspected

- **GIVEN** an MSW fixture differs from generated API types or backend route behavior
- **WHEN** the discrepancy is found
- **THEN** generated contracts and backend route tests are corrected or reviewed instead of masking drift in MSW.

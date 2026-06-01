## ADDED Requirements

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

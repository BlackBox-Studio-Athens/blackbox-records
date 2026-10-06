## MODIFIED Requirements

### Requirement: Provider smoke remains authoritative

The system SHALL keep Stripe sandbox smoke as the authoritative proof for hosted Checkout and checkout readiness that depends on provider state.

#### Scenario: Static smoke does not replace provider smoke

- **WHEN** a smoke run reads only static routes or CMS boot output
- **THEN** it does not replace Stripe sandbox smoke for amount, currency, payment-method surface, webhook delivery, order reconciliation, or D1 stock and payment authority
- **AND** PRD readiness remains no-live-payment evidence unless an explicit paid-smoke policy is enabled.

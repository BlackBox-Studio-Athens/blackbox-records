## ADDED Requirements

### Requirement: CheckoutOrderPaid event language is canonical

The system SHALL use `CheckoutOrderPaid` for the internal application event that represents a CheckoutOrder first becoming paid after verified reconciliation.

#### Scenario: Paid order event is named

- **GIVEN** a verified Stripe webhook causes the first paid CheckoutOrder transition
- **WHEN** specs, code, tests, docs, or handoff notes name the internal event used by paid-order email behavior
- **THEN** they use `CheckoutOrderPaid`
- **AND** they do not name the internal event `PaymentSucceededEvent` or another provider/payment-centric synonym.

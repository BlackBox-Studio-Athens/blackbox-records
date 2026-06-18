## ADDED Requirements

### Requirement: Paid order email side effects

The system SHALL publish `CheckoutOrderPaid` and start paid-order email notification side effects only after verified Stripe webhook reconciliation applies the first paid CheckoutOrder transition.

#### Scenario: First paid transition triggers email

- **GIVEN** a pending CheckoutOrder exists
- **WHEN** the Worker receives a verified paid Stripe webhook and applies the first paid transition
- **THEN** `CheckoutOrderPaid` is published after order state and stock reconciliation succeed
- **AND** paid-order email notification work starts from that internal application event.

#### Scenario: Non-applied reconciliation does not trigger email

- **GIVEN** Stripe webhook reconciliation returns replay, missing order, needs review, rejected, stock unavailable, or non-paid status
- **WHEN** email side effects are evaluated
- **THEN** no `CheckoutOrderPaid` event is published
- **AND** no paid-order email notification is started.

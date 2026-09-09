## ADDED Requirements

### Requirement: Paid webhook acknowledgement follows a durable outcome

The system MUST acknowledge an app-owned paid checkout event successfully only after a durable paid or needs-review outcome, or a verified terminal replay; recoverable failures before that boundary MUST receive a retryable non-success response.

#### Scenario: Order cannot yet be recovered

- **WHEN** a verified app-owned paid event still has no matching order after session and metadata recovery
- **THEN** the Worker returns a retryable non-2xx response
- **AND** no stock mutation or normal paid delivery occurs
- **AND** the failed outcome is available for operator investigation and provider resend.

#### Scenario: Stock cannot satisfy a paid order

- **WHEN** verified payment is received but the pending order's required stock is unavailable
- **THEN** the Worker atomically records `needs_review` and a safe shortage reason before acknowledging success
- **AND** retains the order/payment correlation for protected operator investigation
- **AND** no partial stock mutation or normal paid delivery occurs.

#### Scenario: Review reason is retained

- **WHEN** a new shortage, line-mismatch, or incomplete-fulfillment review outcome commits
- **THEN** its bounded `needsReviewReason` code and verified payment correlation commit with the order status
- **AND** replay preserves the reason while legacy review rows can retain an unknown reason.

#### Scenario: Another reconciliation wins the transition

- **WHEN** a guarded review write changes zero rows because another event already made the order terminal
- **THEN** the Worker reads and preserves the winning outcome before acknowledging
- **AND** it does not report an unsaved review transition or mutate stock/delivery for the losing event.

#### Scenario: Durable outcome cannot be saved

- **WHEN** the paid or review transaction fails
- **THEN** the Worker returns a retryable non-2xx response
- **AND** transaction writes roll back together
- **AND** a later successful delivery can complete the same order without duplicate stock consumption.

#### Scenario: Paid outcome is replayed or email fails afterward

- **WHEN** an already committed paid/review outcome is replayed or delivery fails after a paid commit
- **THEN** the Worker acknowledges the durable order outcome
- **AND** stock remains idempotent
- **AND** post-payment delivery retries remain owned by the existing delivery outbox.

#### Scenario: Terminal shortage is operated manually

- **WHEN** an authorized operator investigates a needs-review shortage
- **THEN** the protected order read identifies the order, review reason, and payment correlation without exposing them publicly
- **AND** the operational procedure covers customer contact and manual refund or other verified resolution without automatically reopening the order or charging again.

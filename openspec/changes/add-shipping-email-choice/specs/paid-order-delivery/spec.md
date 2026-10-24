## ADDED Requirements

### Requirement: Shipping email opt-out is durable

The system SHALL allow an operator to record dispatch without queuing a shipping email. An explicit opt-out SHALL persist with the dispatch record and survive undo/re-mark. Existing email deliveries SHALL retain their original state and retry history. Omitting the choice SHALL retain the existing send-by-default behavior.

#### Scenario: Operator skips the first shipping email

- **WHEN** an authorized operator marks a complete paid order shipped with the shipping email disabled
- **THEN** the dispatch mark and durable opt-out commit together without a shipping-email delivery or provider call
- **AND** immediate and scheduled processing never send a shipping email for that opt-out.

#### Scenario: Operator undoes and re-marks a skipped order

- **WHEN** an operator undoes a silent dispatch mark and later marks it shipped again, even requesting an email
- **THEN** the original opt-out stays and no shipping-email delivery is created.

#### Scenario: Shipping notification already exists

- **WHEN** a dispatch change requests no email after a shipping-email delivery already exists
- **THEN** that delivery and its retry history remain unchanged
- **AND** it is not labelled skipped or treated as cancellable.

#### Scenario: Default dispatch and concurrent writes

- **WHEN** a complete paid order is first marked shipped with the email enabled or the choice omitted
- **THEN** the existing atomic, duplicate-safe shipping-email queue and retry behavior apply
- **AND** a stale competing mark cannot change the winning choice or create a second delivery.

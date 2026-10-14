# Spec Delta

## ADDED Requirements

### Requirement: Company order confirmation contains durable contract information

For orders placed after the approved company transition, the system SHALL provide the applicable required contract information in the confirmation email itself, in both readable HTML and plain text. This SHALL include seller identity, order and price facts, delivery terms, applicable withdrawal instructions and model form, and legal-guarantee information. A mutable website link alone SHALL NOT satisfy this requirement.

#### Scenario: A company order is confirmed

- **WHEN** an eligible company order is confirmed
- **THEN** the shopper receives the applicable information in a form they can retain, within a reasonable time and no later than delivery of the goods
- **AND** the message remains a contract confirmation, not a claimed fiscal receipt or invoice.

### Requirement: Contract information retains its order-time version

The system SHALL retain the approved seller and contract-information version applicable when the order was placed. Later content or seller changes SHALL NOT rewrite that record or change the content used for a retry. Historical natural-person orders SHALL retain their actual seller identity.

#### Scenario: Terms change before an email retry

- **WHEN** a confirmation is retried after new terms or seller details are published
- **THEN** the retry uses the original applicable contract information and immutable order facts
- **AND** existing delivery idempotency and retry bounds remain in force.

#### Scenario: An order predates the company transition

- **WHEN** an earlier natural-person order is read or its confirmation is retried
- **THEN** the system does not substitute the company's identity or fabricate missing historical terms.

### Requirement: Missing contract information requires operator action

The system SHALL identify incomplete required contract information as an actionable confirmation-delivery failure. It SHALL preserve successful payment and stock facts, avoid claiming complete delivery, and retain safe, bounded retry and operator recovery behavior.

#### Scenario: Required company information is unavailable

- **WHEN** a company confirmation lacks its approved seller or contract-information version
- **THEN** the confirmation is not marked delivered as a complete contract record
- **AND** the operator receives an actionable failure without payment reversal, duplicate stock mutation or exposure of personal data in logs.

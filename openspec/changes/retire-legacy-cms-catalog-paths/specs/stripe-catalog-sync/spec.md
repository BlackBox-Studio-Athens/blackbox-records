## ADDED Requirements

### Requirement: Repository catalog inputs are explicit recovery data

Repository-derived catalog contracts SHALL be used only by explicit migration/recovery commands and fixtures. Routine software release SHALL NOT seed or reconcile repository catalog state into runtime commerce.

#### Scenario: Member changes runtime catalog

- **WHEN** a member creates an item or changes its price and software is subsequently released
- **THEN** persisted identities, prices, stock, pauses, reservations and orders remain authoritative, including items absent from repository content.

#### Scenario: Recovery reruns

- **WHEN** an operator explicitly runs reviewed recovery against existing identities
- **THEN** existing operational state is preserved and conflicting identities stop for review.

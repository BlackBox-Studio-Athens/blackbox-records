## ADDED Requirements

### Requirement: Commerce inputs accept only values the commands accept

Staff commerce inputs SHALL accept only values the commerce commands accept:

- EUR amount inputs SHALL ignore keystrokes that cannot lead to an amount the price commands accept.
- Stock removal SHALL NOT exceed current stock (the existing preview guard blocks submission).
- Online quantity SHALL NOT exceed the counted quantity.
- Notes SHALL NOT exceed 500 characters, and searches SHALL NOT exceed 200 characters.
- A stock change reason SHALL be one of Other stock change, Sold at a show, New delivery, or Gift or promo copy. The protected stock-change API SHALL reject any other reason.
- A restored item-setup draft SHALL restore its physical format only when that format is supported.

#### Scenario: A member types an invalid price

- **WHEN** a member types a letter, a third decimal digit or a second separator into a EUR amount
- **THEN** the input keeps its previous value.

#### Scenario: A client sends an unknown stock reason

- **WHEN** a stock change request uses a reason outside the four staff reasons
- **THEN** the Worker rejects the request before recording a ledger entry.

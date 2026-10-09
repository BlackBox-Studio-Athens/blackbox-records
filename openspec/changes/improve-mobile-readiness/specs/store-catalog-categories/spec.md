## ADDED Requirements

### Requirement: Store collections show the first row on a phone first viewport

Below 64rem a Store collection page SHALL omit its Top link and the empty artist host and use tightened spacing, while keeping the format chips, category navigation, search and result count; wider viewports are unchanged.

#### Scenario: Shopper opens the Store on a phone

- **WHEN** `/store/` loads at 390 × 844
- **THEN** the first Store card's artwork starts inside the first viewport.

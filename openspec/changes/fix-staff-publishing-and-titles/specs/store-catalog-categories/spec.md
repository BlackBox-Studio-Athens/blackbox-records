## ADDED Requirements

### Requirement: Greek titles display in capitals

Public titles that receive the Greek Inter exception SHALL display in capitals on every surface, including Store listing cards whose Latin titles rely on Veneer's capitals. Greek capitals SHALL follow Greek casing rules, so accents are dropped. Source titles, accessible names and catalog matching SHALL keep the original text.

#### Scenario: A Greek Store listing title renders

- **WHEN** a Store listing card shows a Greek title such as Λωβή or 200 χρόνια προτεκτοράτο
- **THEN** it reads ΛΩΒΗ or 200 ΧΡΟΝΙΑ ΠΡΟΤΕΚΤΟΡΑΤΟ in Inter weight 600
- **AND** the stored title and its accessible name stay unchanged.

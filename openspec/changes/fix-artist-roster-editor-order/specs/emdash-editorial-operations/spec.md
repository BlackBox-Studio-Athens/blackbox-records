## ADDED Requirements

### Requirement: Artist ordering guidance distinguishes finder and public appearance

Staff operational guidance SHALL explain that the Artist finder uses alphabetical title order, while Home and the Artist Listing appearance use the accepted or selected draft activity state. Guidance SHALL identify the existing Active artist control and preserve private drafts during environment adoption.

#### Scenario: Inactive Chronoboros appears fourth on the public roster

- **GIVEN** Afterwise, Ouranopithecus and Sidus are active and Chronoboros is inactive
- **WHEN** an operator checks the Artist Listing appearance
- **THEN** the roster order is Afterwise, Ouranopithecus, Sidus, Chronoboros
- **AND** the alphabetical Staff finder is not described as the public card order

#### Scenario: Populated CMS retains operator content

- **GIVEN** an existing CMS has a saved Artist record or private draft
- **WHEN** software containing the retained inactive source fixture is deployed
- **THEN** guidance states that deployment does not adopt the fixture's activity value
- **AND** operators review all saved Artist changes before any publication instead of reseeding or overwriting content

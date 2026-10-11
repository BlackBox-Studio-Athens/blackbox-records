## ADDED Requirements

### Requirement: Artist rosters prioritize published activity

Home and Artists SHALL order active Artists before inactive Artists, alphabetically by name within each group. Missing or null activity SHALL mean active. Home SHALL show the first three ordered profiles. Inactive profiles and their releases SHALL remain accessible.

#### Scenario: Active Sidus precedes inactive Chronoboros

- **WHEN** Afterwise, Ouranopithecus and Sidus are active and Chronoboros is inactive
- **THEN** Artists shows Afterwise, Ouranopithecus, Sidus, Chronoboros
- **AND** Home shows Afterwise, Ouranopithecus and Sidus.

#### Scenario: A roster has one activity group or no profiles

- **WHEN** all profiles have the same activity or the collection is empty
- **THEN** profiles retain alphabetical order or the roster remains empty
- **AND** Home shows at most three profiles without removing inactive profiles from eligibility.

#### Scenario: Private activity changes are not public

- **WHEN** staff change an Artist's activity in a private draft
- **THEN** the accepted public order remains unchanged until that revision is published
- **AND** private listing preview can show the selected draft's ordering.

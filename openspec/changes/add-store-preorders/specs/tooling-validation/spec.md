# Spec Delta

## ADDED Requirements

### Requirement: Commerce migrations are discoverable by the migration runner

Every commerce D1 migration SHALL be a flat, uniquely numbered SQL file directly inside the configured migrations directory, so that the hosted migration runner and the test migration loader both apply it.

#### Scenario: A migration is added

- **WHEN** a commerce migration is added
- **THEN** it is named with the next four-digit number and a snake_case description and ends in `.sql`
- **AND** a repository check fails when the migrations directory contains a folder, a differently named file, a duplicate number or a gap.

#### Scenario: The order pagination index

- **WHEN** migrations are applied to an empty or an existing commerce database
- **THEN** the index on order creation time and identity exists afterwards
- **AND** applying the migration where the index already exists succeeds without error.

## MODIFIED Requirements

### Requirement: Primary section identities use distinct canonical copy

The five primary section surfaces and Store Category pages SHALL use distinct supporting-label and level-one-title copy. Their canonical pairs MUST be `Roster` / `Artists`, `Catalog` / `Releases`, `Store` / the active Store Category, `What We Do` / `Services`, and `About` / `The Label`.

#### Scenario: Visitor opens the base Store route

- **WHEN** `/store/` renders directly or through the persistent app shell
- **THEN** its supporting label is `Store`
- **AND** its level-one heading is `All`
- **AND** its browser metadata title remains the canonical Store metadata title.

#### Scenario: Visitor opens a named Store Category

- **WHEN** a discoverable Store Category route other than `/store/` renders
- **THEN** its supporting label is `Store`
- **AND** its level-one heading is that route's existing category name.

#### Scenario: Visitor opens Services

- **WHEN** `/services/` renders directly or through the persistent app shell
- **THEN** its supporting label is `What We Do`
- **AND** its level-one heading is `Services`
- **AND** its intro, explanatory copy, and inquiry action remain present.

#### Scenario: Visitor opens another primary section

- **WHEN** Artists, Releases, or About renders directly or through the persistent app shell
- **THEN** its supporting-label and level-one-title pair is respectively `Roster` / `Artists`, `Catalog` / `Releases`, or `About` / `The Label`
- **AND** the pair does not repeat the same normalized text.

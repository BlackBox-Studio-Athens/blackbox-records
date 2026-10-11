## MODIFIED Requirements

### Requirement: Primary section identities use distinct canonical copy

The visible primary section identities SHALL use distinct supporting-label and level-one-title pairs: `Roster` / `Artists`, `Store` / the active Store Category, `What We Do` / `Services`, and `About` / `The Label`. Releases SHALL retain its canonical metadata title and one visually hidden accessible Releases level-one heading without a visible Catalog supporting label or Releases page title.

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

- **WHEN** Artists or About renders directly or through the persistent app shell
- **THEN** its supporting-label and level-one-title pair is respectively `Roster` / `Artists` or `About` / `The Label`
- **AND** the pair does not repeat the same normalized text.

#### Scenario: Visitor opens Releases

- **WHEN** Releases renders directly or through the persistent app shell
- **THEN** it retains one accessible visually hidden Releases level-one heading and its canonical browser metadata title
- **AND** no visible Catalog / Releases introduction appears.

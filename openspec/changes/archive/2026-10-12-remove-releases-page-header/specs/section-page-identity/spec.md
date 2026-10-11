# Spec Delta

## MODIFIED Requirements

### Requirement: Primary section titles use one responsive typography contract

The site SHALL render the visible level-one page titles for Artists, every Store Category, Services, and About with the shared internal page hero's display font, responsive size, line height, letter spacing and balanced wrapping. Their computed properties MUST match at the same viewport and root font settings; route-specific intro styles MUST NOT override them. Releases SHALL instead retain one visually hidden accessible level-one heading without a visible introduction.

#### Scenario: Primary sections render at a wide viewport

- **WHEN** Artists, Releases, Store, Services, and About render at the same supported wide viewport
- **THEN** the visible level-one page titles expose matching computed title typography
- **AND** Services retains its route-specific intro composition
- **AND** Releases retains its accessible heading without a visible introduction.

#### Scenario: Primary sections render at a narrow viewport

- **WHEN** the five primary sections render at 390 or 320 CSS pixels wide
- **THEN** their visible level-one titles resolve through the same responsive title scale and wrap without horizontal page scrolling
- **AND** the visually hidden Releases heading occupies no introductory layout space.

#### Scenario: App shell swaps a primary section

- **WHEN** the persistent app shell swaps any primary section into the current document
- **THEN** visible level-one titles use the same typography as their direct-load documents
- **AND** Releases retains the same visually hidden heading as its direct-load document
- **AND** the destination retains one level-one heading.

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
- **AND** its patterned intro, explanatory copy, and inquiry action remain present.

#### Scenario: Visitor opens another primary section

- **WHEN** Artists or About renders directly or through the persistent app shell
- **THEN** its supporting-label and level-one-title pair is respectively `Roster` / `Artists` or `About` / `The Label`
- **AND** the pair does not repeat the same normalized text.

#### Scenario: Visitor opens Releases

- **WHEN** Releases renders directly or through the persistent app shell
- **THEN** it retains one accessible visually hidden Releases level-one heading and its canonical browser metadata title
- **AND** no visible Catalog / Releases introduction appears.

### Requirement: Custom primary-section headers have regression protection

The repository SHALL keep focused automated coverage for every primary-section identity that bypasses the shared internal page hero. Visible custom headers MUST use the shared title typography and distinct normalized supporting-label and title copy. The Releases identity coverage MUST instead protect its single visually hidden accessible heading and absence of the visible introductory header.

#### Scenario: Custom Releases or Services identity regresses

- **WHEN** a change restores the visible Releases introduction, removes its accessible heading, or makes the Services custom header repeat its normalized label as its title or own a route-specific title scale
- **THEN** the focused unit contract fails before build acceptance.

#### Scenario: A new custom primary-section header is introduced

- **WHEN** a primary section stops using the shared internal page hero or adds another custom header path
- **THEN** that custom path is added to the focused identity contract
- **AND** the contract verifies distinct copy and shared title typography for visible headers, with the explicit visually hidden Releases exception.

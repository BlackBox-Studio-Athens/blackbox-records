## ADDED Requirements

### Requirement: Primary section titles use one responsive typography contract

The site SHALL render the level-one page titles for Artists, Releases, every Store Category, Services, and About with the same display font, responsive font size, line height, letter spacing, and balanced wrapping already used by the shared internal page hero. At the same viewport and root font settings, those computed title properties MUST match. Route-specific intro styles MUST NOT override that shared typography contract.

#### Scenario: Primary sections render at a wide viewport

- **WHEN** Artists, Releases, Store, Services, and About render at the same supported wide viewport
- **THEN** their level-one page titles expose matching computed title typography
- **AND** the Releases showcase intro and Services intro surface retain their route-specific composition.

#### Scenario: Primary sections render at a narrow viewport

- **WHEN** the five primary sections render at 390 or 320 CSS pixels wide
- **THEN** their level-one titles resolve through the same responsive title scale
- **AND** each title wraps within the viewport without horizontal page scrolling.

#### Scenario: App shell swaps a primary section

- **WHEN** the persistent app shell swaps any primary section into the current document
- **THEN** the swapped level-one title uses the same typography as its direct-load document
- **AND** the destination retains one level-one heading.

### Requirement: Shared page heroes omit repeated supporting labels

The shared internal page hero MUST normalize its supporting label and title by trimming outer whitespace, collapsing internal whitespace, and comparing without case sensitivity. When both normalized values match, it MUST omit the supporting label while retaining the title as the page's level-one heading. A distinct non-empty supporting label SHALL render unchanged.

#### Scenario: Shared hero receives equivalent label and title

- **WHEN** a shared hero receives a supporting label and title that differ only by case or whitespace
- **THEN** it renders no supporting-label badge
- **AND** it renders the title once as the level-one heading.

#### Scenario: Shared hero receives distinct identity text

- **WHEN** a shared hero receives a non-empty supporting label whose normalized value differs from its title
- **THEN** it renders the supporting label and level-one heading
- **AND** it preserves their authored text.

#### Scenario: Content-driven shared hero introduces a duplicate

- **WHEN** editorial content causes any current or future shared-hero caller to supply the same normalized supporting label and title
- **THEN** the rendered page remains available with its level-one heading
- **AND** the redundant supporting label is absent on direct and app-shell navigation.

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
- **AND** its patterned intro, explanatory copy, and inquiry action remain present.

#### Scenario: Visitor opens another primary section

- **WHEN** Artists, Releases, or About renders directly or through the persistent app shell
- **THEN** its supporting-label and level-one-title pair is respectively `Roster` / `Artists`, `Catalog` / `Releases`, or `About` / `The Label`
- **AND** the pair does not repeat the same normalized text.

### Requirement: Custom primary-section headers have regression protection

The repository SHALL keep focused automated coverage for every primary-section header that bypasses the shared internal page hero. The coverage MUST verify that each custom header uses the shared title typography and that its normalized supporting label differs from its level-one title.

#### Scenario: Custom Releases or Services identity regresses

- **WHEN** a change makes the Releases or Services custom header repeat its normalized supporting label as its level-one title or reintroduces a route-specific title scale
- **THEN** the focused unit contract fails before build acceptance.

#### Scenario: A new custom primary-section header is introduced

- **WHEN** a primary section stops using the shared internal page hero or adds another custom header path
- **THEN** that custom path is added to the focused identity contract
- **AND** the contract verifies distinct copy and shared title typography.

## MODIFIED Requirements

### Requirement: Primary navigation separates editorial releases from shopping

The site SHALL expose `Artists`, `Releases`, `Store`, `Services`, and `Who we are` as its visible primary sections in that exact order, with Store as the only current catalog-shopping section.

#### Scenario: Primary navigation renders

- **WHEN** the desktop header or mobile navigation renders
- **THEN** its visible section links are `Artists · Releases · Store · Services · Who we are` in that order
- **AND** Distro is not exposed as a primary section.

#### Scenario: Footer section navigation renders

- **WHEN** footer section links render
- **THEN** they use the same five-section order
- **AND** no Distro footer link recreates the retired standalone section.

#### Scenario: Visitor opens Releases

- **WHEN** the visitor opens Releases
- **THEN** the route remains the editorial BlackBox discography with Release detail and listening behavior
- **AND** Store Item purchase discovery remains under Store.

#### Scenario: Visitor opens Who we are

- **WHEN** the visitor directly loads or navigates to `/about/`
- **THEN** its public section label, browser page-title component and shell transition label are `Who we are`
- **AND** the active navigation link remains associated with `/about/`
- **AND** the existing The Label heading and editorial content remain unchanged.

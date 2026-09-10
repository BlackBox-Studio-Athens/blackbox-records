## ADDED Requirements

### Requirement: Artists search follows roster size

The Artists route SHALL derive search availability from the same server-rendered Artist collection used for the roster and SHALL expose search only when that collection contains at least six profiles.

#### Scenario: Roster contains at most five artists

- **WHEN** the Artists collection contains zero through five profiles
- **THEN** the route emits no Artists search outlet
- **AND** no reserved search space, portal, or filter mount exists
- **AND** every roster card remains server-rendered and visible

#### Scenario: Roster contains at least six artists

- **WHEN** the Artists collection contains six or more profiles
- **THEN** the route emits the existing Artists search outlet
- **AND** direct and shell-managed navigation retain the existing search behavior

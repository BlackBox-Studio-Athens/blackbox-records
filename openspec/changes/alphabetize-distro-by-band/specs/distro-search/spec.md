## MODIFIED Requirements

### Requirement: Distro filtering preserves document structure

The system MUST intersect Distro text, artist and physical-format filters without reordering, recreating, paginating or virtualizing cards. Promoted and alphabetical items SHALL obey the same filters, retain canonical order and use Grid whenever a filter is active.

#### Scenario: Search has matches

- **WHEN** one or more cards match all active filters
- **THEN** only those cards remain presented and reachable, in the server-authored promotion/band order
- **AND** promotion does not exempt an item from filtering.

#### Scenario: Search has no matches

- **WHEN** no cards match all active filters
- **THEN** one accessible zero-result status and empty state appear
- **AND** clearing remains available and results remain a valid focus target.

#### Scenario: Search is not active

- **WHEN** the component fails to load or JavaScript is disabled
- **THEN** no pre-hydration hiding or DOM mutation occurs and the complete mixed server catalog remains visible.

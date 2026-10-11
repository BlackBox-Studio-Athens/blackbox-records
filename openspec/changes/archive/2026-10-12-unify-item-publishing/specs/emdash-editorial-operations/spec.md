# Spec Delta

## ADDED Requirements

### Requirement: The editorial plugin stores price drafts

The `blackbox-editorial` EmDash plugin SHALL store at most one price draft per catalog record in its private plugin KV, exposed through an authenticated plugin route that requires the staff content-edit permission and EmDash's CSRF header. Writes SHALL use the previous draft revision for compare-and-set. A price draft SHALL NOT be Price Authority, SHALL NOT contain provider identifiers, and SHALL NOT enter content publication snapshots.

#### Scenario: Member saves a price draft

- **WHEN** a member saves a valid EUR price draft for a release or distro record with the current draft revision
- **THEN** the plugin stores it and returns its new revision
- **AND** the live price and public content are unchanged.

#### Scenario: Two members edit the same draft

- **WHEN** a save carries a draft revision that is no longer current
- **THEN** the route reports a conflict and keeps the stored draft.

#### Scenario: Record is deleted

- **WHEN** EmDash deletes a record that has a price draft
- **THEN** the plugin removes that draft.

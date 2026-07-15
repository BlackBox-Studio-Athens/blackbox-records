## ADDED Requirements

### Requirement: Store category terms are canonical

The system SHALL use `Store Category` for shopper-facing Store collection membership and SHALL keep it distinct from Store Item source ownership and physical type.

#### Scenario: Store collection membership is named

- **WHEN** specs, code, tests, docs, routes, or UI copy describe the Store collection choices
- **THEN** they use `All`, `BlackBox Releases`, `Distro`, and `Merch` as the exact public labels
- **AND** they use `Store Category` for the presentation concept.

#### Scenario: Distro category is named

- **WHEN** the shopper-facing category for distributed titles is referenced
- **THEN** it is named `Distro`
- **AND** it is not renamed `Distribution`, `Distributed Titles`, `Other Labels`, or `Catalog`.

#### Scenario: Store category and source ownership differ

- **GIVEN** a canonical Store Item's source kind, Release relation, or exact physical group contributes to category classification
- **WHEN** that item is described across domain boundaries
- **THEN** `StoreItemSourceKind` continues to name canonical source ownership
- **AND** `Store Category` names only its shopper-facing collection placement
- **AND** one canonical Store Item may have multiple Store Category memberships without gaining multiple commerce identities.

#### Scenario: All is referenced

- **WHEN** the complete Store collection is described
- **THEN** `All` means a view containing every canonical Store Item exactly once
- **AND** it is not described as a persisted category or source kind.

#### Scenario: Releases and BlackBox Releases are referenced

- **WHEN** editorial and shopping surfaces are distinguished
- **THEN** `Releases` names the editorial discography section
- **AND** `BlackBox Releases` names the Store category for sellable label-release items.

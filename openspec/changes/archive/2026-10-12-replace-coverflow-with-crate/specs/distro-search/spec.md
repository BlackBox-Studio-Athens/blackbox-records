## MODIFIED Requirements

### Requirement: Distro search reuses exact-first local matching

Store categories SHALL provide local search over their server-rendered canonical items using the existing exact-first matching behavior. Text matches SHALL intersect with the current artist and applicable Distro format selections.

#### Scenario: Visitor enters an exact substring

- **WHEN** a case-insensitive query matches a Store title, artist or label, exact group, or format
- **THEN** all substring matches are returned before fuzzy fallback is considered.

#### Scenario: Visitor enters a non-exact query

- **GIVEN** no category entry contains the normalized query
- **WHEN** the query is searched
- **THEN** the existing Fuse.js matcher may return fuzzy matches over the same fields
- **AND** no remote request or remote index is used.

#### Scenario: Visitor clears search

- **WHEN** the query becomes empty or the clear action is used
- **THEN** the remaining artist and format selections determine visible cards and groups in their original canonical order
- **AND** the result count and empty state update accessibly.

#### Scenario: Shopper clears all filters

- **WHEN** Clear filters is activated
- **THEN** the query, artist, and format selections return to their defaults and the complete Grid is restored
- **AND** no automatic Store Crate activation occurs.

# Spec Delta

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
- **AND** no automatic Coverflow activation occurs.

### Requirement: Distro search follows app-shell lifecycle

The shared Store browse control MUST exist only while a Store collection owns its active portal placeholder. Its module SHALL load only for relevant Store navigation intent or activation.

#### Scenario: Visitor expresses Distro navigation intent

- **WHEN** the shell prefetches or begins activation of a Store collection
- **THEN** it can begin loading the existing Store browse module in parallel with the route document
- **AND** the control does not mount or run until the target Store collection owns the active portal placeholder
- **AND** navigation intent for unrelated routes does not load that module.

#### Scenario: Distro route becomes active

- **WHEN** the shell finds the Store browse placeholder on an active Store collection
- **THEN** it mounts one route-lazy Store browse control without waiting for the document `load` event
- **AND** non-collection routes do not mount or run that control.

#### Scenario: Distro route exits or is cached

- **WHEN** the shell leaves the Store collection or captures its page snapshot
- **THEN** the control disconnects and the cached placeholder is empty
- **AND** no query, artist selection, hidden state, count, empty state, or pending disclosure leaks into the next visit.

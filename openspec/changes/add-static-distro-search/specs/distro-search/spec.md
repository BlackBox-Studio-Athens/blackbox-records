## ADDED Requirements

### Requirement: Distro search reuses exact-first local matching

The Distro route SHALL provide client-side search over its server-rendered catalog by reusing the existing Artists exact-first matcher and Fuse.js fallback.

#### Scenario: Visitor enters an exact substring

- **WHEN** a case-insensitive query matches a Distro title, `artist_or_label`, exact group, or format
- **THEN** all substring matches are returned before fuzzy fallback is considered

#### Scenario: Visitor enters a non-exact query

- **GIVEN** no Distro record contains the normalized query
- **WHEN** the query is searched
- **THEN** the existing Fuse.js matcher may return fuzzy matches over the same Distro fields
- **AND** no remote request or remote index is used

#### Scenario: Visitor clears search

- **WHEN** the query becomes empty or the clear action is used
- **THEN** every Distro card, chunk, and group returns to its original server-rendered state
- **AND** the result count and empty state update accessibly

### Requirement: Distro filtering preserves document structure

The system MUST filter Distro without reordering, recreating, paginating, or virtualizing catalog content.

#### Scenario: Search has matches

- **WHEN** a Distro query matches one or more records
- **THEN** unmatched cards are hidden
- **AND** chunks and groups with no visible cards are hidden
- **AND** matched cards retain their original group and item order

#### Scenario: Search has no matches

- **WHEN** no Distro record matches the query
- **THEN** the control exposes one visible accessible empty state and a zero-result count
- **AND** clearing remains available

#### Scenario: Search JavaScript is unavailable

- **WHEN** the search component fails to load or JavaScript is disabled
- **THEN** every server-rendered Distro card and group heading remains browsable

### Requirement: Distro search follows app-shell lifecycle

The Distro search control MUST exist only while the Distro route's portal placeholder is active.

#### Scenario: Distro route becomes active

- **WHEN** the shell finds the Distro search placeholder
- **THEN** it lazily loads and mounts the Distro-specific control
- **AND** unrelated routes do not load or run that control

#### Scenario: Distro route exits or is cached

- **WHEN** the shell leaves Distro or captures its page snapshot
- **THEN** the control disconnects and the cached placeholder is empty
- **AND** no query, hidden state, count, or empty state leaks into the next visit

### Requirement: Distro search remains within route budgets

The search enhancement MUST preserve the existing Distro runtime-performance gates without a new dependency or service.

#### Scenario: Search is performance-checked

- **WHEN** the final Distro route is measured with the existing fixed load and mobile-stress interaction profiles
- **THEN** Distro LCP remains no more than 2.5 seconds and CLS no more than 0.1
- **AND** search introduces no task of 50 milliseconds or longer

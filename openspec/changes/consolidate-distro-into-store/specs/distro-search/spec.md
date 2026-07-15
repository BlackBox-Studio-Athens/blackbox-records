## MODIFIED Requirements

### Requirement: Distro search reuses exact-first local matching

The Store Distro category SHALL provide client-side search over its server-rendered classified catalog by reusing the existing Artists exact-first matcher and Fuse.js fallback.

#### Scenario: Visitor enters an exact substring

- **WHEN** a case-insensitive query matches a Distro-category title, artist or label, exact group, or format
- **THEN** all substring matches are returned before fuzzy fallback is considered.

#### Scenario: Visitor enters a non-exact query

- **GIVEN** no Distro-category entry contains the normalized query
- **WHEN** the query is searched
- **THEN** the existing Fuse.js matcher may return fuzzy matches over the same fields
- **AND** no remote request or remote index is used.

#### Scenario: Visitor clears search

- **WHEN** the query becomes empty or the clear action is used
- **THEN** every Store Distro card, chunk, and group returns to its original server-rendered state
- **AND** the result count and empty state update accessibly.

### Requirement: Distro filtering preserves document structure

The system MUST filter Store Distro content without reordering, recreating, paginating, or virtualizing catalog content.

#### Scenario: Search has matches

- **WHEN** a Store Distro query matches one or more entries
- **THEN** unmatched cards are hidden
- **AND** chunks and groups with no visible cards are hidden
- **AND** matched cards retain their original group and item order.

#### Scenario: Search has no matches

- **WHEN** no Store Distro entry matches the query
- **THEN** the control exposes one visible accessible empty state and a zero-result count
- **AND** clearing remains available.

#### Scenario: Search is not active

- **WHEN** the search component fails to load or JavaScript is disabled
- **THEN** search adds no pre-hydration hidden state or DOM mutation
- **AND** the baseline server-rendered Distro-category catalog remains unchanged.

### Requirement: Distro search follows app-shell lifecycle

The Store Distro search control MUST exist only while `/store/distro/` owns the active portal placeholder.

#### Scenario: Store Distro category becomes active

- **WHEN** the shell finds the Store Distro search placeholder on `/store/distro/`
- **THEN** it lazily loads and mounts the Store-owned Distro search control
- **AND** unrelated Store categories and routes do not load or run that control.

#### Scenario: Store Distro category exits or is cached

- **WHEN** the shell leaves `/store/distro/` or captures its page snapshot
- **THEN** the control disconnects and the cached placeholder is empty
- **AND** no query, hidden state, count, or empty state leaks into the next visit.

### Requirement: Distro search remains within route budgets

The search enhancement MUST preserve the existing Store Distro runtime-performance gates without a new dependency or service.

#### Scenario: Search is performance-checked

- **WHEN** `/store/distro/` is measured with the existing fixed load and mobile-stress interaction profiles
- **THEN** LCP remains no more than 2.5 seconds and CLS no more than 0.1
- **AND** search introduces no task of 50 milliseconds or longer.

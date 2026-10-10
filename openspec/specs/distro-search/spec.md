# distro-search Specification

## Purpose

TBD - created by archiving change add-static-distro-search. Update Purpose after archive.

## Requirements

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

#### Scenario: All Store reuses the shared module

- **WHEN** the shell prefetches or activates `/store/`
- **THEN** it can load the same module and mounts an All-scoped control only at the active All placeholder
- **AND** that control does not apply Distro-only format navigation or grouped disclosure to the flat shelf.

#### Scenario: Distro is revisited after All search

- **WHEN** the shopper returns from a searched All shelf to Distro
- **THEN** Distro retains its existing exact-first matching, group/card order, clear behavior, format navigation, and fragment handling
- **AND** All query/filter state is absent.

### Requirement: Distro search remains within route budgets

The search enhancement MUST preserve the existing Store Distro runtime-performance gates without a new dependency or service.

#### Scenario: Search is performance-checked

- **WHEN** `/store/distro/` is measured with the existing fixed load and mobile-stress interaction profiles
- **THEN** LCP remains no more than 2.5 seconds and CLS no more than 0.1
- **AND** search introduces no task of 50 milliseconds or longer.

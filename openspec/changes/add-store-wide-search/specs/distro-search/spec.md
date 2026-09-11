## MODIFIED Requirements

### Requirement: Distro search follows app-shell lifecycle

The Store Distro search control MUST exist only while `/store/distro/` owns the active Distro portal placeholder. Its shared Store-owned route-lazy module SHALL also support the separate All Store control on `/store/`, with route-specific state and no control mounted on unrelated routes.

#### Scenario: Visitor expresses Distro navigation intent

- **WHEN** the shell prefetches or begins activation of `/store/distro/`
- **THEN** it may begin loading the shared Store search module in parallel with the route document
- **AND** the Distro control does not mount or run until `/store/distro/` owns the active Distro placeholder
- **AND** navigation intent for unrelated routes does not load that module.

#### Scenario: Distro route becomes active

- **WHEN** the shell finds the Store Distro search placeholder on `/store/distro/`
- **THEN** it mounts the route-lazy Store-owned Distro search control without waiting for the document `load` event
- **AND** other Store categories and routes do not mount or run that Distro-scoped control.

#### Scenario: Distro route exits or is cached

- **WHEN** the shell leaves `/store/distro/` or captures its page snapshot
- **THEN** the control disconnects and the cached placeholder is empty
- **AND** no query, hidden state, count, empty state, or pending disclosure leaks into the next visit.

#### Scenario: All Store reuses the shared module

- **WHEN** the shell prefetches or activates `/store/`
- **THEN** it can load the same module and mounts an All-scoped control only at the active All placeholder
- **AND** that control does not apply Distro-only format navigation or grouped disclosure to the flat shelf.

#### Scenario: Distro is revisited after All search

- **WHEN** the shopper returns from a searched All shelf to Distro
- **THEN** Distro retains its existing exact-first matching, group/card order, clear behavior, format navigation, and fragment handling
- **AND** All query/filter state is absent.

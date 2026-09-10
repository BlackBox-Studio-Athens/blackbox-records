## MODIFIED Requirements

### Requirement: Distro search follows app-shell lifecycle

The Store Distro search control MUST exist only while `/store/distro/` owns the active portal placeholder, while its route-lazy module MAY load earlier only in response to explicit Distro navigation intent or activation.

#### Scenario: Visitor expresses Distro navigation intent

- **WHEN** the shell prefetches or begins activation of `/store/distro/`
- **THEN** it may begin loading the Store-owned Distro search module in parallel with the route document
- **AND** the control does not mount or run until `/store/distro/` owns the active portal placeholder
- **AND** navigation intent for unrelated routes does not load that module.

#### Scenario: Distro route becomes active

- **WHEN** the shell finds the Store Distro search placeholder on `/store/distro/`
- **THEN** it mounts the route-lazy Store-owned Distro search control without waiting for the document `load` event
- **AND** unrelated Store categories and routes do not mount or run that control.

#### Scenario: Distro route exits or is cached

- **WHEN** the shell leaves `/store/distro/` or captures its page snapshot
- **THEN** the control disconnects and the cached placeholder is empty
- **AND** no query, hidden state, count, empty state, or pending disclosure leaks into the next visit.

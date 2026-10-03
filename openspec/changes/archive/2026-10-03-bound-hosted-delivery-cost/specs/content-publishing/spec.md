## ADDED Requirements

### Requirement: Hosted pages render accepted purchase information

Hosted public pages and islands SHALL render the purchase information of the accepted snapshot, not the repository's static copy.

#### Scenario: Purchase information is published

- **WHEN** a publication containing changed purchase information is accepted and becomes live
- **THEN** a fresh hosted page load renders the new purchase information on the server and in the islands that read it
- **AND** static output continues to render the repository copy it was built from.

#### Scenario: A web module the hosted build overrides moves

- **WHEN** a module the hosted build configuration replaces is moved or renamed in the web app
- **THEN** an automated check fails because the override no longer resolves to an existing module with the same exports
- **AND** hosted output never silently falls back to the static module.

#### Scenario: A page needs inline purchase information

- **WHEN** a build's browser reader needs the inline purchase-information data
- **THEN** that build emits it on the pages where that reader can hydrate
- **AND** builds whose islands bundle the data do not inline it.

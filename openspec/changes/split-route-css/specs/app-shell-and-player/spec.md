## ADDED Requirements

### Requirement: Shell navigation applies route styles before the swap

When a shell-managed navigation reaches a page whose stylesheets the document does not yet link, the shell SHALL link them and wait for each to load or fail before inserting the page. The wait SHALL be bounded and SHALL NOT block navigation. Stylesheets already linked SHALL add no wait.

#### Scenario: Route stylesheet loads before the swap

- **GIVEN** a direct load of a page that does not use Store collection CSS
- **WHEN** the shopper navigates through the shell to a Store collection
- **THEN** the Store collection stylesheet has loaded before the catalog is inserted
- **AND** the catalog shows no layout shift caused by styles arriving after insertion.

#### Scenario: Stylesheet is slow or fails

- **WHEN** a destination stylesheet has not loaded within 1,000 ms, or fails to load
- **THEN** the shell inserts the page anyway
- **AND** the persistent player, route loading indicator and Back history behave as for any other navigation.

#### Scenario: Stylesheet is already linked

- **WHEN** the shopper returns to a route whose stylesheets the document already links
- **THEN** the shell adds no stylesheet wait
- **AND** it never removes a stylesheet that an earlier route linked.

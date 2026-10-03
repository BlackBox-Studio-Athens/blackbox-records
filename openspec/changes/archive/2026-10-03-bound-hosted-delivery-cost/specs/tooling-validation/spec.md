## ADDED Requirements

### Requirement: Hosted public output passes the public performance gates

The hosted release build SHALL run the same eager-JavaScript and image-markup checks as the static public build, against its own output.

#### Scenario: The hosted public build completes

- **WHEN** the hosted renderer's public build produces `dist-public`
- **THEN** the bundle-graph check measures its client output against the public route budgets
- **AND** the image-markup check runs against its rendered or prerendered pages where the output allows it
- **AND** a failing check stops the hosted release before upload.

#### Scenario: Build options differ between server and client

- **WHEN** an option is needed only for the hosted server bundle, such as strict module execution order
- **THEN** it applies to the SSR build only
- **AND** the hosted client bundles carry no wrappers from it.

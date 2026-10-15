## MODIFIED Requirements

### Requirement: Browser surface history is shared by shell and Store

The web-platform module SHALL provide `lib/surface-history.ts` as the browser-only owner of the existing marked same-URL history primitives and page-local surface coordination. App-shell and web-store SHALL consume this public entrypoint without a Store dependency on app-shell internals.

#### Scenario: A Store surface participates in shell history

- **WHEN** Store Crate, Artists or full video needs a dismissible history entry
- **THEN** it uses the web-platform surface-history entrypoint
- **AND** the existing player helper API remains compatible.

## MODIFIED Requirements

### Requirement: Storefront catalog provides shell-mounted listing-price presentation

The system MUST keep Store listing-price presentation inside the closed `storefront-catalog` module while exposing its persistent app-shell integration through one provided entrypoint.

#### Scenario: App shell activates a Store collection

- **WHEN** the persistent app shell renders or replaces a Store collection document
- **THEN** it imports the documented Store listing-price presentation entrypoint from `storefront-catalog`
- **AND** it does not duplicate catalog DOM, Store Offer snapshot, or price-presentation logic inside the app-shell module.

#### Scenario: Boundary manifest is audited

- **WHEN** the listing-price presentation entrypoint and its Store collection placeholder contract are added
- **THEN** `module-boundaries.manifest.json` records the owning root, provided entrypoint, and allowed app-shell dependency
- **AND** boundary validation passes without an ownership exception or compatibility facade.

### Requirement: Public commerce HTTP uses the commerce reader entrypoint

The system MUST expose application-owned Store readers through the documented commerce reader entrypoint rather than private reader files.

#### Scenario: Public HTTP composes Store listing prices

- **WHEN** public commerce HTTP wires the Store listing-price reader
- **THEN** it imports the documented commerce reader entrypoint provided by `checkout-core`
- **AND** boundary validation passes without an ownership exception.

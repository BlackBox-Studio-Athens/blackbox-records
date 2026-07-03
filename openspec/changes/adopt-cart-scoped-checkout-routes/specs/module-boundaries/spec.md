## ADDED Requirements

### Requirement: Checkout web module owns cart-scoped checkout routes

The system MUST keep cart-scoped checkout pages inside the closed `checkout-web` module boundary.

#### Scenario: Cart-scoped checkout routes are added

- **WHEN** `/store/checkout/` and `/store/checkout/return/` route files are added
- **THEN** `openspec/specs/module-boundaries/module-boundaries.manifest.json` lists those route files under the `checkout-web` module roots or provided entrypoints
- **AND** item-scoped checkout compatibility routes remain owned by `checkout-web` until they are removed.

#### Scenario: Boundary validation runs

- **WHEN** cart-scoped checkout routes are implemented
- **THEN** module-boundary validation includes `pnpm audit:module-boundaries`
- **AND** dependency validation includes `pnpm depcruise:boundaries`.

## MODIFIED Requirements

### Requirement: Checkout smoke evidence is environment-scoped
The system MUST keep checkout smoke evidence scoped to the canonical Local, UAT, and PRD product environment model and MUST not let shared smoke harness consolidation blur provider authority boundaries.

#### Scenario: UAT checkout smoke evidence is produced
- **GIVEN** UAT checkout smoke runs through `smoke:stripe-sandbox`
- **WHEN** the smoke evidence is evaluated
- **THEN** UAT hosted Checkout, sandbox Stripe mode, sandbox Worker, sandbox D1, and GitHub Pages UAT URL remain part of the evidence boundary
- **AND** shared smoke harness helpers do not replace Store Offer, Stripe, D1, webhook, or order reconciliation assertions.

#### Scenario: Static smoke opens checkout shell
- **GIVEN** UAT static smoke opens a checkout shell route
- **WHEN** the route is visible and browser-safe
- **THEN** the result is static checkout-shell evidence only
- **AND** it is not accepted as hosted Checkout, paid-order, webhook, D1, Stripe catalog, or stock evidence.

#### Scenario: PRD smoke evidence is produced before go-live
- **GIVEN** PRD checkout and live provider mutation are still disabled
- **WHEN** promotion smoke runs
- **THEN** the evidence remains readiness, disabled, or `not_configured` evidence unless the explicit PRD-open and paid-smoke policy gates are satisfied.

## MODIFIED Requirements

### Requirement: Commerce validation MUST cover generated UAT catalog artifacts

The validation workflow SHALL include a deterministic check that the backend Product Projection manifest and sandbox UAT D1 seed match the current Astro Store Item catalog.

#### Scenario: Generated artifacts drift

- **GIVEN** Astro Store Item content changes
- **WHEN** `pnpm stripe:catalog:artifacts:check` runs before regenerating artifacts
- **THEN** the command fails and identifies generated artifact drift.

### Requirement: Sandbox UAT proof MUST follow reset, seed, apply, and smoke sequence

The sandbox UAT proof sequence SHALL verify webhook readiness, catalog readiness, reset/apply behavior, sandbox D1 seed application, backend deployment, and GitHub Pages hosted checkout smoke without committing secrets or full provider IDs.

#### Scenario: Full UAT catalog proof is run

- **GIVEN** Stripe sandbox credentials, the sandbox Worker, and the GitHub Pages UAT storefront are available
- **WHEN** the operator follows the documented UAT sequence
- **THEN** catalog reset dry-run runs before confirmed mutation
- **AND** D1 seed runs before catalog apply
- **AND** catalog verification passes after apply
- **AND** checkout smoke covers `checkout_surface` and `happy_path_paid`
- **AND** evidence remains redacted and contains no secrets.

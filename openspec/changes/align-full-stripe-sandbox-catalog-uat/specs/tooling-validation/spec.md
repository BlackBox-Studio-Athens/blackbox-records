## MODIFIED Requirements

### Requirement: Commerce validation MUST cover generated UAT catalog artifacts

The validation workflow SHALL include a deterministic check that the backend Product Projection manifest and sandbox UAT D1 seed match the current Astro Store Item catalog.

#### Scenario: Generated artifacts drift

- **GIVEN** Astro Store Item content changes
- **WHEN** `pnpm stripe:catalog:artifacts:check` runs before regenerating artifacts
- **THEN** the command fails and identifies generated artifact drift.

### Requirement: Sandbox UAT proof MUST follow reset, seed, apply, and smoke sequence

The sandbox UAT proof sequence SHALL verify webhook readiness, catalog readiness, reset/apply behavior, sandbox D1 seed application, backend deployment, and GitHub Pages hosted checkout smoke without committing secrets or full provider IDs. A pushed repo commit alone SHALL NOT be accepted as proof that Stripe sandbox catalog objects, D1 checkout readiness, or Store Offer snapshots have been updated.

#### Scenario: Full UAT catalog proof is run

- **GIVEN** Stripe sandbox credentials, the sandbox Worker, and the GitHub Pages UAT storefront are available
- **WHEN** the operator follows the documented UAT sequence
- **THEN** catalog reset dry-run runs before confirmed mutation
- **AND** D1 seed runs before catalog apply
- **AND** catalog verification passes after apply
- **AND** checkout smoke covers `checkout_surface` and `happy_path_paid`
- **AND** evidence remains redacted and contains no secrets.

#### Scenario: Provider execution lessons are enforced

- **GIVEN** full sandbox catalog alignment is being accepted after an end-to-end provider run
- **WHEN** an operator reviews the proof
- **THEN** CLI catalog verification and smoke evidence are authoritative over Stripe Dashboard row counts
- **AND** legacy BlackBox sandbox Product cleanup is considered only through current ownership metadata, lookup keys, or documented catalog-derived legacy names
- **AND** webhook endpoint verification is treated as endpoint configuration proof, while paid smoke is treated as signing-secret and paid-order proof
- **AND** the sandbox Worker is redeployed from the final pushed commit after any live-run script or runtime fixes
- **AND** low-stock smoke uses `afterglow-tape` only when low-stock behavior is the behavior under test.

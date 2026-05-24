## MODIFIED Requirements

### Requirement: Catalog validation tooling MUST track renamed identities

Generated catalog artifacts, sandbox UAT seed SQL, local mock seed SQL, Stripe reset/apply tooling, and smoke fixtures MUST use current Astro content identities and MUST NOT preserve stale compatibility identities after content is renamed.

#### Scenario: Sandbox seed removes stale renamed rows

- **GIVEN** the previous sandbox seed used `mass-culture-lp` and `variant_mass-culture-lp_standard` for Barren Point
- **WHEN** the sandbox UAT catalog seed is applied after the rename
- **THEN** stale rows for `mass-culture-lp` and `variant_mass-culture-lp_standard` are removed from checkout readiness and Store Offer snapshot tables
- **AND** `variant_barren-point_standard` belongs to the Barren Point distro Store Item.

#### Scenario: Smoke defaults use Disintegration's own variant

- **GIVEN** the default sandbox smoke item is Disintegration
- **WHEN** the smoke scripts create or verify checkout state
- **THEN** they use `variant_disintegration-black-vinyl-lp_standard`
- **AND** they do not use `variant_barren-point_standard` for Disintegration.

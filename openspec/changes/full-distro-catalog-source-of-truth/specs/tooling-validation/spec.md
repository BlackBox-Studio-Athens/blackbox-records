## ADDED Requirements

### Requirement: Full distro catalog implementation has source validation

The system SHALL validate that implemented distro catalog artifacts match the Distro Inventory Source and approved Current-Site Extras.

#### Scenario: Catalog source validation runs

- **WHEN** full distro catalog implementation is complete
- **THEN** validation proves every non-duplicate Distro Inventory Source row is represented in generated catalog artifacts
- **AND** validation proves `S/T - Spinners` and `Three Way Plane - Wreckquiem` are represented as Current-Site Extras
- **AND** validation proves unapproved existing distro content absent from the source is absent from generated current catalog artifacts and checkout eligibility.

#### Scenario: Pricing validation runs

- **WHEN** full distro catalog validation runs
- **THEN** numeric source prices, `ΕΣ` pay-what-you-want prices, blank-price defaults, and Current-Site Extra defaults are checked against generated Desired Catalog State
- **AND** validation fails on missing, mismatched, or ambiguous price policy.

### Requirement: OpenSpec-only planning slice validation is limited

The system SHALL keep this planning slice limited to OpenSpec/document validation.

#### Scenario: Planning slice is complete

- **WHEN** this OpenSpec-only change is prepared
- **THEN** `pnpm openspec:guard` passes
- **AND** `pnpm openspec -- validate full-distro-catalog-source-of-truth --type change --strict` passes
- **AND** `pnpm openspec -- validate --all --strict` passes
- **AND** no formatter write mode, catalog artifact generation, distro content edit, artwork generation, Stripe mutation, D1 mutation, or provider script is required.

### Requirement: Full implementation validation includes repository and provider gates

The system SHALL require normal repository gates and UAT proof before full distro catalog implementation is accepted.

#### Scenario: Implementation tree is complete

- **WHEN** later implementation changes behavior
- **THEN** `pnpm test:unit`, `pnpm check`, `pnpm build`, `pnpm openspec -- validate --all --strict`, and focused catalog/custom-price tests pass before completion is claimed.

#### Scenario: Artwork tooling is used

- **WHEN** later implementation uses `tools/artwork-fetcher` to fetch or generate distro artwork
- **THEN** `cd tools/artwork-fetcher; python -m unittest discover tests` passes
- **AND** any generated evidence or fetch logs remain ignored or redacted unless intentionally committed as source assets.

#### Scenario: UAT provider proof runs

- **WHEN** later implementation is ready for UAT provider proof
- **THEN** UAT catalog verification dry-run, UAT D1 catalog seed, UAT catalog apply, UAT post-verify, Worker deploy, and hosted UAT smoke pass
- **AND** pay-what-you-want checkout is included in representative smoke or manual acceptance evidence.

#### Scenario: PRD readiness is checked

- **WHEN** later implementation is considered for PRD
- **THEN** PRD readiness is validated without PRD reset
- **AND** live provider mutation is blocked until explicit PRD-open approval exists.

## ADDED Requirements

### Requirement: Product Environment CLI targets are preferred

Repository-owned CLI tools SHALL prefer Product Environment targets for environment selection.

#### Scenario: CLI help is printed

- **WHEN** a repository-owned command prints usage for an environment target
- **THEN** the primary usage lists `local`, `uat`, and `prd`
- **AND** any accepted `sandbox` or `production` input is documented only as a legacy platform alias.

#### Scenario: CLI report is printed

- **WHEN** runtime config, catalog verification, smoke, or environment-model validation prints an environment report
- **THEN** the report identifies the Product Environment first as `LOCAL`, `UAT`, or `PRD`
- **AND** provider/platform details appear only as mapped traits.

### Requirement: Environment alias drift is validated

Environment validation SHALL detect code and script drift that reintroduces raw platform/provider aliases as product environment choices.

#### Scenario: Raw alias branch is scanned

- **WHEN** environment validation scans backend code, scripts, tests, workflows, and OpenSpec artifacts
- **THEN** branches that compare Product Environment, runtime environment, or Worker binding values to `sandbox`, `production`, `test`, or `live` fail validation outside approved boundary adapters.

#### Scenario: Boundary adapter is scanned

- **WHEN** environment validation scans an approved platform/provider boundary adapter
- **THEN** `sandbox`, `production`, `test`, `live`, `mock`, or `uat-sink` may appear only when the adapter maps the value to or from `LOCAL`, `UAT`, or `PRD`.

### Requirement: Standard gates cover environment model migration

The standard repository gates MUST cover the Product Environment migration.

#### Scenario: Migration implementation is complete

- **WHEN** the Product Environment model migration is implemented
- **THEN** focused tests cover canonical parsing, legacy alias normalization, profile mapping, runtime binding reads, CLI usage output, and drift validation
- **AND** `pnpm test:unit`, `pnpm check`, and `pnpm build` pass.

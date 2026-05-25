## Purpose

Specify repository validation gates, local tooling, dependency-audit posture, and OpenSpec workflow ownership.

## Requirements

### Requirement: Standard repository gates

The system SHALL run the standard repository gates after behavior-changing implementation.

#### Scenario: Behavior changes

- **GIVEN** code changes affect runtime behavior, tests, build output, scripts, or workflows
- **WHEN** implementation is complete
- **THEN** `pnpm test:unit`, `pnpm check`, and `pnpm build` must pass before completion is claimed.

### Requirement: Asset QA is read-only

The system SHALL keep Sharp-backed asset QA as a read-only validation command.

#### Scenario: Asset check runs

- **GIVEN** `pnpm assets:check` runs
- **WHEN** it inspects public assets and content-referenced images
- **THEN** it reports metadata diagnostics without mutating image files, content paths, public URLs, or Astro image handling.

### Requirement: Slug tooling preserves public identities

The system MUST centralize repo-authored slug generation and validation while preserving existing public identities unless explicitly approved.

#### Scenario: Store item slug fallback is needed

- **GIVEN** an invalid draft or file identifier needs a fallback slug
- **WHEN** the slug helper generates the fallback
- **THEN** it uses the repo-owned slug wrapper and does not silently rewrite existing public slugs, aliases, D1 mappings, Stripe mappings, or `StoreItem` identities.

### Requirement: Runtime validation standard

The system SHALL use Zod for repo-authored runtime input validation and OpenAPI contract schemas. The system SHALL use `@t3-oss/env-core` only for local/process environment contracts in Node scripts, launchers, and preflight checks where values come from `process.env`, `.env`, `.dev.vars`, or equivalent ignored local files.

#### Scenario: New validation code is added

- **GIVEN** repo-authored runtime input or contract validation is needed
- **WHEN** a schema is introduced
- **THEN** it uses Zod unless an explicit OpenSpec change approves another validation library
- **AND** any `@t3-oss/env-core` usage remains backed by Zod-compatible schemas and does not store, sync, print, or rotate secrets.

### Requirement: Environment matrix validation

The system SHALL provide validation that detects drift from the canonical Local, UAT, and PRD product environment model.

#### Scenario: Deployment workflows are checked

- **WHEN** environment validation runs
- **THEN** it verifies GitHub Pages is the UAT static deployment path
- **AND** Cloudflare Pages is the PRD static deployment path
- **AND** no workflow introduces an additional shopper-facing static environment
- **AND** any branch, preview, or diagnostic deployment is reported as non-product and excluded from UAT/PRD evidence.

#### Scenario: Frontend and Worker origins are checked

- **WHEN** environment validation runs
- **THEN** it verifies UAT static builds call the UAT Worker/API
- **AND** PRD static builds call the PRD Worker/API
- **AND** `CHECKOUT_RETURN_ORIGINS` and browser CORS origins do not contain broad cross-environment or preview allowlists.

#### Scenario: PRD disabled state is checked

- **WHEN** environment validation runs before production readiness is opened
- **THEN** it verifies PRD checkout and live provider mutation fail closed
- **AND** it reports any workflow, script, or feature gate that could enable live checkout or live provider mutation without the explicit PRD-open gate.

### Requirement: Knip audit is report-first

The system SHALL keep unused dependency/export/file auditing report-first until findings are owner-reviewed.

#### Scenario: Unused audit reports a finding

- **GIVEN** `pnpm audit:unused` reports a route, content entry, generated file, migration, workflow, package export, or public asset
- **WHEN** cleanup is considered
- **THEN** deletion waits for owner review and does not become an automatic `pnpm check` failure by default.

### Requirement: OpenSpec workflow is exclusive

The system MUST use OpenSpec as the only spec and context workflow in this repository.

#### Scenario: New work is planned

- **GIVEN** a future feature, refactor, or workflow change needs planning
- **WHEN** it is captured as source of truth
- **THEN** it is written as an OpenSpec baseline spec update or active change under `openspec/`
- **AND** legacy planning commands, directories, and phase artifacts are not reintroduced.

## MODIFIED Requirements

### Requirement: Workflow terms

The system SHALL treat OpenSpec as the source of truth for current plans, baseline requirements, active changes, validation evidence, deferred gates, and approved refactor portfolios.

#### Scenario: New decision changes domain language

- **GIVEN** a task introduces or changes a domain term
- **WHEN** the term affects specs, tests, route names, UI copy, ADRs, or handoff notes
- **THEN** the relevant OpenSpec baseline spec or active change is updated in the same work.

#### Scenario: Refactor portfolio is named

- **WHEN** specs, tasks, docs, tests, or closeout notes describe grouped simplification work
- **THEN** they use Refactor Portfolio for an approved set of targeted behavior-preserving refactor candidates
- **AND** they do not use Refactor Portfolio for unbounded cleanup, style-only churn, or unrelated rewrites.

### Requirement: Environment terms

The system SHALL use canonical environment terminology across specs, docs, workflows, tests, validation output, handoff notes, and code-facing policy names. Product Environment is the only app-wide environment identity. Product Environment Profile is the typed implementation profile derived from Product Environment; it is not a new environment term.

#### Scenario: Product Environment is named

- **WHEN** a user-facing or maintainer-facing artifact describes where the product runs
- **THEN** it uses Local, UAT, or PRD
- **AND** it does not use `sandbox`, `production`, `test`, `live`, GitHub Actions environment names, or Wrangler environment names as product environment substitutes.

#### Scenario: Platform Environment is named

- **WHEN** an artifact describes a GitHub Actions environment, Wrangler environment, Cloudflare Pages project, Worker runtime target, Stripe mode, or secret store
- **THEN** it labels that concept as a platform/provider/configuration layer
- **AND** it maps the concept back to Local, UAT, or PRD.

#### Scenario: Product Environment Profile is named

- **WHEN** specs, tests, code, validation output, or handoff notes describe environment-derived policy in implementation
- **THEN** they use Product Environment Profile for the typed profile derived from Local, UAT, or PRD
- **AND** they do not introduce separate profile names for email, checkout, provider, or smoke policy unless those names describe fields owned by the Product Environment Profile.

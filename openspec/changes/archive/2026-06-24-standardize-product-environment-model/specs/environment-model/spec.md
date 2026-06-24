## ADDED Requirements

### Requirement: Canonical Product Environment runtime contract

The system MUST use `LOCAL`, `UAT`, and `PRD` as the only canonical Product Environment values in repository-owned runtime config, code-level schemas, profile maps, validation output, and tests.

#### Scenario: Backend runtime reads Product Environment

- **WHEN** backend runtime code resolves environment policy from Worker bindings
- **THEN** it reads a canonical Product Environment value of `LOCAL`, `UAT`, or `PRD`
- **AND** it does not treat `sandbox`, `production`, `mock`, `test`, `live`, `direct`, or `uat-sink` as Product Environment values.

#### Scenario: Product Environment type is used

- **WHEN** TypeScript code references the Product Environment type
- **THEN** the type is the string union `ProductEnvironment = 'LOCAL' | 'UAT' | 'PRD'`
- **AND** separate display-label types are not required to express the same three environments.

### Requirement: Product Environment profile owns platform mapping

The system SHALL derive platform, provider, and policy traits from one Product Environment profile table.

#### Scenario: UAT profile is resolved

- **WHEN** the system resolves the `UAT` Product Environment profile
- **THEN** the profile maps to the UAT static host, the sandbox Worker resource or deployment target, sandbox D1, Stripe test mode, UAT email sink policy, UAT-scoped secrets, and UAT validation gates.

#### Scenario: PRD profile is resolved

- **WHEN** the system resolves the `PRD` Product Environment profile
- **THEN** the profile maps to the PRD static host, the production Worker resource or deployment target, production D1, Stripe live mode, direct email policy, PRD-scoped secrets, and PRD-disabled checkout/provider-mutation policy until the PRD-open gate exists.

#### Scenario: LOCAL profile is resolved

- **WHEN** the system resolves the `LOCAL` Product Environment profile
- **THEN** the profile maps to local static hosting, local Worker state, local D1, local mock checkout defaults, and local-only validation gates.
- **AND** local modes such as `mock`, `mock-api`, and `uat-connected` remain modes under `LOCAL`, not additional Product Environments.

### Requirement: Platform aliases are boundary-only

The system MUST confine legacy platform aliases to explicitly named boundary adapters and parser compatibility functions.

#### Scenario: Legacy alias is parsed

- **WHEN** a compatibility parser receives `sandbox` or `production`
- **THEN** it normalizes the value to `UAT` or `PRD`
- **AND** downstream domain, application, and validation logic receives the canonical Product Environment value.

#### Scenario: Raw alias branch is introduced

- **WHEN** new repository code branches directly on `sandbox`, `production`, `test`, or `live` as if it were choosing a Product Environment
- **THEN** environment-model validation fails unless the code is in a documented platform/provider adapter that maps the alias back to `LOCAL`, `UAT`, or `PRD`.

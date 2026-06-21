## ADDED Requirements

### Requirement: Product Environment code values are canonical

The system SHALL use uppercase Product Environment values in code/config contracts and Local, UAT, and PRD prose labels in human-readable text.

#### Scenario: Code or config names a Product Environment

- **WHEN** TypeScript types, Zod schemas, Worker bindings, tests, generated evidence, or validation reports name a Product Environment value
- **THEN** they use `LOCAL`, `UAT`, or `PRD`.

#### Scenario: Documentation describes a Product Environment

- **WHEN** docs, OpenSpec prose, operator instructions, or UI-adjacent copy describe where the product runs
- **THEN** they use Local, UAT, or PRD as prose labels
- **AND** they may show the code value in backticks when precision is needed.

### Requirement: Environment-adjacent terms are classified

The system MUST classify environment-adjacent terms by layer whenever they appear near Product Environment language.

#### Scenario: Provider term appears near Product Environment text

- **WHEN** `mock`, `test`, `live`, `direct`, or `uat-sink` appears in specs, docs, tests, reports, or code comments
- **THEN** it is identified as a provider mode, email delivery policy, or local mode
- **AND** it is mapped back to `LOCAL`, `UAT`, or `PRD` when the surrounding text discusses product behavior.

#### Scenario: Platform term appears near Product Environment text

- **WHEN** `sandbox`, `production`, Wrangler environment names, GitHub Actions environment names, Worker names, or secret-store names appear in specs, docs, tests, reports, or code comments
- **THEN** they are identified as platform, deployment, credential, provider, or resource names
- **AND** they are not used as substitutes for Local, UAT, or PRD.

## ADDED Requirements

### Requirement: Static deployment triggers follow artifact relevance

The system MUST omit the shared UAT/PRD static deployment workflow for a `main` push only when every changed path belongs to an explicit, audited set of repository-only documentation paths. Trigger decisions MUST use changed paths rather than commit-message semantics, and any unrecognized or deploy-relevant path MUST fail open by running the workflow.

#### Scenario: Repository-only documentation is pushed

- **GIVEN** every changed path in a `main` push matches the audited repository-only documentation set
- **WHEN** GitHub evaluates the shared static deployment workflow trigger
- **THEN** no shared UAT/PRD static deployment workflow run is created for that push
- **AND** neither UAT nor PRD is redeployed
- **AND** the downstream UAT provider smoke workflow does not start for that push.

#### Scenario: Push contains a deploy-relevant or unknown path

- **GIVEN** at least one changed path does not match the audited repository-only documentation set
- **WHEN** the push reaches `main`
- **THEN** the shared static deployment workflow runs with its existing verification, build, and deploy gates
- **AND** mixed documentation/code pushes are not skipped.

#### Scenario: Deployable Markdown changes

- **WHEN** Markdown under an Astro content collection or another build input changes
- **THEN** the path does not match a broad Markdown exclusion
- **AND** the shared static deployment workflow runs.

#### Scenario: Commit type disagrees with changed paths

- **WHEN** a `docs(...)` commit changes a deploy-relevant path, or another commit type changes only audited repository documentation
- **THEN** changed paths alone determine whether the workflow runs
- **AND** the workflow does not inspect the Conventional Commit type or a commit-message skip token for this policy.

#### Scenario: Operator forces a static deployment

- **WHEN** an operator starts the shared workflow through `workflow_dispatch`
- **THEN** the workflow runs independently of push path filters
- **AND** the existing UAT and PRD verification, build, and deploy gates remain required.

#### Scenario: Trigger policy validation runs

- **WHEN** repository environment-model validation checks the shared static deployment workflow
- **THEN** it requires the audited repository-only path exclusions and preserved manual dispatch
- **AND** it rejects broad Markdown exclusion or commit-message coupling.

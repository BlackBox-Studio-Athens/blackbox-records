# Spec Delta

## ADDED Requirements

### Requirement: Optional manual Actions rehearsal is documented

The project SHALL document how a maintainer can use the official act executable on demand against the existing release workflow, with an explicit Docker endpoint, Ubuntu image, job and matrix selection. Ordinary local development commands SHALL remain unchanged. This capability SHALL require no custom project runner or workflow modification.

#### Scenario: A maintainer prepares a future rehearsal

- **WHEN** the maintainer consults the local Actions guidance
- **THEN** it supplies installation prerequisites, native list/dry-run/execution examples and supported validation/browser selections.

### Requirement: Manual rehearsal limits are explicit

The guidance SHALL retain the existing maintainer-grant policy and explain stock act's resource, timeout, browser and artifact compatibility limitations. Local rehearsal SHALL NOT establish hosted release acceptance.

#### Scenario: A maintainer considers local evidence

- **WHEN** a workflow is rehearsed locally
- **THEN** the guidance identifies where to keep logs and distinguishes the observed local result from GitHub release acceptance.

#### Scenario: The pinned artifact action is incompatible

- **WHEN** the tested act baseline rejects the pinned upload action's protocol
- **THEN** the limitation is documented without changing the hosted action or introducing a custom compatibility implementation.

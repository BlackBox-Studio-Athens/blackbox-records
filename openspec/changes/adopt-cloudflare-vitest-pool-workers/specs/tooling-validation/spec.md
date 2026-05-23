## ADDED Requirements

### Requirement: Focused Workers-pool tests

The system SHALL use Cloudflare Workers-pool Vitest only for backend tests that need Worker runtime semantics.

#### Scenario: Runtime-specific test is added

- **GIVEN** a backend behavior depends on Worker request handling, bindings, D1, or Cloudflare APIs
- **WHEN** a test is added
- **THEN** it may run through the Workers-pool command with local-only bindings and no real secrets.

### Requirement: Node test loop remains fast

The system MUST keep pure domain, application, value-object, and script tests on the current fast Vitest path unless Worker semantics are required.

#### Scenario: Pure use-case test is updated

- **GIVEN** a test exercises no Worker runtime behavior
- **WHEN** it is changed
- **THEN** it remains in the normal backend/unit test path.

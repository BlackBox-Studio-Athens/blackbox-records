## ADDED Requirements

### Requirement: Backend Workers-pool tests are default

The system SHALL use Cloudflare Workers-pool Vitest as the default backend test path so backend confidence comes from Cloudflare Worker runtime semantics.

#### Scenario: Backend test is added

- **GIVEN** a backend behavior exercises HTTP routes, environment bindings, D1/Prisma persistence, checkout, webhooks, internal stock APIs, or Cloudflare platform APIs
- **WHEN** a test is added
- **THEN** it runs through the Workers-pool backend test command with local-only bindings and no real secrets unless it cannot execute in the Workers runtime.

### Requirement: Node backend tests are fallback-only

The system MUST keep Node Vitest as a backend fallback only for tests that cannot execute in the Workers runtime.

#### Scenario: Node-only backend test is added

- **GIVEN** a backend test covers a local script, generator, process-orchestration utility, or another Node-only behavior
- **WHEN** it cannot run through Workers-pool
- **THEN** it may run through the explicit Node fallback command and must not be treated as the default backend confidence path.

### Requirement: Runtime confidence is prioritized over speed

The system MUST accept slower backend tests when the slower path provides higher confidence in deployed Worker behavior.

#### Scenario: Faster Node test would miss runtime behavior

- **GIVEN** a backend behavior can be tested quickly in Node or more accurately in Workers-pool
- **WHEN** the behavior can execute in the Workers runtime
- **THEN** the Workers-pool test path is preferred even if it is slower.

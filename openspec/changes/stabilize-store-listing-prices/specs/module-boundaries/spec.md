## MODIFIED Requirements

### Requirement: Boundary manifest authority

The system MUST keep module ownership, entrypoints, allowed dependencies, statuses, and exceptions in the OpenSpec module-boundary manifest.

#### Scenario: Scheduled catalog verification is retired

- **GIVEN** Store Listing Price recovery no longer uses a scheduled Worker handler
- **WHEN** boundary validation runs
- **THEN** `public-commerce-http` does not own a scheduled interface root
- **AND** the retired catalog verification handler is not a provided entrypoint.

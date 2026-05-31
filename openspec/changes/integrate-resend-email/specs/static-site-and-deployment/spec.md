## ADDED Requirements

### Requirement: Static newsletter form uses Worker API

The system MUST route static newsletter signup behavior through the Worker API boundary.

#### Scenario: Newsletter form submits

- **GIVEN** the static Astro frontend renders a newsletter signup form
- **WHEN** a shopper submits a valid signup
- **THEN** browser code posts to the configured Worker API route
- **AND** Astro SSR, Pages Functions, and public Resend credentials are not used.

#### Scenario: Newsletter API is unavailable

- **GIVEN** the Worker newsletter endpoint is unavailable or returns an error
- **WHEN** the static frontend handles the response
- **THEN** it shows a browser-safe failure state without provider diagnostics or secrets.

## ADDED Requirements

### Requirement: Staff frontend artifact is independent

The system SHALL build the protected staff portal as an independent static frontend artifact and SHALL exclude operator route documents from public frontend artifacts.

#### Scenario: Public frontend artifacts are built

- **WHEN** the UAT or PRD public Astro application builds
- **THEN** its artifact contains no `/stock/` route document
- **AND** it contains no staff-only browser API or page entrypoint.

#### Scenario: Staff frontend artifact is built

- **WHEN** the staff Astro application builds
- **THEN** its artifact contains `/stock/`, the staff root redirect, required assets, and deployment policy files
- **AND** it contains no shopper, checkout, editorial `/admin/`, or public app-shell route document.

### Requirement: Staff frontend uses a dedicated PRD Pages project

The system SHALL deploy the staff static artifact only to the `blackbox-records-staff` Cloudflare Pages project as a PRD staff surface.

#### Scenario: Staff deployment runs

- **WHEN** repository gates and the staff static build succeed for a commit
- **THEN** deployment uploads only `apps/staff/dist` to the `blackbox-records-staff` production target
- **AND** it does not replace or mutate the `blackbox-records-web` artifact or GitHub Pages UAT deployment.

#### Scenario: Staff deployment artifact is handed off

- **WHEN** CI prepares a staff deployment
- **THEN** the deploy job consumes the verified staff artifact produced for the same commit
- **AND** Cloudflare deployment credentials remain unavailable to build and test jobs.

### Requirement: Staff frontend remains static and Worker-backed

The staff frontend SHALL remain a static Astro application and SHALL use the existing Worker boundary for internal stock operations.

#### Scenario: Staff browser requests stock data

- **WHEN** the protected `/stock/` page reads or mutates stock
- **THEN** it calls same-origin `/api/internal/*`
- **AND** no Pages Function, Astro server runtime, browser secret, or duplicate stock implementation handles the operation.

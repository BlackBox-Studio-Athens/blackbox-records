## MODIFIED Requirements

### Requirement: Public frontend hosting uses separate Cloudflare Pages projects

The system SHALL serve the renderer's client assets and public gateway with separate Cloudflare Pages projects as the UAT and PRD hosts.

#### Scenario: Shared workflow deploys the UAT frontend to Cloudflare Pages

- **GIVEN** a push whose checks and UAT build passed
- **WHEN** the UAT deploy job runs
- **THEN** the repository checks have already run `pnpm validate:checks`, and the end-to-end build runs the bundle budgets in the same push run before the candidate can be promoted
- **AND** it uploads only the prebuilt renderer client directory with its gateway and browser-safe UAT build variables
- **AND** the deployed site calls the UAT Worker/API.

#### Scenario: Shared workflow deploys the PRD frontend to Cloudflare Pages

- **GIVEN** an explicit Software Release promotion proved the source UAT serves
- **WHEN** the promotion job builds PRD from that SHA
- **THEN** it uploads only the prebuilt renderer client directory with its gateway and browser-safe PRD build variables for the Pages production `main` target
- **AND** the PRD site may deploy as a readiness surface
- **AND** PRD checkout and live provider mutation remain disabled until an explicit production-readiness gate opens them.

#### Scenario: Manual workflow deploys the PRD Holding Page

- **GIVEN** the separate holding workflow is started manually with its deploy input enabled
- **WHEN** its repository gates and PRD-shaped static build succeed
- **THEN** it derives and uploads only `apps/web/dist-holding` for the protected Pages `holding` branch deploy job
- **AND** it does not invoke the release or promotion workflows or mutate either existing deployment.

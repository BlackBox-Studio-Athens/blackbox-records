## MODIFIED Requirements

### Requirement: Canonical product environments

The system SHALL expose exactly three product environments in operator-facing docs, workflows, validation output, OpenSpec language, and product-policy implementation: Local, UAT, and PRD.

#### Scenario: Environment matrix is presented

- **WHEN** a maintainer reads setup, deployment, promotion, or validation docs
- **THEN** the docs identify Local, UAT, and PRD as the product environments
- **AND** any platform-specific names are shown only as mapped implementation details.

#### Scenario: New environment wording is introduced

- **WHEN** a future change introduces `sandbox`, `production`, `test`, `live`, `GitHub Actions environment`, `Wrangler environment`, or `Stripe mode` wording
- **THEN** the change MUST classify that wording under the product environment mapping instead of treating it as a fourth product environment.

#### Scenario: Preview or branch deployment is introduced

- **WHEN** a workflow, host, or script creates a preview, branch, pull-request, or diagnostic deployment
- **THEN** that deployment MUST be classified as a non-product diagnostic surface unless it is the explicitly approved `holding` branch deployment
- **AND** the `holding` exception MUST be classified as the PRD Holding Page deployment surface within PRD, not as another Product Environment
- **AND** neither the holding exception nor any other branch deployment may be used as UAT acceptance, full-site PRD readiness, Promotion Evidence, or shopper-facing commerce proof.

#### Scenario: Application code needs environment policy

- **WHEN** code outside a boundary adapter needs environment-specific product policy
- **THEN** it uses Product Environment or Product Environment Profile
- **AND** it does not branch on raw platform/provider strings such as `sandbox`, `production`, `test`, or `live`.

## ADDED Requirements

### Requirement: PRD Holding Page is a temporary PRD deployment surface

The system SHALL classify the PRD Holding Page as a temporary public deployment surface within PRD, not as a fourth Product Environment and not as a replacement for UAT or the full PRD readiness site.

#### Scenario: Environment matrix includes the holding state

- **WHEN** environment documentation describes prelaunch public hosting
- **THEN** the PRD Holding Page maps to the `holding` branch of the existing Cloudflare Pages project
- **AND** GitHub Pages remains UAT
- **AND** the Pages production `main` deployment remains the full disabled PRD readiness surface.

#### Scenario: Colleagues review the final visible site

- **WHEN** non-technical colleagues need to review design and content before launch
- **THEN** they use the existing UAT review URL
- **AND** the documented visible launch differences are limited to the final hostname, removal of the UAT-only Review Site Marker or another explicitly documented review cue, production-only metadata/configuration, and explicitly gated provider behavior.

### Requirement: PRD Holding Page evidence does not prove launch readiness

The system MUST keep holding-page availability evidence separate from UAT acceptance, PRD readiness, Promotion Evidence, provider evidence, and go-live approval.

#### Scenario: Holding page passes hosted checks

- **WHEN** the apex serves the expected holding page with valid TLS and redirects
- **THEN** the result proves only public-domain and holding-surface readiness
- **AND** it does not open checkout, satisfy live Stripe or webhook gates, prove PRD D1/catalog state, or authorize `PRD_OPEN_GATE=open`.

#### Scenario: OpenSpec tasks are reviewed for unblocking

- **WHEN** a task was blocked only on public apex DNS, TLS, or holding-page availability
- **THEN** that task may use holding-surface evidence within its stated scope
- **AND** tasks requiring the full PRD site, live provider configuration, or human go/no-go approval remain open.

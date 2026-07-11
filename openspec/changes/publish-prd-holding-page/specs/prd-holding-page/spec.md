## ADDED Requirements

### Requirement: PRD Holding Page communicates active label status

The system SHALL present a concise public holding experience that says BlackBox Records is active, the full website is being prepared, and visitors can still reach the label.

#### Scenario: Visitor opens the canonical apex

- **WHEN** a visitor opens `https://blackboxrecordsathens.com/`
- **THEN** the page identifies BlackBox Records and Athens
- **AND** it states that the label is active and the website is under construction
- **AND** it exposes real Instagram and email actions.

#### Scenario: Public copy is reviewed

- **WHEN** holding-page copy is rendered
- **THEN** it does not expose Local, UAT, PRD, Cloudflare, Pages, Workers, Stripe, provider configuration, or private-preview language
- **AND** it does not claim an unapproved launch date, countdown, product availability, or fake urgency.

### Requirement: PRD Holding Page uses a plain BlackBox under-construction system

The system MUST use a plain, landing-image-free under-construction composition derived from the repo's existing design system rather than reproducing an external page or introducing a landing-page template aesthetic.

#### Scenario: Desktop composition is rendered

- **WHEN** the holding page renders at a desktop viewport
- **THEN** it uses one typographic field containing the existing logo, label identity, `UNDER CONSTRUCTION.` headline, short explanation, active-status line, and real contact actions
- **AND** it uses the existing near-black, off-white, muted-gray, hard-border, logo, and Veneer brand vocabulary
- **AND** it contains no landing image, hero image, background image, decorative image, split-screen treatment, card grid, glassmorphism, gradient text, construction icon, hazard tape, or generic ecommerce styling.

#### Scenario: Mobile composition is rendered

- **WHEN** the holding page renders at 320px or wider on a mobile viewport
- **THEN** the single-column identity, status copy, and actions remain legible in reading order
- **AND** actions remain reachable without horizontal overflow
- **AND** short viewports may scroll naturally rather than clipping content.

### Requirement: PRD Holding Page actions are real and static

The system MUST expose only valid public links sourced from existing repo content and MUST NOT present controls that have no behavior.

#### Scenario: Social and contact links are built

- **WHEN** the page resolves its Instagram and inquiry email values
- **THEN** it filters empty, placeholder, and `#` values
- **AND** it emits only valid `https:` and `mailto:` anchors
- **AND** the build fails if no real Instagram URL or inquiry email remains.

#### Scenario: Interactive elements are inspected

- **WHEN** the built holding document is checked
- **THEN** it contains no `javascript:` URL, fake navigation, disabled-looking active control, private-review link, checkout action, form, or countdown.

#### Scenario: Cloudflare serves the email action

- **WHEN** the holding artifact passes through Cloudflare's edge
- **THEN** the response prevents content transformation
- **AND** the email action remains the built `mailto:` anchor without an injected email-decoder runtime or `/cdn-cgi/l/email-protection` route.

### Requirement: PRD Holding Page is accessible and motion-safe

The system SHALL provide semantic, keyboard-usable content with visible focus, readable contrast, adequate touch targets, and reduced-motion support.

#### Scenario: Keyboard visitor uses the page

- **WHEN** a visitor navigates with a keyboard
- **THEN** every link receives a visible focus treatment
- **AND** focus order follows the reading order
- **AND** no interaction requires a pointer gesture.

#### Scenario: Reduced motion is requested

- **WHEN** `prefers-reduced-motion: reduce` is active
- **THEN** the optional entrance sequence is removed
- **AND** all content remains visible and understandable.

#### Scenario: Decorative media is inspected

- **WHEN** the holding document and its asset closure are inspected
- **THEN** no landing, hero, background, or decorative image is requested beyond the existing brand logo and favicons
- **AND** the label identity, status, and actions remain complete without visual media.

### Requirement: PRD Holding Page stays outside search indexes

The system MUST identify the HTTPS apex as the holding document's canonical URL while preventing the temporary page from being indexed.

#### Scenario: Holding metadata is built

- **WHEN** the holding artifact is prepared
- **THEN** canonical and Open Graph URLs use `https://blackboxrecordsathens.com/`
- **AND** HTML and response headers emit `noindex, nofollow`
- **AND** the artifact does not publish the full site's sitemap or route metadata.

#### Scenario: Launched site replaces the holding page

- **WHEN** launch cutover is approved
- **THEN** holding-only noindex metadata is not copied into the full PRD artifact
- **AND** full-site indexing policy is reviewed as part of the production-go-live change.

### Requirement: PRD Holding Page has no runtime service dependency

The system MUST render the holding experience as static HTML and same-origin assets without a page-owned client runtime or backend call.

#### Scenario: Browser network activity is inspected

- **WHEN** the page loads before a visitor follows an external link
- **THEN** it makes no Worker, API, checkout, analytics, font-provider, form-provider, or other third-party request
- **AND** it executes no page-owned JavaScript.

### Requirement: PRD Holding Page remains public until production launch is approved

The system MUST keep the PRD Holding Page on the public apex until every production-go-live prerequisite is verified and named reviewers record a go decision.

#### Scenario: Full static site is ready before live Stripe

- **GIVEN** the full static PRD artifact is deployable or has passed design review
- **AND** any live Stripe Products/Prices, Payment Method Configuration, production webhook, Worker/D1, catalog/stock, rollback, exact-origin, or go/no-go prerequisite remains open
- **WHEN** public launch is considered
- **THEN** `https://blackboxrecordsathens.com/` continues serving the PRD Holding Page
- **AND** the full site is not soft-launched with checkout hidden, disabled, test-backed, or incomplete.

#### Scenario: Production launch cutover is approved

- **GIVEN** all production-go-live prerequisites have verified evidence
- **AND** named reviewers have recorded a go decision
- **WHEN** the full PRD site is cut over to the public apex
- **THEN** the verified PRD Holding Page remains available as the immediate static rollback target until launch stability is accepted.

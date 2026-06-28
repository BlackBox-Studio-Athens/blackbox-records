## ADDED Requirements

### Requirement: Public newsletter form submits through the Worker

The system SHALL make the shared newsletter signup form submit valid visitor registrations through the public Worker newsletter endpoint without exposing provider secrets, provider IDs, or provider diagnostics to the browser.

#### Scenario: Visitor submits valid newsletter registration

- **WHEN** a visitor enters a valid email address, accepts newsletter consent, and submits the homepage or about-page newsletter form
- **THEN** the browser sends only the visitor email and explicit consent state to `/api/newsletter/registrations`
- **AND** the Worker registers the Contact through the backend email application boundary
- **AND** the browser receives a provider-safe success response.

#### Scenario: Visitor submits without consent

- **WHEN** a visitor submits the newsletter form without accepting newsletter consent
- **THEN** the browser prevents registration
- **AND** the visitor sees an accessible error explaining that newsletter consent is required
- **AND** the consent control is programmatically associated with that error and marked invalid
- **AND** no Worker or provider registration request is made.

#### Scenario: Worker rejects invalid email

- **WHEN** the Worker receives an invalid newsletter email payload
- **THEN** it returns a `400` response with a provider-safe public error
- **AND** the email control is programmatically associated with that error and marked invalid when the error is shown in the browser
- **AND** it does not call the email provider.

#### Scenario: Provider registration fails

- **WHEN** the backend email provider cannot register the newsletter Contact
- **THEN** the Worker returns a provider-safe unavailable response
- **AND** the browser shows a retryable public error without exposing Resend internals.

### Requirement: Newsletter signup confirms in context

The system SHALL confirm successful embedded newsletter registration in the existing page context by default.

#### Scenario: Registration succeeds from embedded form

- **WHEN** the Worker returns newsletter registration success to the embedded form
- **THEN** the form shows an inline subscribed confirmation in an accessible status region
- **AND** the confirmation does not tell the visitor to check their inbox unless a later double opt-in change is approved
- **AND** it does not redirect the visitor away from the current page.

#### Scenario: Signup UI preserves BlackBox visual language

- **WHEN** the newsletter signup UI is rendered
- **THEN** it uses the existing hard-edged monochrome label-site styling
- **AND** it does not introduce rounded promotional cards, provider-branded embeds, gradient treatments, decorative icon grids, fake urgency, or ecommerce-style marketing widgets.

#### Scenario: Signup controls respond without layout shift

- **WHEN** the newsletter signup moves between idle, submitting, success, and error states
- **THEN** the email input, submit action, consent copy, note, and status text remain in a stable layout
- **AND** desktop viewports keep one input/action row where space allows
- **AND** mobile viewports stack the input and action at full width.

#### Scenario: Signup status updates are announced accessibly

- **WHEN** the newsletter signup reports submitting, success, or blocking error state
- **THEN** status and error live-region containers are present before updates are written
- **AND** neutral and success updates use polite status behavior
- **AND** blocking errors use alert or assertive behavior with atomic announcement.

#### Scenario: Success copy follows single opt-in behavior

- **WHEN** a single opt-in registration succeeds
- **THEN** the visible success copy confirms that the visitor is subscribed
- **AND** it avoids confirmation-email language such as "check your inbox."

#### Scenario: Dedicated success route is considered

- **WHEN** a future change adds a standalone newsletter landing page or no-JS POST fallback
- **THEN** that change MAY add a dedicated success route using POST/redirect/get semantics
- **AND** the embedded homepage/about form still keeps in-context success unless explicitly changed.

### Requirement: Newsletter registration captures explicit marketing consent

The system SHALL require explicit newsletter consent and persist only safe consent evidence through the backend email registration flow.

#### Scenario: Consent evidence is recorded

- **WHEN** a newsletter registration is accepted
- **THEN** the backend records safe consent evidence including consent source, consent copy version, consent timestamp, and newsletter Topic ID through the email application boundary
- **AND** the browser never receives Resend Contact IDs, Topic IDs, Segment IDs, API keys, or provider response bodies.

#### Scenario: Newsletter Topic subscription is applied

- **WHEN** the backend registers a newsletter Contact
- **THEN** the configured newsletter Topic uses an opt-out default
- **AND** the backend explicitly opts the Contact into the configured newsletter Topic only after consent
- **AND** Contacts without explicit newsletter consent are not treated as newsletter subscribers.

### Requirement: Newsletter registration is environment isolated

The system MUST keep newsletter registration effects isolated to the active Product Environment.

#### Scenario: Local registration is exercised

- **WHEN** newsletter registration is tested locally
- **THEN** the registration uses local runtime config, mocks, or fake provider identifiers only
- **AND** it does not mutate UAT or PRD Resend Contacts.

#### Scenario: UAT registration is exercised

- **WHEN** newsletter registration is tested against UAT
- **THEN** the static frontend targets the UAT Worker
- **AND** the UAT Worker routes newsletter Contact writes through the UAT sink behavior
- **AND** the smoke evidence proves `status: registered` without printing provider secrets, Topic IDs, Contact IDs, or raw provider diagnostics.

#### Scenario: PRD registration is exercised

- **WHEN** newsletter registration is tested or enabled against PRD
- **THEN** the static frontend targets the PRD Worker
- **AND** the PRD Worker uses only PRD Resend runtime config
- **AND** it ignores UAT sink overrides
- **AND** real PRD Contact writes occur only after PRD Resend readiness is explicitly verified
- **AND** PRD newsletter registration is not blocked by checkout PRD-open status.

### Requirement: Newsletter signup is locally and remotely verifiable

The system SHALL provide acceptance checks for newsletter signup behavior in Local, UAT, and PRD readiness contexts.

#### Scenario: Local verification runs

- **WHEN** implementation is complete locally
- **THEN** `pnpm test:unit`, `pnpm check`, and `pnpm build` pass
- **AND** Browser Use verifies the rendered newsletter form can submit, show success, show validation errors, expose programmatic invalid state for invalid controls, remain on the current page, preserve the BlackBox visual language, and fit without overlap on mobile and desktop.

#### Scenario: UAT verification runs

- **WHEN** UAT newsletter behavior is validated
- **THEN** `pnpm smoke:resend-uat` posts a synthetic consented registration to the deployed UAT Worker
- **AND** the evidence remains ignored and redacted.

#### Scenario: PRD readiness is verified

- **WHEN** PRD newsletter registration readiness is checked before real subscriber capture
- **THEN** runtime config verification confirms PRD-scoped Resend configuration
- **AND** any missing provider setup blocks real PRD registration instead of falling back to Local or UAT behavior.

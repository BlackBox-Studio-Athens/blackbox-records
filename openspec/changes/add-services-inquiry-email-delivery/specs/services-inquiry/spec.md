## ADDED Requirements

### Requirement: Public Services inquiry submits through the Worker

The system SHALL submit a valid Services Inquiry through the public Worker email boundary without requiring a configured device email client or exposing recipient routing, provider credentials, provider identifiers, or provider diagnostics to the browser.

#### Scenario: Visitor submits a valid inquiry

- **WHEN** a visitor supplies a valid name, email, service, and message with any optional Band / Project and service details
- **THEN** the browser posts only those inquiry fields to `POST /api/services/inquiries`
- **AND** the Worker maps the service to the server-owned recipient alias
- **AND** the email application sends the inquiry through the existing provider gateway
- **AND** the browser receives `{ status: 'submitted' }` only after provider acceptance.

#### Scenario: Visitor submits invalid inquiry fields

- **WHEN** the Worker receives a blank required field, invalid email, unknown service, unknown body field, or value beyond its allowed length
- **THEN** it returns a provider-safe `400` response
- **AND** it does not call the email provider.

#### Scenario: Inquiry provider is unavailable

- **WHEN** email runtime configuration or the provider cannot accept the inquiry
- **THEN** the Worker returns a provider-safe `503` response
- **AND** it does not expose Resend names, identifiers, response bodies, or configuration details.

### Requirement: Services inquiry form stays short and service-aware

The system SHALL require only the core contact and inquiry fields while offering one concise optional prompt tailored to the selected service.

#### Scenario: Form renders core fields

- **WHEN** the Services inquiry form is available
- **THEN** Name, Email, Service, and Message are required
- **AND** Band / Project is optional
- **AND** Name accepts at most 100 characters, Email 254, Band / Project 160, and Message 2,000.

#### Scenario: General is selected

- **WHEN** the selected service is `General`
- **THEN** the optional details control is labelled `Useful context`
- **AND** it accepts at most 300 characters.

#### Scenario: Tour Booking is selected

- **WHEN** the selected service is `Tour Booking`
- **THEN** the optional details control is labelled `Date / City / Venue`
- **AND** it remains optional.

#### Scenario: Merch Printing is selected

- **WHEN** the selected service is `Merch Printing`
- **THEN** the optional details control is labelled `Item / Quantity / Deadline`
- **AND** it remains optional.

#### Scenario: Vinyl Printing is selected

- **WHEN** the selected service is `Vinyl Printing`
- **THEN** the optional details control is labelled `Format / Quantity / Target Date`
- **AND** it remains optional.

### Requirement: Inquiry submission confirms in context

The system SHALL keep the visitor on the Services page and communicate idle, submitting, error, and success states accessibly.

#### Scenario: Inquiry is submitting

- **WHEN** a submission request is pending
- **THEN** the submit action is disabled against repeat activation
- **AND** a pre-existing polite status region announces progress
- **AND** the surrounding form layout remains stable on mobile and desktop.

#### Scenario: Inquiry submission succeeds

- **WHEN** the Worker returns inquiry submission success
- **THEN** the form is replaced by an inline success panel
- **AND** the panel confirms that the inquiry was submitted without claiming inbox delivery
- **AND** it offers a `Send another inquiry` action
- **AND** it does not navigate, reload, or open another tab.

#### Scenario: Inquiry submission fails

- **WHEN** validation or provider submission fails
- **THEN** the visitor remains on the Services page with entered values preserved
- **AND** field errors are programmatically associated with invalid controls
- **AND** blocking errors use an accessible alert region
- **AND** retry and fallback actions remain available.

### Requirement: Services inquiry recipient routing is Worker-owned

The system MUST map each supported service to a fixed BlackBox alias in trusted backend code and MUST NOT accept a recipient address from the browser.

#### Scenario: General inquiry is routed

- **WHEN** the service is `General`
- **THEN** the intended recipient is `info@blackboxrecordsathens.com`.

#### Scenario: Tour Booking inquiry is routed

- **WHEN** the service is `Tour Booking`
- **THEN** the intended recipient is `booking@blackboxrecordsathens.com`.

#### Scenario: Merch Printing inquiry is routed

- **WHEN** the service is `Merch Printing`
- **THEN** the intended recipient is `merch@blackboxrecordsathens.com`.

#### Scenario: Vinyl Printing inquiry is routed

- **WHEN** the service is `Vinyl Printing`
- **THEN** the intended recipient is `vinyl@blackboxrecordsathens.com`.

#### Scenario: Browser attempts recipient override

- **WHEN** a request includes a recipient address or unsupported service value
- **THEN** the Worker rejects the request
- **AND** it does not send email.

### Requirement: Services inquiry email is structured and replyable

The system SHALL send one BlackBox-styled HTML email with an equivalent plain-text body, using the existing verified sender and the validated visitor email as the message `Reply-To`.

#### Scenario: Inquiry email content is built

- **WHEN** a valid inquiry is accepted
- **THEN** the subject is `Services Inquiry — <Service> — <Band / Project or Name>`
- **AND** the body presents Service, Name, Email, optional Band / Project, optional service details, and Message in that order
- **AND** the visible visitor email appears once
- **AND** replying addresses the visitor.

#### Scenario: Visitor content is rendered

- **WHEN** visitor-supplied values are inserted into HTML email content
- **THEN** every value is HTML-escaped
- **AND** the plain-text body contains the same operational information without HTML markup.

#### Scenario: Inquiry email is sent

- **WHEN** the email application sends the inquiry
- **THEN** it uses the existing `RESEND_FROM_EMAIL` sender configuration
- **AND** it applies a Worker-owned idempotency entity and provider-safe purpose/environment tags
- **AND** logs exclude the visitor message body.

### Requirement: Services inquiry has mail-app-independent fallback

The system SHALL keep native email composition secondary and provide visible copyable information when no device mail handler is available.

#### Scenario: Visitor chooses email app fallback

- **WHEN** the visitor activates `Open in email app`
- **THEN** a normal `mailto:` link targets the alias for the selected service
- **AND** its UTF-8 subject and plain-text body use CRLF line endings
- **AND** the site does not force a new tab or script a popup fallback.

#### Scenario: Device cannot open mailto

- **WHEN** the device has no usable mail handler or clipboard access fails
- **THEN** the selected recipient and plain-text inquiry summary remain visible and selectable
- **AND** the visitor can copy them manually without leaving the page.

#### Scenario: JavaScript is unavailable

- **WHEN** the Services page renders without JavaScript
- **THEN** it exposes the public inquiry recipient as selectable text
- **AND** it offers a normal `mailto:` link without claiming that a mail client will open.

### Requirement: Services inquiry delivery remains stateless and friction-free

The system SHALL deliver v1 inquiries without visitor confirmation mail, file handling, application persistence, or anti-abuse interaction and throttling.

#### Scenario: Inquiry is accepted

- **WHEN** the provider accepts an inquiry
- **THEN** the system does not send a confirmation email to the visitor
- **AND** it does not write an inquiry, draft, attachment, or delivery record to D1 or browser storage.

#### Scenario: Visitor opens or submits the form

- **WHEN** the visitor uses the Services inquiry flow
- **THEN** the system does not present Turnstile, CAPTCHA, honeypot, or another browser challenge
- **AND** the Worker does not apply application per-IP rate limiting or request throttling
- **AND** strict field validation and output escaping still apply.

### Requirement: Services inquiry is locally and remotely verifiable

The system SHALL provide automated and rendered checks for the public contract, routing, email content, status UX, and fallback behavior.

#### Scenario: Repository verification runs

- **WHEN** implementation is complete
- **THEN** focused unit tests cover validation, alias routing, dynamic `Reply-To`, HTML escaping, provider failure, inline states, and mailto formatting
- **AND** `pnpm test:unit`, `pnpm check`, and `pnpm build` pass.

#### Scenario: Browser verification runs

- **WHEN** the rendered Services flow is validated with Browser Use
- **THEN** mobile and desktop checks cover required fields, each adaptive prompt, pending state, success panel, error preservation, send-another reset, mail-app fallback, and copy fallback
- **AND** no tested state causes horizontal overflow, unintended navigation, or a forced new tab.

#### Scenario: UAT provider acceptance is verified

- **WHEN** the existing Resend UAT smoke exercises a synthetic Services inquiry
- **THEN** the deployed Worker returns provider-safe submission success
- **AND** Product Environment routing sends the message only to the managed UAT sink
- **AND** smoke output and evidence contain no visitor message body, provider secret, or raw provider response.

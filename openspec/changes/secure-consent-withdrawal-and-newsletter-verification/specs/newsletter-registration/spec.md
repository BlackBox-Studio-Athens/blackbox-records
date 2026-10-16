## MODIFIED Requirements

### Requirement: Public newsletter form submits through the Worker

The system SHALL make the shared newsletter signup form submit valid visitor registrations through the public Worker newsletter endpoint without exposing provider secrets, provider IDs, or provider diagnostics to the browser.

#### Scenario: Visitor submits valid newsletter registration

- **WHEN** a visitor enters a valid email address, accepts newsletter consent, and submits the homepage or about-page newsletter form
- **THEN** the browser sends only the visitor email and explicit consent state to `/api/newsletter/registrations`
- **AND** the Worker requests mailbox confirmation through the backend email application boundary without activating a Contact
- **AND** the browser receives a provider-safe success response with `confirmationRequired: true`.

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

- **WHEN** the backend email provider cannot send the requested confirmation
- **THEN** the Worker returns a provider-safe unavailable response
- **AND** the browser shows a retryable public error without exposing Resend internals.

### Requirement: Newsletter signup confirms in context

The system SHALL acknowledge successful embedded newsletter requests in the existing page context, distinguish pending mailbox confirmation from subscription, and preserve existing layout and accessibility.

#### Scenario: Registration succeeds from embedded form

- **WHEN** the Worker returns newsletter request success to the embedded form
- **THEN** the form shows an inline check-your-inbox acknowledgement in an accessible status region
- **AND** it does not claim the visitor is subscribed
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

- **WHEN** a newsletter request succeeds
- **THEN** the visible copy asks the visitor to check their inbox and confirm within 24 hours
- **AND** it does not claim a suppressed or globally unsubscribed Contact was reactivated.

#### Scenario: Dedicated success route is considered

- **WHEN** the mailbox link opens the dedicated email-preferences route
- **THEN** the page removes the capability fragment and automatically confirms through the existing POST without another confirmation button
- **AND** GET requests never mutate consent, and success is displayed only after the POST succeeds
- **AND** malformed, expired, used and unavailable links show truthful errors; only a connection failure offers a manual retry
- **AND** embedded homepage/about forms retain in-context acknowledgement.

## ADDED Requirements

### Requirement: Newsletter activation proves mailbox ownership

Newsletter Contact and Topic activation SHALL require a valid, unexpired, single-use mailbox capability, including opt-ins originating at checkout. Activation SHALL preserve global unsubscribe preferences and provider suppression. Confirmation links SHALL expire after 24 hours and tokens SHALL stay out of logs and URL queries.

#### Scenario: Another person submits a subscriber address

- **WHEN** someone submits another person's address with consent accepted
- **THEN** no Contact, Segment or Topic is activated before mailbox confirmation
- **AND** the response does not disclose existing newsletter membership.

#### Scenario: Confirmation is replayed or expires

- **WHEN** a confirmation token is missing, expired or already consumed
- **THEN** the server rejects activation without provider writes.

#### Scenario: Provider fails during activation

- **WHEN** a confirmed activation partially succeeds or its provider outcome is unknown
- **THEN** the capability remains consumed so retries cannot re-opt in a later unsubscribe
- **AND** the caller is told to request a new confirmation link.

#### Scenario: Confirmation delivery retries

- **WHEN** a confirmation send fails transiently or its outcome is unknown
- **THEN** a repeated request in the retry window uses the same token, message and provider idempotency key
- **AND** confirmation attempts are limited per recipient and environment day.

## ADDED Requirements

### Requirement: Worker-owned Resend email provider

The system MUST send application email through a Worker-owned Resend provider boundary without exposing Resend secrets, provider IDs, or internal delivery errors to static frontend code.

#### Scenario: Worker sends email

- **GIVEN** a Worker application service needs to send email
- **WHEN** it calls the email provider
- **THEN** it uses server-side Resend runtime config and HTTPS API calls
- **AND** the browser receives no Resend API key, provider resource ID, provider response body, or internal delivery diagnostic.

#### Scenario: Provider is unavailable

- **GIVEN** Resend config is missing or the provider request fails
- **WHEN** a public route depends on email delivery
- **THEN** the Worker returns a provider-safe failure without leaking credentials, provider payloads, or internal stack traces.

### Requirement: Paid order email notifications

The system SHALL send paid-order email notifications after the first verified paid checkout transition.

#### Scenario: Paid checkout transitions once

- **GIVEN** a pending CheckoutOrder exists with a shopper email from Stripe Checkout
- **WHEN** a verified Stripe webhook causes the first transition to paid
- **THEN** the Worker sends a shopper confirmation email
- **AND** the Worker sends an ops fulfillment notification email
- **AND** both sends use deterministic idempotency keys scoped to the checkout session and message purpose.

#### Scenario: Paid webhook is replayed

- **GIVEN** a CheckoutOrder is already paid
- **WHEN** the same or equivalent paid webhook is reconciled again
- **THEN** the Worker does not start new email sends.

#### Scenario: Shopper email is unavailable

- **GIVEN** a verified paid transition has no shopper email in the Stripe Checkout Session
- **WHEN** paid-order email notifications are evaluated
- **THEN** the Worker skips shopper confirmation
- **AND** the ops notification identifies that shopper email was unavailable.

### Requirement: Environment-aware email delivery

The system SHALL route Resend application emails according to the Worker Product Environment.

#### Scenario: UAT sends all emails to the sink recipient

- **GIVEN** the Worker runs in the sandbox runtime target for UAT
- **AND** `RESEND_UAT_RECIPIENT_OVERRIDE_EMAIL` is configured as `blackboxrecordsathens@gmail.com`
- **WHEN** paid-order shopper, paid-order ops, or newsletter welcome emails are sent
- **THEN** the Worker sends each email to `blackboxrecordsathens@gmail.com`
- **AND** the email includes safe test evidence for the intended recipient.

#### Scenario: PRD sends to real operational recipients

- **GIVEN** the Worker runs in the production runtime target for PRD
- **WHEN** a paid order sends email
- **THEN** shopper confirmation goes to the Stripe Checkout buyer email
- **AND** ops notification goes to `RESEND_OPS_TO_EMAIL`
- **AND** the UAT recipient override is ignored.

### Requirement: Newsletter subscription capture

The system SHALL capture newsletter signups through the Worker and enroll consenting subscribers in Resend.

#### Scenario: PRD shopper subscribes

- **GIVEN** a shopper submits a valid email with explicit consent accepted
- **AND** the Worker runs in the production runtime target for PRD
- **WHEN** the static newsletter form posts to the Worker
- **THEN** the Worker creates or updates the Resend Contact
- **AND** the Worker adds the Contact to the configured newsletter Segment and optional Topic
- **AND** the Worker records consent metadata as provider contact properties
- **AND** the Worker sends one welcome email for a first opt-in transition.

#### Scenario: UAT shopper subscribes

- **GIVEN** a shopper submits a valid email with explicit consent accepted
- **AND** the Worker runs in the sandbox runtime target for UAT
- **WHEN** the static newsletter form posts to the Worker
- **THEN** the Worker sends a test welcome email to `blackboxrecordsathens@gmail.com`
- **AND** the email includes the submitted address and consent metadata for inspection
- **AND** the Worker does not create or update a Resend Contact, Segment enrollment, or Topic enrollment for the submitted address.

#### Scenario: Consent is missing

- **GIVEN** a newsletter signup request omits accepted consent
- **WHEN** the Worker validates the request
- **THEN** it rejects the request without calling Resend.

#### Scenario: Subscriber already exists

- **GIVEN** the submitted email already belongs to a subscribed Resend Contact in PRD
- **WHEN** the Worker processes the request
- **THEN** it treats the signup as idempotent success
- **AND** it does not send duplicate welcome emails for an already opted-in contact.

### Requirement: Resend CLI setup automation

The system SHALL provide a repo-owned setup script that uses Resend CLI for diagnostics and provider resource preparation without becoming part of runtime email delivery.

#### Scenario: CLI configuration is validated first

- **GIVEN** implementation of Resend runtime email work is about to begin
- **WHEN** the operator environment is prepared
- **THEN** `resend --version` works
- **AND** `resend doctor --json` returns account/team diagnostics without leaking secrets
- **AND** read-only CLI checks can inspect the intended sending domain, newsletter Segment, and optional Topic
- **AND** runtime email implementation does not proceed until those checks pass or a manual provider checkpoint is explicitly recorded.

#### Scenario: Setup diagnostics run

- **GIVEN** an operator runs the Resend setup script
- **WHEN** Resend CLI is available
- **THEN** the script runs CLI diagnostics in JSON mode
- **AND** it checks or prepares non-secret provider resources such as domains, Segments, and Topics according to supplied options.

#### Scenario: Provider setup needs secrets or DNS

- **GIVEN** setup requires a real Resend API key, DNS record application, or Cloudflare Worker secret upload
- **WHEN** the script reports required actions
- **THEN** it leaves those actions as explicit operator checkpoints unless a later approved automation has the necessary credentials and safeguards.

#### Scenario: Setup writes local output

- **GIVEN** provider resources are discovered or created
- **WHEN** the setup script writes local output
- **THEN** it writes only non-secret IDs and diagnostic reports to ignored local files.

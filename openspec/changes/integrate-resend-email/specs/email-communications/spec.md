## ADDED Requirements

### Requirement: Worker-owned Resend email provider

The system MUST send application email through a Worker-owned Resend provider boundary backed by the official Resend SDK without exposing Resend secrets, provider IDs, or internal delivery errors to static frontend code.

#### Scenario: Worker sends email

- **GIVEN** a Worker application service needs to send email
- **WHEN** it calls the email provider
- **THEN** it uses server-side Resend runtime config through the backend Resend SDK infrastructure gateway
- **AND** the browser receives no Resend API key, provider resource ID, provider response body, or internal delivery diagnostic.

#### Scenario: SDK coverage is insufficient

- **GIVEN** a required Resend provider operation is not supported by the official SDK or fails in the Cloudflare Worker runtime
- **WHEN** implementation reaches that operation
- **THEN** the implementation records the SDK gap and does not add a direct REST fallback without an explicit follow-up decision.

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
- **AND** both emails use rich, repo-owned HTML content with plain-text fallbacks designed as part of this change
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

### Requirement: Paid order email templates are designed in source

The system SHALL provide rich, repo-owned paid-order email templates as part of this change.

#### Scenario: Shopper confirmation content is built

- **GIVEN** a shopper confirmation email is prepared
- **WHEN** the email content is rendered
- **THEN** it includes BlackBox-branded HTML and plain-text content
- **AND** it includes safe paid-order summary, fulfillment expectations, and support contact details.

#### Scenario: Ops fulfillment content is built

- **GIVEN** an ops fulfillment email is prepared
- **WHEN** the email content is rendered
- **THEN** it includes BlackBox-branded HTML and plain-text content
- **AND** it includes ops-safe fulfillment context without exposing raw Stripe, D1, webhook, or shipping provider payloads.

### Requirement: Newsletter registrations are Resend-backed

The system SHALL register newsletter subscribers through the Worker-owned Resend provider boundary using explicit consent and provider-safe responses.

#### Scenario: Site visitor submits newsletter signup

- **GIVEN** a visitor submits the homepage or about-page newsletter form with a valid email address
- **WHEN** the Worker accepts the request
- **THEN** it creates or updates a Resend Contact through the backend Resend SDK infrastructure gateway
- **AND** it opts the Contact into the configured newsletter Topic
- **AND** it stores safe consent evidence with `consentSource`, `consentCopyVersion`, `consentedAt`, and `newsletterTopicId`
- **AND** the browser receives no Resend API key, provider resource ID, provider response body, or internal delivery diagnostic.

#### Scenario: Shopper opts into newsletter during purchase

- **GIVEN** a shopper explicitly opts into newsletter registration during purchase
- **WHEN** checkout or paid-order reconciliation evaluates newsletter registration
- **THEN** the Worker registers the shopper email as a Resend Contact
- **AND** it opts the Contact into the configured newsletter Topic
- **AND** it stores safe consent evidence with `consentSource`, `consentCopyVersion`, `consentedAt`, and `newsletterTopicId`
- **AND** the registration remains separate from paid-order email delivery.

#### Scenario: Newsletter consent is absent

- **GIVEN** a shopper does not explicitly opt into the newsletter
- **WHEN** checkout or paid-order reconciliation completes
- **THEN** the Worker does not create or update a marketing Contact from that purchase.

#### Scenario: Newsletter consent copy is shown

- **GIVEN** a visitor sees the homepage/about newsletter form or checkout newsletter opt-in
- **WHEN** the consent UI is rendered
- **THEN** it identifies BlackBox Records as the sender
- **AND** it explains the signup covers BlackBox Records news, releases, distro updates, and event notes
- **AND** it says the subscriber can unsubscribe anytime
- **AND** it includes privacy/support context near the consent action.

#### Scenario: Resend Topic requires explicit subscription

- **GIVEN** the newsletter Topic is configured in Resend
- **WHEN** a Contact exists without explicit newsletter consent
- **THEN** the Contact does not receive newsletter Broadcasts for that Topic.

#### Scenario: Newsletter registration cannot reach Resend

- **GIVEN** Resend config is missing or the provider request fails
- **WHEN** a newsletter signup request is handled
- **THEN** the Worker returns a provider-safe failure without leaking credentials, provider payloads, or internal stack traces.

#### Scenario: Welcome email and double opt-in are deferred

- **GIVEN** a newsletter signup succeeds
- **WHEN** the signup flow completes
- **THEN** the Worker does not send a welcome email
- **AND** the Worker does not require double opt-in unless a later change approves that flow.

### Requirement: Resend usage stays within Free tier assumptions

The system SHALL avoid paid Resend feature dependencies in this change.

#### Scenario: Provider resources are selected

- **GIVEN** Resend Free tier is the approved provider plan
- **WHEN** runtime config and provider readiness are verified
- **THEN** the system requires no more than one verified custom domain or subdomain
- **AND** it requires no dedicated IPs, paid overage, or paid support features
- **AND** it records transactional email and marketing contact limits as operational guardrails.

### Requirement: Resend runtime config is explicit

The system SHALL use explicit Worker runtime config names for Resend email and newsletter behavior.

#### Scenario: Runtime config is evaluated

- **GIVEN** the Worker prepares Resend runtime behavior
- **WHEN** runtime config is read
- **THEN** it reads `RESEND_API_KEY` as a Worker secret
- **AND** it reads `RESEND_FROM_EMAIL=orders@blackboxrecordsathens.com`
- **AND** it reads `RESEND_REPLY_TO_EMAIL=support@blackboxrecordsathens.com`
- **AND** it reads `RESEND_OPS_TO_EMAIL`
- **AND** it reads `RESEND_UAT_RECIPIENT_OVERRIDE_EMAIL=blackboxrecordsathens+TESTING@gmail.com`
- **AND** it reads required `RESEND_NEWSLETTER_TOPIC_ID`
- **AND** `RESEND_NEWSLETTER_SEGMENT_ID` remains optional and deferred.

### Requirement: Environment-aware email delivery

The system SHALL route Resend application emails according to the Worker Product Environment.

#### Scenario: UAT sends all emails to the sink recipient

- **GIVEN** the Worker runs in the sandbox runtime target for UAT
- **AND** `RESEND_UAT_RECIPIENT_OVERRIDE_EMAIL` is configured as `blackboxrecordsathens+TESTING@gmail.com`
- **WHEN** paid-order shopper or paid-order ops emails are sent
- **THEN** the Worker sends each email to `blackboxrecordsathens+TESTING@gmail.com`
- **AND** the email includes safe test evidence for the intended recipient.

#### Scenario: PRD sends to real operational recipients

- **GIVEN** the Worker runs in the production runtime target for PRD
- **WHEN** a paid order sends email
- **THEN** shopper confirmation goes to the Stripe Checkout buyer email
- **AND** ops notification goes to `RESEND_OPS_TO_EMAIL`
- **AND** the UAT recipient override is ignored.

### Requirement: Resend provider readiness verification

The system SHALL provide a repo-owned verification script that uses Resend CLI for diagnostics and read-only provider checks without becoming part of runtime email delivery.

#### Scenario: CLI configuration is validated first

- **GIVEN** implementation of Resend runtime email work is about to begin
- **WHEN** the operator environment is prepared
- **THEN** `resend --version` works
- **AND** `resend doctor --json` returns account/team diagnostics without leaking secrets
- **AND** read-only CLI checks can inspect the intended sending domain and sender readiness
- **AND** the official Resend SDK is proven compatible with the Worker toolchain for required paid-order send and newsletter contact behavior
- **AND** runtime email implementation does not proceed until those checks pass or a manual provider checkpoint is explicitly recorded.

#### Scenario: Verification diagnostics run

- **GIVEN** an operator runs the Resend verification script
- **WHEN** Resend CLI is available
- **THEN** the script runs CLI diagnostics in JSON mode
- **AND** it performs read-only provider checks for account, domain, sender, Contact, Topic, and Segment readiness.

#### Scenario: Provider setup needs secrets or DNS

- **GIVEN** setup requires a real Resend API key, DNS record application, Cloudflare Worker secret upload, Segment/Topic creation, or provider mutation
- **WHEN** the script reports required actions
- **THEN** it leaves those actions as explicit operator checkpoints unless a later approved automation has the necessary credentials and safeguards.

#### Scenario: Setup writes local output

- **GIVEN** provider readiness is checked
- **WHEN** the verification script writes local output
- **THEN** it writes only non-secret diagnostic reports to ignored local files.

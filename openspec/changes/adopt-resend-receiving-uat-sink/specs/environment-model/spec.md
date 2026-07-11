## ADDED Requirements

### Requirement: UAT email sink uses managed non-human Receiving

The system MUST route UAT application email and UAT newsletter Contact effects to a stable address on a Resend-managed Receiving domain instead of a human operations inbox.

#### Scenario: UAT application email is routed

- **GIVEN** the Product Environment is UAT
- **WHEN** the Worker sends shopper or ops transactional email
- **THEN** it routes the message to the configured Resend-managed Receiving address
- **AND** it does not send the message to the intended shopper, the human Gmail operations inbox, or PRD recipients.

#### Scenario: UAT newsletter Contact is routed

- **GIVEN** the Product Environment is UAT
- **WHEN** a site or checkout newsletter registration creates or updates a Contact
- **THEN** it uses the same managed UAT sink address
- **AND** it preserves intended-subscriber evidence without creating or updating the intended subscriber Contact.

#### Scenario: Managed Receiving is configured

- **WHEN** the UAT sink is provisioned or validated
- **THEN** it uses a Resend-managed `*.resend.app` Receiving domain
- **AND** it does not enable Receiving, replace MX records, or change inbound routing for `blackboxrecordsathens.com`
- **AND** it does not add a new product environment, provider account requirement, GitHub secret, Worker secret, or PRD override.

#### Scenario: Other Product Environments send email

- **WHEN** Local or PRD email behavior runs
- **THEN** Local continues using mocks or fake provider identifiers
- **AND** PRD ignores the UAT sink override and retains direct PRD routing policy.

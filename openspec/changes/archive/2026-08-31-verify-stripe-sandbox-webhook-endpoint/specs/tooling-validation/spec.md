## ADDED Requirements

### Requirement: UAT persistent webhook configuration is verified read-only

The system SHALL provide a read-only command that validates the persistent UAT Stripe test-mode webhook endpoint without exposing or mutating secrets.

#### Scenario: Valid endpoint is verified

- **WHEN** pnpm stripe:webhooks:verify --env uat runs with authorized credentials
- **THEN** exactly one enabled non-Connect test-mode account endpoint matches the exact UAT Worker webhook URL
- **AND** output includes only redacted endpoint identity.

#### Scenario: Required events are verified

- **WHEN** the matching endpoint is inspected
- **THEN** product.created, product.updated, product.deleted, price.created, price.updated, and price.deleted are all enabled
- **AND** extra checkout events do not fail verification.

#### Scenario: Endpoint state is unsafe

- **WHEN** the endpoint is missing, disabled, duplicated, wrong-mode, Connect-only, misrouted, or missing a required event
- **THEN** verification fails with a redacted repair summary
- **AND** changes no Stripe or Cloudflare state.

#### Scenario: Worker secret binding is inspected

- **WHEN** Cloudflare configuration can expose binding names
- **THEN** the verifier reports STRIPE_WEBHOOK_SECRET as present or missing
- **AND** never claims value equality from name presence.

### Requirement: Persistent secret equality uses delivery evidence

The system SHALL prove the installed UAT webhook secret through successful signed event processing rather than secret retrieval.

#### Scenario: Signed delivery succeeds

- **WHEN** Stripe sends an event from the persistent endpoint and the Worker performs the expected catalog or paid-order reconciliation
- **THEN** UAT evidence may record signing-secret match as proven
- **AND** excludes the secret, raw event payload, full endpoint ID, and customer/payment data.

### Requirement: Temporary listener state is not readiness evidence

The system MUST keep stripe listen secrets and forwarding separate from the deployed UAT persistent endpoint.

#### Scenario: Temporary listener starts

- **WHEN** local or investigative tooling runs stripe listen
- **THEN** it does not overwrite the deployed UAT STRIPE_WEBHOOK_SECRET
- **AND** listener delivery is not accepted as persistent endpoint proof.

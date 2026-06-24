## ADDED Requirements

### Requirement: Stripe UAT webhook endpoint verifier

The system SHALL provide a repository-owned verification command for the persistent UAT Stripe test-mode webhook endpoint.

#### Scenario: Persistent UAT endpoint is configured

- **GIVEN** UAT Stripe test-mode credentials are available to the operator or CI environment
- **WHEN** `pnpm stripe:webhooks:verify --env uat` runs
- **THEN** it verifies that Stripe has an enabled account webhook endpoint for `https://blackbox-records-backend-uat.blackboxrecordsathens.workers.dev/api/stripe/webhooks`
- **AND** it verifies that the endpoint is in Stripe test mode for UAT
- **AND** it reports only redacted endpoint identifiers.

#### Scenario: Required catalog events are missing

- **GIVEN** the matching UAT webhook endpoint exists
- **WHEN** the endpoint does not include `product.created`, `product.updated`, `product.deleted`, `price.created`, `price.updated`, or `price.deleted`
- **THEN** `pnpm stripe:webhooks:verify --env uat` fails
- **AND** it lists the missing event type names without printing Stripe secrets.

#### Scenario: Dashboard state is ambiguous

- **GIVEN** Stripe returns no matching endpoint, a disabled matching endpoint, or multiple enabled endpoints with the UAT Worker webhook URL
- **WHEN** `pnpm stripe:webhooks:verify --env uat` runs
- **THEN** it fails with a remediation summary that points the operator to the exact endpoint URL and required catalog events.

#### Scenario: Worker secret presence is checked

- **GIVEN** the UAT Stripe endpoint configuration is valid
- **WHEN** `pnpm stripe:webhooks:verify --env uat` checks the deployed Worker configuration
- **THEN** it verifies that `STRIPE_WEBHOOK_SECRET` is present for the UAT Worker when that information is available from Wrangler or Cloudflare
- **AND** it distinguishes secret presence from signing-secret match proof.

### Requirement: Stripe CLI listener is not persistent endpoint evidence

The system MUST keep temporary Stripe CLI listener output separate from persistent webhook endpoint verification.

#### Scenario: Smoke listener is running

- **GIVEN** `stripe listen` is forwarding events for a smoke run or local diagnostic
- **WHEN** webhook readiness evidence is evaluated
- **THEN** listener output, forwarded event delivery, and listener signing secrets are not accepted as proof that the persistent UAT Stripe endpoint is configured.

#### Scenario: Listener secret would overwrite persistent secret

- **GIVEN** the deployed UAT Worker uses `STRIPE_WEBHOOK_SECRET` for the persistent Stripe endpoint
- **WHEN** smoke tooling starts a transient Stripe CLI listener
- **THEN** the tooling MUST NOT silently replace the deployed sandbox Worker's primary `STRIPE_WEBHOOK_SECRET` with the listener signing secret.

### Requirement: UAT webhook proof joins operator validation

The system SHALL make persistent UAT webhook configuration visible in operator proof before accepting catalog sync readiness.

#### Scenario: UAT catalog readiness is proved

- **GIVEN** UAT catalog readiness is being verified before smoke evidence or launch-readiness review
- **WHEN** operator validation runs
- **THEN** it includes `pnpm stripe:webhooks:verify --env uat`
- **AND** it keeps `pnpm stripe:catalog:verify --env uat` as separate proof that current Store Offer and Stripe catalog state are aligned.

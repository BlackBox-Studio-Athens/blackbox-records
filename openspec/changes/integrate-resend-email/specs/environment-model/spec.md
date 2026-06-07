## ADDED Requirements

### Requirement: Resend environment resources are scoped

The system SHALL scope Resend provider resources and runtime config to the canonical Local, UAT, and PRD Product Environments.

#### Scenario: Runtime email config is evaluated

- **GIVEN** the Worker runs in Local, UAT, or PRD
- **WHEN** paid-order email behavior reads runtime config
- **THEN** it uses only that environment's Resend API key, sender, ops recipient, and recipient override.
- **AND** UAT maps to the Worker sandbox runtime target and requires `RESEND_UAT_RECIPIENT_OVERRIDE_EMAIL=blackboxrecordsathens+TESTING@gmail.com`
- **AND** PRD maps to the Worker production runtime target and must not honor the UAT recipient override.

#### Scenario: Local development runs without real provider secrets

- **GIVEN** Local development or automated tests run without real Resend credentials
- **WHEN** email behavior is tested
- **THEN** the system uses mocked application-level provider responses
- **AND** no UAT or PRD Resend secrets are copied into local static frontend config.

#### Scenario: Provider readiness is verified

- **GIVEN** Resend CLI verification checks provider readiness
- **WHEN** environment-specific IDs or reports are produced
- **THEN** non-secret reports may be copied into local evidence or deployment notes
- **AND** API keys, DNS updates, and Worker secret uploads remain environment-scoped operator checkpoints.

### Requirement: Resend Free tier constraints are explicit

The system SHALL keep Resend runtime behavior and provider setup within the approved Free tier unless a later change explicitly approves a paid plan.

#### Scenario: Sending domain is selected

- **GIVEN** Resend Free tier allows one custom domain
- **WHEN** the sending identity is configured
- **THEN** the system uses the owned `blackboxrecordsathens.com` domain as the single verified Resend sending domain
- **AND** the domain was bought through Spaceship and delegated to Cloudflare nameservers
- **AND** Cloudflare is the DNS control plane for Resend DNS records and Cloudflare Email Routing records
- **AND** Worker email can use clean sender addresses such as `orders@blackboxrecordsathens.com` and `newsletter@blackboxrecordsathens.com` after DNS and Resend verification
- **AND** Cloudflare Email Routing remains the inbound alias and catch-all forwarding path to Gmail after setup
- **AND** DNS verification, SPF/DKIM/DMARC alignment, any required SPF record merging, and Cloudflare Email Routing setup remain manual operator checkpoints
- **AND** Local implementation and automated tests do not require live domain verification
- **AND** live UAT/PRD provider acceptance does not complete until DNS and Resend verification are done
- **AND** additional Resend domains or subdomains are not required for Local, UAT, or PRD.

#### Scenario: Provider limits are evaluated

- **GIVEN** paid-order emails and newsletter registration use Resend
- **WHEN** provider readiness and runtime config are reviewed
- **THEN** the plan documents Free tier transactional email, daily email, marketing contact, data-retention, and automation-run limits
- **AND** implementation does not depend on pay-as-you-go, dedicated IPs, multiple domains, or paid support features.

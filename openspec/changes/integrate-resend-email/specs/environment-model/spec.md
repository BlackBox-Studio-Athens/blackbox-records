## ADDED Requirements

### Requirement: Resend environment resources are scoped

The system SHALL scope Resend provider resources and runtime config to the canonical Local, UAT, and PRD Product Environments.

#### Scenario: Runtime email config is evaluated

- **GIVEN** the Worker runs in Local, UAT, or PRD
- **WHEN** paid-order email behavior reads runtime config
- **THEN** it uses only that environment's Resend API key, sender, reply-to, ops recipient, newsletter Topic, recipient/contact override, email brand logo URL, and email brand home URL.
- **AND** it resolves email policy from canonical `PRODUCT_ENVIRONMENT` values and `ProductEnvironmentProfile`
- **AND** it does not branch on `sandbox`, `production`, `test`, `live`, `direct`, or `uat-sink` as Product Environment values
- **AND** UAT maps to the Worker sandbox runtime target and requires `RESEND_UAT_RECIPIENT_OVERRIDE_EMAIL=blackboxrecordsathens+TESTING@gmail.com`
- **AND** UAT uses that override as the sink recipient for application email and the sink Contact for newsletter registration
- **AND** PRD maps to the Worker production runtime target and must not honor the UAT recipient override.

#### Scenario: Email brand assets are environment scoped

- **GIVEN** paid-order email templates render a BlackBox logo and homepage link
- **WHEN** the Worker reads email runtime config
- **THEN** it validates `EMAIL_BRAND_LOGO_URL` as an absolute HTTPS URL for the public logo image
- **AND** it validates `EMAIL_BRAND_HOME_URL` as an absolute HTTPS URL for the public site home
- **AND** it classifies those values in runtime config verification alongside the other Worker email config categories
- **AND** UAT uses the GitHub Pages UAT site and logo URLs
- **AND** PRD uses the Cloudflare Pages PRD site and logo URLs until an approved custom public site domain replaces them
- **AND** Local and automated tests may use stable public or mock HTTPS URLs without requiring private provider secrets
- **AND** these public URLs do not expose Resend IDs, Stripe IDs, D1 fields, raw provider payloads, or secret verification evidence.

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
- **AND** Cloudflare must be authoritative and hold required Resend DNS records before live Resend domain proof completes
- **AND** Worker email can use clean sender addresses such as `orders@blackboxrecordsathens.com` and `newsletter@blackboxrecordsathens.com` after DNS and Resend verification
- **AND** Cloudflare Email Routing remains the inbound alias and catch-all forwarding path to Gmail after setup where it supports reply routing for this task
- **AND** DNS verification, SPF/DKIM/DMARC alignment, any required SPF record merging, and Cloudflare Email Routing setup remain manual operator checkpoints
- **AND** Local implementation and automated tests do not require live domain verification
- **AND** live UAT/PRD provider acceptance does not complete until DNS and Resend verification are done
- **AND** additional Resend domains or subdomains are not required for Local, UAT, or PRD.

#### Scenario: Provider limits are evaluated

- **GIVEN** paid-order emails and newsletter registration use Resend
- **WHEN** provider readiness and runtime config are reviewed
- **THEN** the plan documents Free tier transactional email, daily email, marketing contact, data-retention, and automation-run limits
- **AND** implementation does not depend on pay-as-you-go, dedicated IPs, multiple domains, or paid support features.

## MODIFIED Requirements

### Requirement: Visits are measured without cookies

Following the owner's 2026-10-16 decision, the gateway SHALL permit automatic Cloudflare Web Analytics by no longer adding `no-transform` to HTML and conditional replies. It SHALL preserve other cache/privacy directives, ETags, bodyless 304s and image behavior. Visits and shell navigation SHALL be measured without analytics cookies or an application-inserted beacon.

#### Scenario: Visitor browses the production site

- **WHEN** a visitor receives HTML through the public gateway
- **THEN** the gateway preserves existing cache directives without adding `no-transform`
- **AND** production acceptance verifies the automatic beacon and a Home-to-Store shell page-view request without analytics cookies.

#### Scenario: Conditional or private HTML is returned

- **WHEN** a document response is a conditional 304 or carries private/no-store restrictions
- **THEN** the gateway preserves its status, ETag and privacy directives without adding `no-transform`
- **AND** HTML 404 responses retain `no-store` and image/binary responses retain their existing cache behavior.

#### Scenario: Cookie-free collection is assessed

- **WHEN** optional measurement is considered for later activation
- **THEN** the assessment distinguishes the GDPR basis from terminal-access consent requirements
- **AND** absent assessment/account evidence remains unresolved rather than being inferred from the absence of cookies.

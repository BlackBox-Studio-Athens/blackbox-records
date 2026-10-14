## MODIFIED Requirements

### Requirement: Visits are measured without cookies

Optional client-side measurement is deferred while its data-protection assessment is unresolved. The public Pages gateway SHALL append `no-transform` to HTML and conditional responses to prevent automatic optional beacon injection. It SHALL preserve existing cache, no-store, referrer and indexing restrictions; image/binary responses SHALL retain their existing behavior. No consent banner or replacement tracker is introduced. Existing staff aggregate reads and necessary delivery/security processing remain available. Cookie-free behavior alone MUST NOT be treated as a legal exemption. Any later measurement activation requires an evidenced assessment and accurate coordinated privacy wording.

#### Scenario: Visitor browses the production site

- **WHEN** a visitor receives HTML through the public gateway
- **THEN** its response includes `no-transform` alongside the existing cache directives
- **AND** the application adds no optional beacon, including on checkout, email-preferences and HTML 404 replies.

#### Scenario: Conditional or private HTML is returned

- **WHEN** a document response is a conditional 304 or carries private/no-store restrictions
- **THEN** the gateway preserves its status, ETag and privacy directives while retaining `no-transform`
- **AND** deployment acceptance separately verifies that the actual edge response does not inject a beacon.

#### Scenario: Cookie-free collection is assessed

- **WHEN** optional measurement is considered for later activation
- **THEN** the assessment distinguishes the GDPR basis from terminal-access consent requirements
- **AND** absent assessment/account evidence remains unresolved rather than being inferred from the absence of cookies.

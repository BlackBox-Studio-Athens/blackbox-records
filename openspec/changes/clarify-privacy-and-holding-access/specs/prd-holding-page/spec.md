## ADDED Requirements

### Requirement: Holding policy URLs remain reachable without opening apex shop routes

The Holding artifact MUST provide exact temporary redirects for `/privacy`, `/privacy/`, `/terms`, and `/terms/` to the corresponding existing PRD legal documents. Other routes MUST retain the isolated Holding behavior. This exception MUST NOT change checkout, launch or DNS controls.

#### Scenario: Visitor or saved Stripe policy link opens a legal URL

- **WHEN** either slash form of Privacy or Terms is requested on the Holding origin
- **THEN** the artifact declares a 302 to the corresponding document on `https://blackbox-records-web.pages.dev`
- **AND** the notice remains sourced from accepted CMS content rather than a pending repository fixture.

#### Scenario: A catchall or shop route slips into preparation

- **WHEN** artifact validation finds an extra redirect, a different legal destination, or extra shop HTML
- **THEN** the Holding artifact check fails
- **AND** the artifact is not accepted for deployment.

#### Scenario: Holding remains active

- **WHEN** the apex home or a guessed shop path is requested
- **THEN** legal-route exceptions do not forward it to the full shop
- **AND** no page-owned runtime, new service binding or launch-control change is introduced.

## MODIFIED Requirements

### Requirement: PRD Holding Page actions are real and static

The system MUST expose only valid public links sourced from existing repo content and MUST NOT present controls that have no behavior. Besides the social and contact actions, the page MUST offer one quiet relative Privacy link served by the exact `/privacy/` redirect.

#### Scenario: Social and contact links are built

- **WHEN** the page resolves its Instagram and inquiry email values
- **THEN** it filters empty, placeholder, and `#` values
- **AND** it emits only valid `https:` Instagram and `mailto:` anchors
- **AND** a hosted site build omits a missing or invalid action and logs a build warning instead of failing.

#### Scenario: Privacy information is reachable from Holding

- **WHEN** the holding document is built
- **THEN** a separate small navigation labelled Legal contains one `/privacy/` anchor reading PRIVACY
- **AND** it is the only relative anchor the artifact check accepts.

#### Scenario: Holding artifact is checked before publication

- **WHEN** the holding artifact check runs on the built holding document
- **THEN** it fails if the Instagram action, the email action or the Privacy link is missing
- **AND** a holding artifact without them is not published.

#### Scenario: Interactive elements are inspected

- **WHEN** the built holding document is checked
- **THEN** it contains no `javascript:` URL, fake navigation, disabled-looking active control, private-review link, checkout action, form, or countdown.

#### Scenario: Cloudflare serves the email action

- **WHEN** the holding artifact passes through Cloudflare's edge
- **THEN** the response prevents content transformation
- **AND** the email action remains the built `mailto:` anchor without an injected email-decoder runtime or `/cdn-cgi/l/email-protection` route.

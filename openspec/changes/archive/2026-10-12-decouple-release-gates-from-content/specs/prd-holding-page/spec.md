## MODIFIED Requirements

### Requirement: PRD Holding Page actions are real and static

The system MUST expose only valid public links sourced from existing repo content and MUST NOT present controls that have no behavior.

#### Scenario: Social and contact links are built

- **WHEN** the page resolves its Instagram and inquiry email values
- **THEN** it filters empty, placeholder, and `#` values
- **AND** it emits only valid `https:` Instagram and `mailto:` anchors
- **AND** a hosted site build omits a missing or invalid action and logs a build warning instead of failing.

#### Scenario: Holding artifact is checked before publication

- **WHEN** the holding artifact check runs on the built holding document
- **THEN** it fails if the Instagram action or the email action is missing
- **AND** a holding artifact without both actions is not published.

#### Scenario: Interactive elements are inspected

- **WHEN** the built holding document is checked
- **THEN** it contains no `javascript:` URL, fake navigation, disabled-looking active control, private-review link, checkout action, form, or countdown.

#### Scenario: Cloudflare serves the email action

- **WHEN** the holding artifact passes through Cloudflare's edge
- **THEN** the response prevents content transformation
- **AND** the email action remains the built `mailto:` anchor without an injected email-decoder runtime or `/cdn-cgi/l/email-protection` route.

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

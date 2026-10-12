## ADDED Requirements

### Requirement: The PRD API is served under the apex

The PRD backend SHALL serve its public API, including the Stripe webhook, at `https://blackboxrecordsathens.com/api/*`, and the PRD public build SHALL use the apex as its backend base URL.

#### Scenario: The apex still serves the Holding Page

- **WHEN** the apex serves the Holding Page and a client requests `/api/store/listing-prices`
- **THEN** the PRD backend answers.

#### Scenario: Stripe delivers a live event

- **WHEN** Stripe sends a live webhook event
- **THEN** it is delivered to `https://blackboxrecordsathens.com/api/stripe/webhooks` and verified with the existing signing secret.

### Requirement: The UAT site requires Access

The UAT public site and its preview addresses SHALL require Cloudflare Access. Only the canonical production host's accepted `/media/content/*` objects and public email logo MAY bypass Access for anonymous image consumers. Preview pages and private CMS media SHALL remain protected. Release automation SHALL read UAT with an Access service token. The UAT API SHALL stay reachable without Access for Stripe Sandbox webhooks and Local `uat-connected` mode.

#### Scenario: Anonymous visitor opens UAT

- **WHEN** a visitor without an Access session opens `https://blackbox-records-web-uat.pages.dev/`
- **THEN** Access asks them to sign in and no UAT page is served.

#### Scenario: A push deploys UAT

- **WHEN** the UAT deploy smoke reads the UAT site
- **THEN** it authenticates with the service token and the release gates pass.

#### Scenario: Cloudflare Images reads an accepted UAT image

- **WHEN** Cloudflare Images anonymously requests an accepted content-addressed object on the canonical UAT host
- **THEN** the published-media bypass permits the read while UAT Home and preview pages still require Access.

### Requirement: PRD artwork survives retirement of technical addresses

Approved PRD product artwork delivery and active Stripe Product image URLs SHALL use apex runtime media before finalization disables the PRD Workers' technical addresses. Preparation SHALL preserve old artwork delivery until those URLs have migrated. Migration SHALL NOT change prices, stock or unpublished content.

#### Scenario: Stripe still references a technical artwork origin

- **WHEN** finalization finds an active Product image outside apex runtime media
- **THEN** it refuses before making any retirement write.

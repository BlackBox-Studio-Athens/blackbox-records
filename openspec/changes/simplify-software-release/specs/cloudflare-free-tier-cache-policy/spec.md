## MODIFIED Requirements

### Requirement: Hosted page views stay within a Worker-request budget

The hosted public site SHALL keep Worker invocations per page view within a budget recorded in the Free-tier rule, so ordinary traffic cannot exhaust the account's shared daily Workers allowance. When the allowance is nevertheless exhausted, the site SHALL fail closed: it returns the platform error and serves no stale HTML.

#### Scenario: A visitor loads a hosted page for the first time

- **WHEN** a cold first visit loads a representative hosted route with its images, stylesheets, scripts, fonts and favicons
- **THEN** the HTML document costs at most one Pages Function invocation and one renderer invocation
- **AND** CMS image candidates are fetched from direct Images transform URLs without invoking the Pages Function or the renderer
- **AND** repo-owned static assets, including ESM images and every `/favicon*` file, are served by Pages assets without a Function invocation and with their bytes unchanged.

#### Scenario: A request targets a path the site does not have

- **WHEN** a request path is outside the allowlist generated from the release's routes
- **THEN** the gateway answers with a static `no-store` 404 without calling the renderer.

#### Scenario: The budget is recorded and checked

- **WHEN** a release changes hosted delivery
- **THEN** `docs/cloudflare-free-tier.md` records the Worker-requests-per-page-view budget for a cold first visit and a warm repeat view of representative routes
- **AND** the bounded UAT pilot measures both against the budget before the release is accepted, without load testing or cache warming.

#### Scenario: The Function allowance is exhausted

- **WHEN** the daily Workers allowance is exhausted
- **THEN** document requests receive the platform error until the allowance resets
- **AND** no stale HTML is served, because the Pages projects fail closed and ship no route HTML
- **AND** static assets such as `/_astro/*` and `robots.txt` remain available.

#### Scenario: A release or promotion runs

- **WHEN** a push or promotion builds and deploys a release
- **THEN** it makes no per-release snapshot or media reads through the CMS Worker, because builds restore no content
- **AND** the push's UAT static smoke is the only recurring release request cost, recorded in the Free-tier rule.

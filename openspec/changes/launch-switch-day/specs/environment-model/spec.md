## ADDED Requirements

### Requirement: PRD has one public address after launch

After launch, PRD SHALL be reachable only at `https://blackboxrecordsathens.com` and `https://staff.blackboxrecordsathens.com`. Requests to `blackbox-records-web.pages.dev` and its subdomains SHALL redirect permanently to the apex with path and query preserved, and the PRD Workers SHALL have no `workers.dev` address.

#### Scenario: Visitor opens an old technical address

- **WHEN** a visitor requests `https://blackbox-records-web.pages.dev/store/?q=lp` after launch
- **THEN** the response is a 301 to `https://blackboxrecordsathens.com/store/?q=lp`.

#### Scenario: Client calls the old API address

- **WHEN** a client requests the PRD backend `workers.dev` address after launch
- **THEN** no PRD Worker answers.

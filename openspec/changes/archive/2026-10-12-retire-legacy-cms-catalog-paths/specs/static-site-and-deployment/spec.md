## MODIFIED Requirements

### Requirement: Retired CMS entrypoints are absent

Public artifacts SHALL exclude Sveltia assets and return 404 for former `/admin/`, `/admin/config.yml` and `/admin/init.js` routes. Staff SHALL remain served by the combined Worker.

#### Scenario: Legacy editor URL is requested

- **WHEN** a visitor requests a former public admin route
- **THEN** the response is 404 and no writable CMS is served.

#### Scenario: Operator accepts the temporary cached legacy response exception

- **WHEN** the explicitly approved September 15 retirement dispatch verifies the pinned source, unchanged publication, prior passing provider evidence and fresh static results before the exception expires
- **THEN** only the five inventoried cached legacy responses may remain temporarily outstanding, their actual 200 results remain recorded, and every unrelated acceptance failure still blocks promotion.
- **AND** natural cache expiry must be verified separately; the exception does not change the final 404 behavior or permit new email-producing acceptance runs.

#### Scenario: Staff Pages is retired

- **WHEN** the detached staff Pages project is deleted after replacement acceptance
- **THEN** the live staff hostname, Access protection and combined Worker assets remain functional.

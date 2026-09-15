## ADDED Requirements

### Requirement: Retired CMS entrypoints are absent

Public artifacts SHALL exclude Sveltia assets and return 404 for former `/admin/`, `/admin/config.yml` and `/admin/init.js` routes. Staff SHALL remain served by the combined Worker.

#### Scenario: Legacy editor URL is requested

- **WHEN** a visitor requests a former public admin route
- **THEN** the response is 404 and no writable CMS is served.

#### Scenario: Staff Pages is retired

- **WHEN** the detached staff Pages project is deleted after replacement acceptance
- **THEN** the live staff hostname, Access protection and combined Worker assets remain functional.

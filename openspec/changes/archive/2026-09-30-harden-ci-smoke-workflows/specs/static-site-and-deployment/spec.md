## MODIFIED Requirements

### Requirement: UAT static smoke stays read-only

UAT Static Smoke SHALL verify the Cloudflare public site's routes, public assets, metadata, redirects, Review Site Marker, and checkout shell without modifying content or provider state.

#### Scenario: UAT static smoke runs

- **WHEN** the suite targets configured UAT
- **THEN** public artifacts contain no Sveltia runtime, writable CMS configuration, or staff page documents
- **AND** old admin links lead to the protected workspace or a clear retired state
- **AND** authenticated staff tests remain a separate explicitly scoped suite.

#### Scenario: Representative pages follow published content

- **GIVEN** UAT content was published with different artists, releases, news or Store Items
- **WHEN** the suite selects detail pages to probe
- **THEN** it discovers one artist, release and news page from the deployed sitemap and one Store Item from the deployed Store listing
- **AND** it asserts HTTP status, Review Site Marker, console and page errors, secret exposure, media origin and UI copy rather than content titles
- **AND** a section without a discoverable page fails with a message naming that section.

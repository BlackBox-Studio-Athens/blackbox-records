## MODIFIED Requirements

### Requirement: Distro listening is editable editorial content

Editors SHALL be able to supply the same optional Bandcamp player and Tidal source fields for Distro as for Releases. Supported URL validation, draft isolation, and accepted-content publication SHALL apply to both collections. Staff SHALL resolve supported HTTPS Bandcamp-hosted album and track page addresses automatically into canonical embeds while preserving official embed URL and iframe input. Unresolved input MUST remain outside saved content and block saving and review until resolved, reverted or cleared.

#### Scenario: Editor saves valid sources

- **WHEN** an editor saves valid Distro provider URLs
- **THEN** the values remain attached to that editorial item through save, reload, preview, publication, and accepted-content rendering
- **AND** the public site changes only when the reviewed content is published.

#### Scenario: Editor supplies an invalid provider URL

- **WHEN** a field contains an artist profile, custom domain or unsupported URL shape
- **THEN** provider validation reports the invalid field
- **AND** no unsupported source is saved or used to create a player.

#### Scenario: Editor pastes an album or track page

- **WHEN** the editor stops typing a supported page address for 750 ms
- **THEN** an authenticated bounded lookup obtains its validated recording identity and derives the house-style embed
- **AND** Ethos resolves to album 2345223781 and Hail resolves to track 1718987398, without substituting its parent album
- **AND** opening existing saved embeds performs no lookup or rewrite.

#### Scenario: Lookup fails or input changes

- **WHEN** lookup is pending, fails, or reports conflicting metadata
- **THEN** the previous saved source remains intact and saving/review are blocked with inline recovery actions
- **AND** navigation/unload protects unfinished input even when no other field changed
- **AND** superseded responses cannot overwrite newer input or another editor.

#### Scenario: Lookup crosses a trust boundary

- **WHEN** a request lacks editor authorization or same-origin protection, or an upstream response exceeds the deadline, redirect or decoded size limits
- **THEN** resolution fails without content writes, publication alarms or forwarding staff credentials
- **AND** every redirect is constrained to supported HTTPS Bandcamp recording pages.

#### Scenario: Existing content has no provider fields

- **WHEN** an older entry or draft has neither optional source field
- **THEN** it remains valid editable content
- **AND** its missing listening coverage remains an editorial follow-up, without breaking unrelated rendering or publication.

#### Scenario: Editor previews listening controls

- **WHEN** listening controls are shown inside the authenticated editorial preview
- **THEN** they are visible under the existing preview treatment but third-party players remain inert
- **AND** previewing does not publish or start playback.

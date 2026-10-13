# Catalog Listening Specification

## Purpose

Let visitors audition the exact music represented by Release and Distro catalog items through the site's existing player, with verifiable editorial sources and consistent access from browsing and item pages.

## Requirements

### Requirement: Listening coverage includes every music format

The site SHALL offer Listen for every Release and Distro music item with a verified supported source, including vinyl, CDs, tapes, singles, EPs, live albums, and splits. Stock, price, and checkout readiness MUST NOT determine listening availability.

#### Scenario: Visitor browses a music item

- **WHEN** a music item with a supported source appears on Home, a Store collection/category, a Distro format listing or expanded list, or its Store Item detail
- **THEN** its existing-style Listen action is available
- **AND** existing Release listings, Release details/overlays, and Artist discography listening remain available.

#### Scenario: Item cannot currently be purchased

- **WHEN** a sold-out item or an item with an unavailable price has supported listening data
- **THEN** Listen remains usable independently of purchase controls.

#### Scenario: Item has no verified recording source

- **WHEN** neither provider has been verified for that exact recording
- **THEN** the item remains visible with its normal information and purchase behavior, without a misleading or disabled Listen action
- **AND** catalog coverage identifies the item as unresolved rather than counting it as covered
- **AND** artist profiles, similarly named albums, and unrelated studio versions are not substituted.

#### Scenario: Non-music merchandise appears

- **WHEN** a garment or other non-music item has no recording to audition
- **THEN** it does not acquire an unrelated artist or release player merely to fill the Listen position.

### Requirement: Sources identify the exact recording

Listening metadata MUST identify the represented recording through a verified Bandcamp or Tidal source, including the official artist or label Bandcamp player wherever available and the Tidal release URL wherever verified. Catalog coverage MUST retain the evidence for each item and distinguish verified matches, unsuccessful searches, and ambiguous identities.

#### Scenario: Different physical editions contain the same recording

- **WHEN** CD and vinyl entries represent the same album
- **THEN** both entries can use the same verified album URLs
- **AND** they remain distinct sellable items.

#### Scenario: Item represents a live album or split

- **WHEN** a source is assigned to a live recording, EP, single, or split
- **THEN** its artist, recording identity, and available track context match that item
- **AND** a different performance, another album by the artist, or a single side presented as the whole split does not satisfy coverage.

#### Scenario: Search yields no Tidal match

- **WHEN** Tidal lookup does not establish an exact release URL
- **THEN** Tidal remains unset and the evidence says unverified or not found by the recorded search
- **AND** search failure is not represented as proof that the release is absent from Tidal.

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

- **WHEN** the editor stops typing a supported page address for 750 ms and Bandcamp supplies the recording metadata
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

#### Scenario: Bandcamp challenges the hosted request

- **WHEN** Bandcamp returns an HTTP 200 Client Challenge document without recording metadata
- **THEN** staff reports that automatic server lookup is blocked and directs the editor to Bandcamp's Share/Embed code
- **AND** the response remains private and no-store, the previous source stays intact, and no recording identity is guessed
- **AND** diagnostics record the provider-challenge category without credentials, page content or raw exception messages.

#### Scenario: Existing content has no provider fields

- **WHEN** an older entry or draft has neither optional source field
- **THEN** it remains valid editable content
- **AND** its missing listening coverage remains an editorial follow-up, without breaking unrelated rendering or publication.

#### Scenario: Editor previews listening controls

- **WHEN** listening controls are shown inside the authenticated editorial preview
- **THEN** they are visible under the existing preview treatment but third-party players remain inert
- **AND** previewing does not publish or start playback.

### Requirement: Listen is a separate accessible action

Listen SHALL open the existing single-session player without navigating to the item's purchase page. It SHALL be keyboard reachable and usable on narrow touch layouts while preserving ordinary item links and existing Store Crate gestures.

#### Scenario: Visitor activates Listen

- **WHEN** a visible Listen control is clicked, tapped, or activated with Enter or Space
- **THEN** the player opens for that item without following its item link
- **AND** the control is a button with visible focus and an accessible name.

#### Scenario: Visitor navigates or drags a card

- **WHEN** the visitor follows the item link or completes a Store Crate drag
- **THEN** the existing navigation or gesture completes
- **AND** it does not accidentally start a player
- **AND** cards hidden by the Store Crate do not expose extra keyboard stops.

#### Scenario: Both providers are available

- **WHEN** the visitor starts a new session without an existing provider preference
- **THEN** Bandcamp is selected first and Tidal is available through the existing provider switch
- **AND** a Tidal-only item opens Tidal directly.

#### Scenario: Visitor is only browsing

- **WHEN** a catalog page renders before listening intent
- **THEN** no per-item provider iframe or provider-discovery request is created
- **AND** the existing single-player load, close, minimize, switch-provider, and stop behavior governs listening after activation.

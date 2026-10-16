## MODIFIED Requirements

### Requirement: The home page presents current pre-orders

The home page SHALL show a Pre-orders section after its existing introduction and above News only while the rendered open pre-order projection lists a label-release pre-order. The section SHALL be in the page's HTML response, never inserted after paint. It SHALL present the approved cinematic video and artist-photo release chapters with sharp complete artwork, truthful price/status and real Store links. It SHALL add no content when none exists and SHALL NOT contact a video provider before explicit viewing intent. UAT-marked Home defaults to the two sample film chapters as its sole sample-data exception; it labels its details as samples and cannot activate selling or alter accepted content.

#### Scenario: Pre-orders exist

- **WHEN** the projection lists at least one release-sourced Store Item
- **THEN** the Home HTML contains the section, presenting current releases as successive chapters with badges and price, links to each Store Item page and to the Store with the Pre-orders filter on
- **AND** the existing Home introduction remains unchanged, the feature precedes News, and a single release has no dead next-release link.

#### Scenario: Home is painted

- **WHEN** a shopper loads Home directly or through the persistent shell
- **THEN** the Pre-orders section is present or absent from first paint
- **AND** the browser makes no listing or candidate read to decide whether the section appears, and no section appears or disappears after paint.

#### Scenario: Initial Home data read fails temporarily

- **WHEN** the renderer cannot use a stored projection while rendering Home
- **THEN** Home renders without the section, as for no pre-orders
- **AND** the browser starts no listing read, retry or recurring polling to insert it later; the next projection push restores it on a later page load.

#### Scenario: Shopper leaves during retry backoff

- **WHEN** Home unmounts or the shopper navigates away during or after first paint
- **THEN** no pre-order listing or candidate request, retry timer or late state update remains to cancel.

#### Scenario: A release has prepared original-file footage

- **WHEN** an accepted official clip has an available small native backdrop and at least 15% of its chapter is in view in a visible tab without a shell music session or full video playing
- **THEN** silent inline footage retains the desktop composition behind the centered artist, large album identity, ordering facts, pre-order link and complete square sleeve; below 48rem it plays in the opening 16:9 film strip with only a corner 44px icon-only Watch full video control over it
- **AND** further ordinary scrolling reveals the next pre-order without intercepted scrolling or video-time scrubbing
- **AND** only one ambient scene plays at a time, playback pauses automatically below 15% chapter visibility, in a hidden tab, during a shell music session or while the full video plays, and no manual motion control is rendered on any viewport.

#### Scenario: The selected release has a clip

- **WHEN** its accepted clip has no original-file backdrop
- **THEN** a complete still experience offers explicit full-video viewing without pretending a still image is playing video; below 48rem the opening 16:9 band shows the clip poster or, if absent, the band photo, with only the corner 44px icon-only Watch full video control over it
- **AND** no YouTube request occurs before that viewing intent.

#### Scenario: Shopper plays the selected official video

- **WHEN** the shopper activates explicit full-video Play or Watch with no conflicting music-player session
- **THEN** the privacy-enhanced YouTube embed requests `autoplay=1`, `playsinline=1`, `rel=0`, `color=white`, `controls=1` and `fs=1`, retaining native controls and fullscreen permission
- **AND** only that intent mounts a centered player panel with a Close button, without repeated artwork, album details or buying information; ambient playback pauses and closing removes the panel and restores focus to Watch.

#### Scenario: The video chapter is viewed before full-video intent

- **WHEN** a shopper views a video chapter on mobile or desktop
- **THEN** on desktop exactly one noninteractive sleeve appears in the hero; below 48rem the film-strip composition applies and a 160px sleeve beside artist, title and price replaces the band only when neither a clip nor band photo exists; the truthful physical shipping estimate is near the purchase action, and shell Listen remains available
- **AND** on desktop a video still or artist photograph supplies the backdrop rather than a repeated album cover; below 48rem the prepared film, or its poster/band-photo fallback, occupies the band with exactly one corner 44px icon-only Watch full video control and no other overlay; the lower player panel is absent.

#### Scenario: The current official-video title is shown

- **WHEN** the pre-order section presents an official video
- **THEN** it shows only the title of the clip used for the background and explicit Play action, as noninteractive text without an underline or pointer affordance
- **AND** other video titles are omitted.

#### Scenario: The selected release has no clip

- **WHEN** its release has no official clip
- **THEN** on desktop its own artist photograph, complete sharp square sleeve, artist/title, available shell Listen, metadata and separate price/purchase band form the approved no-video composition; below 48rem its band photo forms the opening 16:9 band without a Watch control
- **AND** faces remain recognizable, text remains readable and a missing photograph gives a purposeful cover-only layout without borrowing another release's film; below 48rem a release with neither clip nor band photo shows a 160px sleeve beside artist, title and price instead of a band.

#### Scenario: Mobile, reduced motion or data saving

- **WHEN** the viewport is narrow, motion is reduced, or the browser requests data saving
- **THEN** identity and purchase information remain readable with reachable 44px controls and no horizontal overflow
- **AND** below 48rem chapters use the 16:9 film-strip composition with copy beneath rather than over the media; reduced motion/data saving keep a poster until explicit intent and disable sticky choreography.

#### Scenario: Ambient playback cannot start

- **WHEN** playback is rejected or a media source fails
- **THEN** a complete poster, artwork, truthful ordering information and real Store link remain usable
- **AND** a failure does not cause a retry loop or a misleading motion control.

#### Scenario: A persistent music-player session exists

- **WHEN** the shell owns a listening session, including a minimized one
- **THEN** the showcase preserves that session, pauses ambient media and prevents competing in-place full-video audio
- **AND** clear shopper guidance and the existing shell controls allow a deliberate subsequent video choice; stopping the session restores eligible ambient behavior under the automatic playback rules.

#### Scenario: No pre-orders or a failed read

- **WHEN** the projection lists no release-sourced pre-order, or the renderer holds no projection
- **THEN** the Home HTML has no section and News follows the hero as today
- **AND** cached artwork never establishes price, stock or buying eligibility; pressing a pre-order link still reaches the Store Item page and its authoritative offer read.

#### Scenario: Phone film-strip chapter composition

- **WHEN** a Home pre-order chapter renders below 48rem
- **THEN** the chapter opens with a 16:9 band using the prepared film whenever the release has a video and prepared film is available; a clip without prepared film uses its poster, else the band photo, with exactly one corner 44px icon-only Watch full video control and no other overlay
- **AND** a release without a clip shows the band photo without a control; when neither clip nor band photo exists, a 160px sleeve beside artist, title and price replaces the band
- **AND** artist, title, format and price row, status line, the Sea Pre-order and amber Listen pair (44px high, equal halves), international notice line and terms link follow beneath the band
- **AND** desktop composition is unchanged; final measured heights remain unverified.

### Requirement: Home background playback has no text play control

The Home pre-order film SHALL omit all manual background motion controls on every viewport, preserve poster fallback and preference-aware muted playback, and retain automatic playback rules and explicit full-video playback. The owner knowingly chose removal on 16 October 2026 after the earlier accessibility retention decision, with reduced motion as the opt-out.

#### Scenario: Shopper views a film chapter

- **WHEN** a Home video pre-order chapter renders
- **THEN** no Play background text button is shown
- **AND** Watch full video and Listen retain their existing behavior

#### Scenario: Motion is restricted

- **WHEN** reduced motion or data saving applies, or ambient playback fails
- **THEN** the complete poster remains available without a text background-play control

#### Scenario: Eligible film startup is interrupted

- **WHEN** an eligible muted film's initial play is interrupted while its media loads
- **THEN** media readiness can resume playback without requiring a tab visibility change or a page refresh
- **AND** an interruption is not treated as a permanent autoplay refusal; genuine autoplay refusal or a failed source retains the poster without a retry loop.

#### Scenario: Loaded film is temporarily paused

- **WHEN** an already activated film becomes ineligible because it is off screen, the document is hidden, a music session exists or the full video is open
- **THEN** it pauses while retaining its selected source, and resumes when eligible without restarting resource selection
- **AND** initial reduced-motion and data-saving visits do not attach or request the film source.

#### Scenario: A cold film loads before playback can begin

- **WHEN** an eligible film has not buffered enough data to play
- **THEN** it loads its selected source and keeps the poster until media readiness starts muted playback
- **AND** native startup can initiate loading even when preload hints are ignored; readiness can resume interrupted startup without a timer or polling.

#### Scenario: A delayed startup result arrives after playback

- **WHEN** an older play request rejects after the film has started playing
- **THEN** the rejection cannot conceal or pause current playback
- **AND** media playing, pause and error events own the shown film state; genuine refusal while paused keeps the poster without recurring retries.

#### Scenario: Owner tests PRD-style film chapters on UAT without CMS access

- **WHEN** a UAT-marked build receives Home
- **THEN** it renders the two PRD-style chapters with prepared test footage through the normal server markup and playback component, clearly labels the sample details and directs purchase links to the UAT Store
- **AND** no query switch is required; the fixture changes no accepted content, stock, prices or publication pointer, and builds without the UAT marker remain projection-driven.

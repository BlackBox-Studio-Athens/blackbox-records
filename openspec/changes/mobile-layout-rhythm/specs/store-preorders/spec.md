## MODIFIED Requirements

### Requirement: The home page presents current pre-orders

The home page SHALL show a Pre-orders section after its existing introduction and above News only while the rendered open pre-order projection lists a label-release pre-order. The section SHALL be in the page's HTML response, never inserted after paint. It SHALL present the approved cinematic video and artist-photo release chapters with sharp complete artwork, truthful price/status and real Store links. It SHALL add no content when none exists and SHALL NOT contact a video provider before explicit viewing intent.

#### Scenario: Pre-orders exist

- **WHEN** the projection lists at least one release-sourced Store Item
- **THEN** the Home HTML contains the section, presenting current releases as successive chapters with plain truthful lifecycle lines and price, links to each Store Item page and to the Store with the Pre-orders filter on
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

- **WHEN** an accepted official clip has an available small native backdrop and its scene becomes meaningfully visible
- **THEN** eligible silent inline footage retains the desktop chapter composition; phones contain its wide frame above readable copy, complete square sleeve and compact purchase facts
- **AND** further ordinary scrolling reveals the next pre-order without intercepted scrolling or video-time scrubbing
- **AND** only one ambient scene plays at a time, offscreen/hidden-document playback pauses, and manual pause remains effective when returning on every viewport, including phones with the retained 44×44 pause/resume icon.

#### Scenario: The selected release has a clip

- **WHEN** its accepted clip has no original-file backdrop
- **THEN** a complete still experience offers explicit full-video viewing without pretending a still image is playing video
- **AND** no YouTube request occurs before that viewing intent.

#### Scenario: Shopper plays the selected official video

- **WHEN** the shopper activates explicit full-video Play or Watch with no conflicting music-player session
- **THEN** the privacy-enhanced YouTube embed requests `autoplay=1`, `playsinline=1`, `rel=0`, `color=white`, `controls=1` and `fs=1`, retaining native controls and fullscreen permission
- **AND** only that intent mounts a centered player panel with a Close button, without repeated artwork, album details or buying information; ambient playback pauses and closing removes the panel and restores focus to Watch.

#### Scenario: The video chapter is viewed before full-video intent

- **WHEN** a shopper views a video chapter on mobile or desktop
- **THEN** exactly one complete noninteractive sleeve appears in the chapter, the truthful physical shipping estimate is near the purchase action, and shell Listen remains available
- **AND** a video still or artist photograph supplies the backdrop rather than a repeated album cover; the lower player panel is absent.

#### Scenario: The current official-video title is shown

- **WHEN** the pre-order section presents an official video
- **THEN** it shows only the title of the clip used for the background and explicit Play action, as noninteractive text without an underline or pointer affordance
- **AND** other video titles are omitted.

#### Scenario: The selected release has no clip

- **WHEN** its release has no official clip
- **THEN** its own contained 16:9 artist photograph, complete sharp square sleeve, artist/title, compact metadata and shared Pre-order/Listen pair form the approved no-video composition
- **AND** faces remain recognizable, text remains readable and a missing photograph gives a purposeful cover-only layout without borrowing another release's film.

#### Scenario: Mobile, reduced motion or data saving

- **WHEN** the viewport is narrow, motion is reduced, or the browser requests data saving
- **THEN** identity and purchase information remain readable with reachable 44px controls and no horizontal overflow
- **AND** phones contain the film/photo/poster at 16:9 inside 16px gutters at 390px, place copy in ordinary opaque flow and keep the accessible 44×44 pause/resume icon when the chapter offers ambient film playback; reduced motion/data saving keep a poster until explicit intent and disable sticky choreography.

#### Scenario: Ambient playback cannot start

- **WHEN** playback is rejected or a media source fails
- **THEN** a complete poster, artwork, truthful ordering information and real Store link remain usable
- **AND** a failure does not cause a retry loop or a permanently misleading Pause label.

#### Scenario: A persistent music-player session exists

- **WHEN** the shell owns a listening session, including a minimized one
- **THEN** the showcase preserves that session, pauses ambient media and prevents competing in-place full-video audio
- **AND** clear shopper guidance and the existing shell controls allow a deliberate subsequent video choice; stopping the session restores eligible ambient behavior without overriding retained manual pause on any viewport.

#### Scenario: No pre-orders or a failed read

- **WHEN** the projection lists no release-sourced pre-order, or the renderer holds no projection
- **THEN** the Home HTML has no section and News follows the hero as today
- **AND** cached artwork never establishes price, stock or buying eligibility; pressing a pre-order link still reaches the Store Item page and its authoritative offer read.

#### Scenario: Phone purchase facts form a compact chapter

- **WHEN** a Home chapter renders below 40rem
- **THEN** it shows contained media, complete sleeve, artist, ink Veneer title, plain lifecycle lines and format/price with truthful shipping once
- **AND** Sea-filled Pre-order and amber-outlined Listen share an equal-width 44px row with a 16px gap, omitting Listen when no source exists
- **AND** facts, summary and existing delivery/All pre-orders links follow without duplicate purchase bands, full-bleed rules or a fixed height that clips content.

### Requirement: Home background playback has no text play control

The Home pre-order film SHALL omit Play background text controls and retain a 44×44 pause/resume icon on phones and desktop when eligible ambient film playback is available. It SHALL preserve manual pause, poster fallback, automatic visibility/tab/player pausing, reduced-motion/data-saving handling and explicit full-video intent. The icon SHALL have visible focus and an accessible name reflecting its state.

#### Scenario: Shopper views a film chapter

- **WHEN** a Home video pre-order chapter renders
- **THEN** no Play background text button is shown, and eligible film chapters retain the 44×44 pause/resume icon on phones and desktop
- **AND** Watch full video and Listen retain their existing behavior

#### Scenario: Motion is restricted

- **WHEN** reduced motion or data saving applies, or ambient playback fails
- **THEN** the complete poster remains available without a text background-play control

#### Scenario: Phone has an active shell music session

- **WHEN** the shell owns a session or the chapter is hidden or offscreen
- **THEN** ambient playback pauses automatically alongside the retained manual pause behavior
- **AND** failed/refused autoplay keeps complete poster content and does not mount a video provider.

#### Scenario: Phone visitor pauses the chapter film

- **WHEN** a phone visitor activates the 44×44 pause/resume icon by touch or keyboard
- **THEN** the film pauses and the accessible name changes to describe resuming
- **AND** moving focus away or revisiting the chapter does not undo manual pause; explicit resume remains available when motion is eligible.

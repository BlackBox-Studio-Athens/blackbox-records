## MODIFIED Requirements

### Requirement: The home page presents current pre-orders

The home page SHALL show a release chapters section after its existing introduction and above News only while the rendered projection lists a label-release pre-order, or lists a Home offer for a release that staff switched on for Home. The section keeps its Pre-orders anchor and its hidden heading names it for assistive technology. The section SHALL be in the page's HTML response, never inserted after paint. It SHALL present the approved cinematic video and artist-photo release chapters with sharp complete artwork, truthful price/status and real Store links. Open pre-orders come first, then switched-on releases, newest release date first. It SHALL add no content when none exists and SHALL NOT contact a video provider before explicit viewing intent.

#### Scenario: Pre-orders exist

- **WHEN** the projection lists at least one release-sourced Store Item on an open pre-order
- **THEN** the Home HTML contains the section, presenting current releases as successive chapters with badges and price, links to each Store Item page and to the Store with the Pre-orders filter on
- **AND** the existing Home introduction remains unchanged, the feature precedes News, and a single release has no dead next-release link.

#### Scenario: A switched-on release has no open pre-order

- **WHEN** staff switched on Show on Home for a release whose Store Item has a Home offer and no open pre-order
- **THEN** the Home HTML contains its chapter after any pre-order chapters, with the same video or photo composition, artist, title, Listen and Watch full video as when it was a pre-order
- **AND** a release that is switched on but has no Home offer, or is not switched on and has no open pre-order, has no chapter

#### Scenario: An in-stock chapter shows an ordinary Buy action

- **WHEN** a chapter's Home offer is stocked
- **THEN** its action is a format-aware Buy action (Buy vinyl, Buy CD, Buy cassette, otherwise Buy) in the Buy colour, with the disc icon for vinyl, linking to the Store Item page
- **AND** it shows a muted Out now status with no pre-order badge and no stock count, no shipping estimate line, and a Delivery information terms link to the same terms page
- **AND** the Sea Pre-order colour and wording never appear on it

#### Scenario: A sold-out chapter has no action

- **WHEN** a chapter's Home offer is sold out
- **THEN** the purchase slot shows the static Sold out status with the Flint edge and no action, with the muted Out now status and the Delivery information link
- **AND** Listen and Watch full video remain, and the chapter shows the Store listing's price text only when the listing shows one

#### Scenario: A chapter changes state

- **WHEN** a chapter's pre-order closes, or its copies sell out, in a later projection
- **THEN** the next render shows the matching state without moving the chapter's media, title or Listen
- **AND** the live offer read on the Store Item page remains the authority for what a shopper can buy

#### Scenario: The section link follows the chapters

- **WHEN** at least one chapter is a pre-order
- **THEN** the closing link reads All pre-orders and opens the Store with the Pre-orders filter on
- **AND** otherwise it reads Visit the Store and opens the Store without a pre-order filter

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
- **THEN** silent inline footage plays behind the centered artist, large album identity, ordering facts, pre-order link and complete square sleeve
- **AND** further ordinary scrolling reveals the next pre-order without intercepted scrolling or video-time scrubbing
- **AND** only one ambient scene plays at a time, offscreen/hidden-document playback pauses, and manual pause remains effective when returning.

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
- **THEN** exactly one noninteractive sleeve appears in the hero, the truthful physical shipping estimate is near the purchase action, and shell Listen remains available
- **AND** a video still or artist photograph supplies the backdrop rather than a repeated album cover; the lower player panel is absent.

#### Scenario: The current official-video title is shown

- **WHEN** the pre-order section presents an official video
- **THEN** it shows only the title of the clip used for the background and explicit Play action, as noninteractive text without an underline or pointer affordance
- **AND** other video titles are omitted.

#### Scenario: The selected release has no clip

- **WHEN** its release has no official clip
- **THEN** its own artist photograph, complete sharp square sleeve, artist/title, available shell Listen, metadata and separate price/purchase band form the approved no-video composition
- **AND** faces remain recognizable, text remains readable and a missing photograph gives a purposeful cover-only layout without borrowing another release's film.

#### Scenario: Mobile, reduced motion or data saving

- **WHEN** the viewport is narrow, motion is reduced, or the browser requests data saving
- **THEN** identity and purchase information remain readable with reachable 44px controls and no horizontal overflow
- **AND** phones preserve the film's wide frame and place copy on an opaque band; reduced motion/data saving keep a poster until explicit intent and disable sticky choreography.

#### Scenario: Ambient playback cannot start

- **WHEN** playback is rejected or a media source fails
- **THEN** a complete poster, artwork, truthful ordering information and real Store link remain usable
- **AND** a failure does not cause a retry loop or a permanently misleading Pause label.

#### Scenario: A persistent music-player session exists

- **WHEN** the shell owns a listening session, including a minimized one
- **THEN** the showcase preserves that session, pauses ambient media and prevents competing in-place full-video audio
- **AND** clear shopper guidance and the existing shell controls allow a deliberate subsequent video choice; stopping the session restores eligible ambient behavior without overriding manual pause.

#### Scenario: No pre-orders or a failed read

- **WHEN** the projection lists no release-sourced pre-order and no Home offer for a switched-on release, or the renderer holds no projection
- **THEN** the Home HTML has no section and News follows the hero as today
- **AND** cached artwork never establishes price, stock or buying eligibility; pressing a pre-order link still reaches the Store Item page and its authoritative offer read.

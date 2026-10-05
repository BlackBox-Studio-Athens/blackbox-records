## MODIFIED Requirements

### Requirement: The home page presents current pre-orders

The home page SHALL show a Pre-orders section after its existing introduction and above News only while fresh listing data reports a buyable label-release pre-order. It SHALL present the approved cinematic video and artist-photo release chapters with sharp complete artwork, truthful price/status and real Store links. It SHALL add no content when none exists and SHALL NOT contact a video provider before explicit viewing intent.

#### Scenario: Pre-orders exist

- **WHEN** at least one release-sourced Store Item is a buyable pre-order
- **THEN** the section presents current releases as successive chapters with badges and price, links to each Store Item page and to the Store with the Pre-orders filter on
- **AND** the existing Home introduction remains unchanged, the feature precedes News, and a single release has no dead next-release link.

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

- **WHEN** the video choices present the current clip
- **THEN** one clip uses “Official video” for the visible and accessible group label; multiple clips use “Official videos”
- **AND** that title is noninteractive current-video text without an underline or pointer affordance, including when only one clip exists
- **AND** other clips remain keyboard-accessible buttons that select their poster and tear down any playing iframe until explicit viewing is activated again.

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

- **WHEN** no buyable pre-order exists or the fresh read fails
- **THEN** the section is absent and News follows the hero as today
- **AND** cached artwork never establishes price, stock, buying eligibility or a new publication.

### Requirement: Pre-order presentation stays within the visual language

Pre-order status SHALL use one Sea green accent as an outline or edge, never as a resting fill, alongside the existing monochrome language. Controls SHALL keep the existing purchase geometry and accessibility, except the approved Home film's wider 300px desktop link. Home SHALL preserve Veneer identity, Bebas prices/actions, Inter information and intact original artwork.

#### Scenario: Badge and action render

- **WHEN** a pre-order badge or action is shown on any surface
- **THEN** the badge is an outline with text at 4.5:1 contrast or better, and the action is the primary control with a Sea green base line that fills on hover or keyboard focus
- **AND** targets are at least 44px, text does not clip at 200% zoom or 390px width, and reduced-motion preferences are respected.

#### Scenario: Approved Home artwork and layout render

- **WHEN** a video or no-video Home chapter is viewed at narrow mobile, small laptop or wide desktop dimensions
- **THEN** original square covers retain their detail and framing, album and artist are distinct, and actual metadata and shipping estimates remain readable
- **AND** screenshot crops, fake shopping controls, prototype instructions and fixture catalog values never appear as live product content.

#### Scenario: Refined Home identity and navigation render

- **WHEN** an approved Home chapter is displayed
- **THEN** covers are noninteractive, accepted artist paths produce subtle profile links, and missing paths retain plain artist text
- **AND** video chapters omit the repeated album details block; a next chapter offers only a visible down-arrow with a descriptive accessible label.

#### Scenario: Home purchase information and Base sweep render

- **WHEN** a shopper views or interacts with a Home pre-order action
- **THEN** the existing Sea green baseline remains static at rest and fills upward over 240ms on hover or keyboard focus, without shifting the text or action
- **AND** reduced motion uses an immediate state change and touch has press feedback
- **AND** the Home section retains truthful shipping information and an existing terms link instead of repeated payment/whole-parcel copy; purchase and checkout disclosures remain unchanged.

## ADDED Requirements

### Requirement: Released music has one typed lifecycle label

Public and Staff presentation SHALL use Digital out now as the single released-music badge. Their shared lifecycle label types SHALL exclude the obsolete Out now badge while retaining independent physical stock and shipping states.

#### Scenario: Digital release precedes physical arrival

- **WHEN** the album's release date has arrived and its physical edition is still on pre-order
- **THEN** Home, Releases, Store and Staff previews use Digital out now alongside the truthful pre-order estimate without local wording translation
- **AND** a missing or future album release date cannot produce a released-music badge.

### Requirement: Releases styling survives shell entry

Releases SHALL retain its approved typography, wrapping and date separation whether opened directly or reached from a fresh Home document through the persistent shell.

#### Scenario: Shopper enters Releases from Home

- **WHEN** a shopper follows the Releases navigation link from Home in Chromium or Firefox at mobile or desktop width
- **THEN** badges use the same mono type, uppercase treatment and spacing as direct entry, without the old bordered chip treatment or a date touching the badge row
- **AND** navigation preserves the persistent player.

### Requirement: Current inventory determines stock and scarcity

Public stock availability and opted-in copies-left notices SHALL derive from current buyable inventory including valid checkout holds. Staff's live summary and current stock view SHALL reflect the same authority after immediate stock changes.

#### Scenario: Staff configures a low-stock notice

- **WHEN** Staff enables Show copies left and the edition has between one and five copies available to buy online
- **THEN** its Store surfaces show the actual Only N left notice with an enabled purchase action
- **AND** zero buyable copies cannot produce a low-stock notice or an enabled purchase action, including while copies are held by valid checkouts.

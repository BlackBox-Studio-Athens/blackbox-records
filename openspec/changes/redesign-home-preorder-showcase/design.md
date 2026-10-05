# Design

## Context

The user approved the revised interactive canvas on 5 October 2026:
`C:/Users/SVall/.codex/visualizations/2026/10/02/01a0fd0b-2cff-7363-a14e-9668c2245584/preorders-film-canvas.html`.
See proposal.md for motivation. The existing accepted showcase JSON supplies editorial information; an independent uncached listing read establishes current buying eligibility, price and shipping. Preserve this separation.

## Goals / Non-Goals

Deliver the approved centered video scene and the completed Afterwise photo chapter in the actual Home section, directly after its existing introduction and before News. Preserve genuine catalog content, shell listening and Store Item links. This change does not modify stock, checkout, publication authority, staff editing, hosting plans or deploy an environment.

## Decisions

### Approved visual contract

- Video: large native film backdrop; centered artist and large Veneer title; existing truthful release/ship badges; format/Bebas price; 300 × 54px pre-order link; complete sharp square sleeve; explicit background pause and full-video actions.
- Video: exactly one sleeve in the hero; shipping beside the purchase action. The repeated lower sleeve, album details and facts are removed. Only explicit Watch mounts a centered full-width mobile player and Close button below the film, without another cover or purchase block. Closing removes the panel and returns focus to Watch. Listen remains available with the media actions. A real video still or artist photograph supplies the poster; never repeat the sleeve as a backdrop.
- Further scrolling introduces the next pre-order; a small down-arrow offers a descriptive, keyboard-accessible chapter link without repeating the next artist/title.
- No video: the actual grayscale band photograph with recognizable faces above the identity, a large complete sleeve, artist/title, existing Listen, facts row and a separate description/price/purchase band. No borrowed video or generic compact placeholder.
- Mobile: preserve the wide film; put identity on an opaque band. The photograph remains complete with an overlapping square sleeve, then identity/facts/purchase. Use 16px gutters, 44px targets and ordinary flow.
- Load actual Veneer, Bebas and Inter through the app. Use existing monochrome tokens and sea-green edges; no rasterized interface, fake cart feedback, generated sleeves, invented facts or additional navigation.

The canvas's originals establish detail expectations: LOTUS 1200px, Disintegration 1440px, Afterwise photograph 2048px. Production artwork remains accepted editorial content, not copied fixture authority. Emit suitable existing image profiles; never sample screenshots or enlarge thumbnails. Following the user's 5 October refinement approval, Home artwork is noninteractive and opens no new tab.

### Approved refinement canvas

The user selected Base sweep from `preorder-button-motion.html` in the same native canvas directory. Home pre-order actions remain static at rest, with their existing Sea green baseline. On hover or keyboard focus, native CSS raises that green fill over 240ms without moving the label or control. Reduced motion switches immediately; touch receives press feedback. This motion exception applies only to the Home showcase, adds no dependency and changes no purchase destination.

Home purchase focus keeps the visible contrasting outline flush with the filled action. The shared button's 2px outline offset otherwise leaves an unfilled-looking strip in Firefox even when the sweep itself covers the face.

Home omits repeated payment/whole-parcel copy and the Payment fact. A quiet “Pre-order & delivery information” link on its own line, with at least 16px of space from the preceding purchase or shipping content, leads to existing terms; Store, cart and checkout disclosures remain unchanged. Artist names subtly link through accepted StoreItem.artistPath when available, using existing shell navigation. Their underlines trim the trailing letter spacing so text and rule align. Missing paths remain plain text, and a stale local catalog must not suppress a valid accepted production path. Public PRD Sidus profile content may support an isolated read-only review fixture, including its existing artist-modal endpoint, never live catalog or commerce authority.

### Native media, without another scroll library

Use native video, CSS and visibility observation. Reuse the reviewed silent 12-second local excerpt (approximately 0.86MB) derived from the authorized original source; retain the original file unchanged. A compiled media mapping for the known official video attaches this local backdrop to that accepted clip only. Unmapped official videos keep a still and explicit unobstructed YouTube viewing. This avoids adding a CMS media uploader or new runtime dependency for one prepared clip.

Use ordinary scrolling on every viewport. The former desktop sticky hold and detail-block spacer are unnecessary with the repeated details removed. Do not scrub video time, intercept wheel gestures or add a second animation loop.

### Playback and shell ownership

Ambient video is always muted and inline. Attach/play it only near a visible scene, pause offscreen or when the document is hidden, and preserve manual pause. Reduced motion, data saving, source failure and autoplay rejection retain a complete poster experience without repeated retries.

The shell remains the owner of Bandcamp/Tidal sessions. A small document-level shell session attribute, maintained by its existing session controller, provides a bounded read-only signal to the showcase. Ambient playback pauses while a shell session exists. Full-video intent must preserve that session and prevent simultaneous local/provider audio; shopper guidance can require stopping the existing player before in-place video viewing. Listen uses current shell triggers.

Full viewing retains the existing privacy-enhanced YouTube parameters, controls and fullscreen, with no overlay or cropping of provider UI. Current clip titles remain noninteractive; switching clips removes the playing iframe until explicit Play/Watch.

### Existing commerce and publication rules

Keep current buyable-pre-order filtering, accepted editorial caching, fresh prices and real Store Item links. A full album's release state is independent of a single/video being available. Unknown estimates and metadata stay truthful. No eligible pre-orders or a failed read removes the section; one release has no dead next-release link.

## Risks / Trade-offs

- Multiple media requests or loops: lazy source attachment and one eligible ambient scene; explicit provider intent.
- Small or unavailable editorial images: use intact originals/suitable profiles and cover-only fallback, without inventing a band photo.
- Cached editorial data becoming commerce authority: retain the separate fresh Worker read and its existing availability gate.
- Moving imagery obscuring text/faces: approved scrim, bounded crop, mobile separation and screenshot comparison across viewports.
- Local checks cannot prove iPhone autoplay/provider or hosted quotas: record those limits, keep deployment separate and consume no hosted transformation quota during development.

## Migration Plan

Implement and verify in the explicitly authorized managed worktree. Add only the small prepared media derivative and scoped presentation changes. Keep local fixture/evidence data outside live authority. Existing software-release gates apply to a later requested promotion; reverting the change restores the prior showcase.

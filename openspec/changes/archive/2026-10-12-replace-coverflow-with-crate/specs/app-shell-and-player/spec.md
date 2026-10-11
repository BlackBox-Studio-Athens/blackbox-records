## ADDED Requirements

### Requirement: Every listening action identifies the existing session

The shell SHALL mark shared controls for the active editorial source as disabled amber In player status across Store, Releases and details. Other sources SHALL retain Listen. The floating player's Open and Stop actions SHALL remain available on desktop and mobile. Status MUST NOT claim verified playback.

#### Scenario: A session is minimized and its source appears elsewhere

- **WHEN** shell navigation, cached restoration or detail rendering shows the active source
- **THEN** its listening control displays In player and cannot open a second session
- **AND** the floating player remains the place to reopen or stop the existing session.

#### Scenario: A session is stopped or replaced

- **WHEN** Stop ends the session or another source replaces it
- **THEN** all previously matching controls return to their original enabled label
- **AND** a cached page is synchronized with the current source when restored.

#### Scenario: Store cards offer listening

- **WHEN** a Store collection renders a record with a verified source
- **THEN** its 112 × 44px listening action appears below artwork and before the title in Grid
- **AND** source-less records retain row alignment without displaying an invented action.
- **AND** Grid actions align with card text.

#### Scenario: The Store Crate's item in hand listens from its own card

- **WHEN** the Store Crate holds an item with a verified source
- **THEN** that item's own Store card offers its Listen action beside the bin, with its source, provider data and current session state
- **AND** activating it opens the player for that item, and closing the player returns focus to it
- **AND** it displays In player while that source is the active session.

#### Scenario: Stop is pressed once

- **WHEN** the shopper activates Stop in the floating player
- **THEN** the control reads Stop? and keeps its accessible name and position
- **AND** the session continues
- **AND** the control returns to Stop after three seconds without a second activation.

#### Scenario: Stop is pressed twice

- **WHEN** the shopper activates Stop? within the window
- **THEN** the session ends with the existing Stop semantics, including focus restoration and iframe removal.

## MODIFIED Requirements

### Requirement: Shell scrolling follows the input device and idles when still

The app shell SHALL smooth scrolling only where it smooths something, SHALL run no scroll animation loop while nothing scrolls, and SHALL lock background scrolling for shell modals without depending on a smooth-scroll library.

#### Scenario: Visitor uses a coarse or hover-less pointer

- **WHEN** the device matches `(hover: none)` or `(pointer: coarse)`
- **THEN** no smooth-scroll instance is constructed and no non-passive wheel or touch listener is installed on the document
- **AND** native scrolling, immediate navigation resets, in-page anchors, and focus restoration still go through the shell scroll API.

#### Scenario: Visitor scrolls with a wheel on a fine pointer

- **WHEN** the device has a fine pointer with hover and smooth scrolling is kept on desktop
- **THEN** one smooth-scroll instance owns the window, and nested scroll roots stay native unless a measured need is recorded
- **AND** its animation-frame loop starts on wheel input, keyboard scrolling, or a programmatic smooth scroll and stops once every instance reports it is not scrolling
- **AND** reduced motion, `data-lenis-prevent` panes, iframes, form controls, and the Store Crate stage keep native scrolling.

#### Scenario: Desktop smooth scrolling costs more than native scrolling

- **WHEN** the same-session desktop idle and wheel-scroll profiles show the on-demand smooth-scroll runtime measurably costlier than native scrolling
- **THEN** the shell uses native scrolling on every device
- **AND** the shell scroll API keeps the same immediate-reset, anchor, focus, and modal-lock behavior.

#### Scenario: A shell modal is open

- **WHEN** the player modal, detail overlay, cart drawer, or mobile menu is open
- **THEN** background scrolling is locked through shell body state using overflow clipping and overscroll containment
- **AND** the lock works whether or not a smooth-scroll instance exists
- **AND** scrollable panes inside the open surface still scroll, and closing the last open surface releases the lock.

#### Scenario: Home hero crosses its threshold

- **WHEN** the visitor scrolls Home past the coarse hero threshold or back above it
- **THEN** the threshold state flips from the scroll runtime's signal or an IntersectionObserver sentinel
- **AND** no animation-frame callback or layout read runs per scroll event solely to detect the threshold.

### Requirement: Public shell scrolling uses one lifecycle-owned Lenis runtime

The public frontend SHALL route smooth document and first-party panel scrolling through one app-shell-owned Lenis runtime. It SHALL preserve immediate scroll resets, focus restoration, browser history, shell anchors, and the persistent player lifecycle.

#### Scenario: Visitor smoothly follows an in-page target

- **GIVEN** the public app shell is active and a target exists in the document or an owned overlay
- **WHEN** the visitor activates an in-page or explicit smooth-scroll action
- **THEN** the matching Lenis scroll root moves to the existing offset and alignment
- **AND** route and hash handling remain owned by the app shell.

#### Scenario: Shell navigation swaps the active section

- **WHEN** shell navigation replaces rendered section content or restores a history entry
- **THEN** the new position is applied immediately and focus remains on the shell main region
- **AND** no previous Lenis inertia carries into the new section.

#### Scenario: Reduced motion or a native-owned surface is active

- **WHEN** the visitor prefers reduced motion or interacts with a form control, iframe, embedded player, or the Store Crate stage
- **THEN** the system honors immediate or native scrolling for that interaction
- **AND** each runtime instance is removed or refreshed when its owned surface disconnects.

### Requirement: Store browsing preserves orientation and truthful availability

Store view controls SHALL stay mounted during Crate movement and filtering. Repeating a format selection SHALL preserve the Crate's item in hand. Static cards MUST NOT claim current availability from build-time data; live Store Offer details remain authoritative.

#### Scenario: Visitor browses a product with several images

- **WHEN** the visitor opens a Store Item with additional source images
- **THEN** the artwork area presents every image through thumbnails, previous/next controls, keyboard navigation, and touch swipes
- **AND** Motion respects reduced-motion preferences, artwork remains uncropped, and single-image items remain static.

#### Scenario: Visitor follows an artist provider link

- **WHEN** Bandcamp or TIDAL appears among an artist's links
- **THEN** the link uses its provider's recognizable brand mark with its existing accessible name.

## REMOVED Requirements

### Requirement: Matching listening actions identify the existing session

**Reason**: Renamed so the Coverflow scenario can be replaced by its Store Crate scenario; every other scenario is unchanged.

**Migration**: Use "Every listening action identifies the existing session".

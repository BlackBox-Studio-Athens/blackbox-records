## ADDED Requirements

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

- **WHEN** the visitor prefers reduced motion or interacts with a form control, iframe, embedded player, or horizontal Coverflow
- **THEN** the system honors immediate or native scrolling for that interaction
- **AND** each runtime instance is removed or refreshed when its owned surface disconnects.

### Requirement: Public coordinated transitions use Motion without changing shell ownership

First-party coordinated public transitions SHALL use cancellable Motion animations. They MUST preserve existing route loading semantics, overlay focus, dialog behavior, and the identity of an active player iframe. Reduced motion SHALL complete transitions without spatial motion or decorative repetition.

#### Scenario: Navigation or an overlay transition is interrupted

- **WHEN** a transition is superseded, its surface closes, or the owning component unmounts
- **THEN** its animation is stopped and cleaned up
- **AND** no stale callback changes the current route, locks scrolling, or disables controls.

### Requirement: Store browsing preserves orientation and truthful availability

Store view controls SHALL stay mounted during Coverflow movement and filtering. Repeating a format selection SHALL preserve the active Coverflow item. Static cards MUST NOT claim current availability from build-time data; live Store Offer details remain authoritative.

#### Scenario: Visitor browses a product with several images

- **WHEN** the visitor opens a Store Item with additional source images
- **THEN** the artwork area presents every image through thumbnails, previous/next controls, keyboard navigation, and touch swipes
- **AND** Motion respects reduced-motion preferences, artwork remains uncropped, and single-image items remain static.

#### Scenario: Visitor follows an artist provider link

- **WHEN** Bandcamp or TIDAL appears among an artist's links
- **THEN** the link uses its provider's recognizable brand mark with its existing accessible name.

## MODIFIED Requirements

### Requirement: Homepage hero scroll opacity is transition-free

The app shell SHALL keep the existing responsive homepage hero image fixed and visible for as long as the Home route owns it. Where the browser supports scroll-driven animations, the media layer SHALL fade from opacity `1` to `0.12` while an internal black veil fades from opacity `0` to `0.5`, both proportional to the root scroll position over the first `42vh`, without JavaScript style writes. Elsewhere, the existing coarse hero scrolled state SHALL crossfade the same endpoints over 240 milliseconds. The scroll indicator retains its immediate transition-free state.

#### Scenario: Shopper scrolls through the homepage hero

- **WHEN** the homepage hero renders at the top of Home
- **THEN** the existing responsive image fills the viewport at opacity `1`
- **AND** the hero-scoped shade preserves the approved first-viewport composition
- **AND** the shade declares no opacity or visibility transition, keyframe, transform, parallax effect, or scroll-linked progress property.

#### Scenario: Shopper crosses into later Home content

- **GIVEN** the homepage hero is rendered in the persistent app shell
- **AND** the browser supports `animation-timeline` and does not request reduced motion
- **WHEN** the shopper scrolls from the top of Home towards `42vh`
- **THEN** the media layer opacity decreases linearly from `1` to `0.12` and the `#050505` veil inside it increases linearly from `0` to `0.5` along the root scroll timeline
- **AND** the coarse scrolled class causes no step or transition in either value
- **AND** scrolling back reverses the values along the same path
- **AND** no second fixed element, filter, blur, blend mode, or additional image is introduced
- **AND** the media layer does not become hidden at either endpoint
- **AND** the hero shade leaves through normal document scrolling without sharing the fade
- **AND** later content stacks above the ghost on static dark surfaces of `rgb(13 13 13 / 76%)` for News, `rgb(20 20 20 / 78%)` for Artists, and `rgb(13 13 13 / 74%)` for Newsletter
- **AND** the ghost remains visibly continuous through those section surfaces
- **AND** cards retain opaque readable surfaces
- **AND** the footer fully covers the ghost
- **AND** the scroll indicator changes state at the coarse threshold without an opacity transition and its hidden child animation stops.

#### Scenario: Shopper returns above the threshold

- **GIVEN** the browser does not support `animation-timeline` and does not request reduced motion
- **WHEN** the existing coarse hero state changes side
- **THEN** the media layer opacity transitions from its current value to `0.12` (scrolled) or `1` (not scrolled) and the veil to `0.5` or `0` over 240 milliseconds using `cubic-bezier(0.22, 1, 0.36, 1)`
- **AND** the media remains fixed and visible
- **AND** an interrupted native CSS reversal remains bounded without a separate application animation state or timer.

#### Scenario: Scroll state changes only at the coarse threshold

- **GIVEN** the homepage hero scroll sync is connected
- **WHEN** repeated scroll events stay on the same side of the hero scrolled threshold
- **THEN** the app shell does not mutate the hero class repeatedly
- **AND** the app shell does not write `--homepage-hero-scroll-progress`, opacity, or any media style property on scroll.

#### Scenario: Shopper leaves and returns to Home

- **WHEN** shell navigation leaves Home
- **THEN** the Home hero DOM and ghost no longer render on the destination route
- **AND** the route-scoped scroll synchronization disconnects
- **AND** returning to Home recreates the opacity-`1` first-viewport composition without global backdrop state or a full document reload.

#### Scenario: Reduced motion remains respected

- **WHEN** the browser reports a reduced-motion preference
- **THEN** no scroll-linked animation applies
- **AND** the media reaches opacity `0.12` and the black veil reaches opacity `0.5` in the scrolled state without a transition
- **AND** the media reaches opacity `1` and the black veil reaches opacity `0` in the not-scrolled state without a transition
- **AND** the media remains fixed and visible at both endpoints
- **AND** nonessential Home animation remains disabled
- **AND** visible content and status text remain available.

### Requirement: Homepage hero render work is bounded

The app shell SHALL preserve the homepage hero composition without continuous full-viewport raster effects. One already-loaded fixed image MAY remain behind later Home content. Its media layer and one internal solid-color veil MAY change opacity only along the root scroll timeline or through one bounded coarse-threshold transition, and they SHALL cause no hero-attributable paint, raster, decode, or application work per scroll frame.

#### Scenario: Homepage hero is visible

- **WHEN** the homepage hero renders in the first viewport
- **THEN** its primary image retains eager high-priority responsive delivery
- **AND** no duplicate image request or decode is introduced for the ghost
- **AND** the approved monochrome, contrast, and static texture treatment does not require a runtime image filter, animated grain layer, backdrop filter, or blend mode
- **AND** no hero visual-effect animation runs infinitely by default.

#### Scenario: Shopper passes the hero threshold

- **WHEN** the shopper scrolls through the first `42vh` of Home
- **THEN** only media opacity and the internal black-veil opacity change
- **AND** media visibility, position, scale, filter, and background position remain unchanged
- **AND** the hero shade leaves with its containing hero rather than remaining as a second fixed layer
- **AND** scroll evidence shows no hero-attributable paint, raster, image-decode, or JavaScript style write per frame
- **AND** application-attributable main-thread plus style, layout, and paint work remains within the existing performance budget
- **AND** no application-attributable task or long animation frame of at least 50 milliseconds is introduced.

#### Scenario: Reduced motion is requested

- **WHEN** the browser reports a reduced-motion preference
- **THEN** the selected opacity endpoint applies without a transition or scroll-linked animation
- **AND** no fallback effect adds continuous filter, paint, raster, or compositor animation work.

### Requirement: Shell navigation reveals first-screen images

The shell SHALL prepare and wait for the destination's first-screen images so shell-managed section navigation and detail overlays do not show images appearing after the content swap. First-screen images are those the destination marks `loading="eager"`. Waiting SHALL be bounded and SHALL NOT block navigation.

#### Scenario: Fetched section snapshots preload eager images

- **GIVEN** a shell section snapshot is fetched, on link intent or on activation
- **WHEN** its HTML has been parsed
- **THEN** the shell preloads that destination's eager images once, using their `sizes`, `srcset` and `src`, before the snapshot is inserted
- **AND** lazy images are not preloaded
- **AND** a cached snapshot starts no additional preload.

#### Scenario: Overlay link intent preloads eager images only

- **GIVEN** a detail overlay link
- **WHEN** it receives hover or focus intent
- **THEN** the shell preloads that destination's eager images using their `sizes`, `srcset` and `src`
- **AND** lazy images are not preloaded
- **AND** activating the link does not start an additional preload.

#### Scenario: Section activation waits for decoded images

- **GIVEN** a shopper activates a section link or restores a cached section page
- **WHEN** the destination content is swapped in
- **THEN** the page-enter transition is held until its eager images have decoded, or at most 300 ms
- **AND** no wait is added when they are already decoded.

#### Scenario: Overlay lead images load eagerly

- **WHEN** a Release, Artist or News detail overlay renders its lead image
- **THEN** the image is `loading="eager"` without `fetchpriority="high"`
- **AND** direct full-page loads keep their priority lead image.

#### Scenario: Reduced motion and image failure

- **GIVEN** reduced motion is preferred, or an eager image fails to load or decode
- **WHEN** navigation completes
- **THEN** the wait never exceeds 300 ms
- **AND** a failed image never blocks navigation, focus, scroll reset or the persistent player.

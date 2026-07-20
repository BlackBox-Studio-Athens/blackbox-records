## RENAMED Requirements

### Requirement: Homepage hero ghost crossfade is threshold-bounded

FROM: Homepage hero scroll opacity is transition-free
TO: Homepage hero ghost crossfade is threshold-bounded

## MODIFIED Requirements

### Requirement: Homepage hero ghost crossfade is threshold-bounded

The app shell SHALL keep the existing responsive homepage hero image fixed and visible for as long as the Home route owns it. The existing coarse hero scrolled state SHALL crossfade the media layer between opacity `1` and `0.12` while an internal black veil crossfades between opacity `0` and `0.5` over the same 240 milliseconds without changing media visibility, while the scroll indicator retains its immediate transition-free state.

#### Scenario: Homepage hero renders in the first viewport

- **WHEN** the homepage hero renders at the top of Home
- **THEN** the existing responsive image fills the viewport at opacity `1`
- **AND** the hero-scoped shade preserves the approved first-viewport composition
- **AND** the shade declares no opacity or visibility transition, keyframe, transform, parallax effect, or scroll-linked progress property.

#### Scenario: Shopper crosses into later Home content

- **GIVEN** the homepage hero is rendered in the persistent app shell
- **AND** the browser does not request reduced motion
- **WHEN** the existing coarse hero state changes to scrolled
- **THEN** the media layer remains fixed and visible while its opacity transitions from its current value to `0.12` over 240 milliseconds using `cubic-bezier(0.22, 1, 0.36, 1)`
- **AND** an absolute `#050505` veil inside that media layer transitions from its current value to opacity `0.5` using the identical duration and curve
- **AND** no second fixed element, filter, blur, blend mode, or additional image is introduced
- **AND** the media layer does not become hidden after the transition
- **AND** the hero shade leaves through normal document scrolling without sharing the crossfade
- **AND** later content stacks above the ghost on static dark surfaces of `rgb(13 13 13 / 76%)` for News, `rgb(20 20 20 / 78%)` for Artists, and `rgb(13 13 13 / 74%)` for Newsletter
- **AND** the ghost remains visibly continuous through those section surfaces
- **AND** cards retain opaque readable surfaces
- **AND** the footer fully covers the ghost
- **AND** the scroll indicator changes state without an opacity transition and its hidden child animation stops.

#### Scenario: Shopper returns above the threshold

- **GIVEN** the Home media is crossfading or settled at the ghost endpoint
- **WHEN** the existing coarse hero state changes to not scrolled
- **THEN** the media remains fixed and visible
- **AND** the same declared 240-millisecond duration and curve transition media opacity from the current value to `1` and veil opacity from the current value to `0`
- **AND** an interrupted native CSS reversal remains bounded without a separate application animation state or timer.

#### Scenario: Scroll events remain on one threshold side

- **GIVEN** the homepage hero scroll sync is connected
- **WHEN** repeated scroll events stay on the same side of the hero scrolled threshold
- **THEN** the app shell does not mutate the hero class repeatedly
- **AND** the app shell does not write `--homepage-hero-scroll-progress`, opacity, or any media style property on scroll
- **AND** the Home hero opacity transition does not restart or cancel because of those same-side events.

#### Scenario: Shopper leaves and returns to Home

- **WHEN** shell navigation leaves Home
- **THEN** the Home hero DOM and ghost no longer render on the destination route
- **AND** the route-scoped scroll synchronization disconnects
- **AND** returning to Home recreates the opacity-`1` first-viewport composition without global backdrop state or a full document reload.

#### Scenario: Reduced motion remains respected

- **WHEN** the browser reports a reduced-motion preference
- **THEN** the media reaches opacity `0.12` and the black veil reaches opacity `0.5` in the scrolled state without a transition
- **AND** the media reaches opacity `1` and the black veil reaches opacity `0` in the not-scrolled state without a transition
- **AND** the media remains fixed and visible at both endpoints
- **AND** nonessential Home animation remains disabled
- **AND** visible content and status text remain available.

### Requirement: Homepage hero render work is bounded

The app shell SHALL preserve the homepage hero composition without continuous full-viewport raster effects. One already-loaded fixed image MAY remain behind later Home content, and its existing media layer plus one internal solid-color veil MAY each perform one bounded opacity transition per coarse threshold-side change only while they cause no repeated hero-attributable paint, raster, decode, animation, or application work after the transition settles.

#### Scenario: Homepage hero is visible

- **WHEN** the homepage hero renders in the first viewport
- **THEN** its primary image retains eager high-priority responsive delivery
- **AND** no duplicate image request or decode is introduced for the ghost
- **AND** the approved monochrome, contrast, and static texture treatment does not require a runtime image filter, animated grain layer, backdrop filter, or blend mode
- **AND** no hero visual-effect animation runs infinitely by default.

#### Scenario: Shopper passes the hero threshold

- **WHEN** the existing coarse hero scroll state changes side
- **THEN** only media opacity and the internal black-veil opacity perform one bounded 240-millisecond transition each
- **AND** media visibility, position, scale, filter, and background position remain unchanged
- **AND** the hero shade leaves with its containing hero rather than remaining as a second fixed layer
- **AND** first, repeat, and settled-scroll evidence shows no repeated hero-attributable paint, raster, image-decode, animation, or layer-invalidation work after the transition settles
- **AND** application-attributable main-thread plus style, layout, and paint work remains within the existing performance budget
- **AND** no application-attributable task or long animation frame of at least 50 milliseconds is introduced.

#### Scenario: Reduced motion is requested

- **WHEN** the browser reports a reduced-motion preference
- **THEN** the selected opacity endpoint applies without a transition
- **AND** no fallback effect adds continuous filter, paint, raster, or compositor animation work.

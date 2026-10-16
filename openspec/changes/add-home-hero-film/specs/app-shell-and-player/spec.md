## ADDED Requirements

### Requirement: Homepage hero film

When prepared hero film files exist, the homepage hero SHALL render the silent looping film first on film-capable visits, without flashing the still, under the approved Home motion rules. The film SHALL retain baked high-contrast grayscale and exclude the burned-in BlackBox Studio logo. The still SHALL remain the eager no-motion and failure fallback.

#### Scenario: Eligible visitor opens Home

- **GIVEN** the browser requests no reduced motion and no data saving
- **WHEN** Home parses and at least half the hero is in view in a visible tab without a shell music session
- **THEN** a head script marks the document film-capable before first paint, the video carries autoplay and preload="auto", and an inline script beside it selects the orientation source while the page parses
- **AND** the film loads at once without waiting for the still's load, plays muted, inline and looping inside the fixed media layer, and the still is not painted while waiting for playback
- **AND** a portrait viewport loads only the 9:16 centre crop and any other viewport loads only the landscape crop
- **AND** the hero shows no film control.

#### Scenario: Film is paused automatically

- **WHEN** less than half the hero is in view, the tab is hidden or a shell music session exists
- **THEN** the film pauses on its current frame
- **AND** the film resumes when the condition ends.

#### Scenario: Motion is not appropriate or the film cannot play

- **WHEN** JavaScript is unavailable, the browser requests reduced motion or data saving, the source fails or muted autoplay is refused
- **THEN** the still is shown at once, without waiting for the safety net
- **AND** reduced motion and data saving request no film, while a failed source or refused autoplay triggers no retry.

#### Scenario: Film loading stalls

- **WHEN** a film-capable visit has not reached playback after 2.5 seconds
- **THEN** the safety net reveals the still instead of leaving the hero without visible media.

#### Scenario: Viewport orientation changes

- **WHEN** the selected orientation source changes
- **THEN** the current film frame remains visible during the source swap, without flashing the still
- **AND** the in-view, visible-tab and music-session pause rules remain unchanged.

#### Scenario: Prepared files are delivered

- **WHEN** the hero film files are built
- **THEN** each file excludes the measured studio-logo bounding box by at least 32 source pixels
- **AND** the portrait file is under 2 MiB and the landscape file is under 4 MiB, both silent H.264 with a fast-start header.

## MODIFIED Requirements

### Requirement: Homepage hero scroll opacity is transition-free

The app shell SHALL keep the existing responsive homepage hero image fixed for as long as the Home route owns it; on a film-capable visit the still SHALL remain unpainted until the film plays and then hidden behind it, and SHALL be visible at opacity `1` whenever the film cannot play. The media layer SHALL fade from opacity `1` to `0.12` while an internal black veil fades from opacity `0` to `0.5`, both proportional to the root scroll position over the first `42vh`. Where the browser supports scroll-driven animations, a root scroll timeline drives both without JavaScript. Elsewhere, the same keyframes apply paused and the hero scroll synchronization seeks them to its scroll progress. Neither the media layer nor the veil declares a transition. The scroll indicator retains its immediate transition-free state.

#### Scenario: Shopper scrolls through the homepage hero

- **WHEN** the homepage hero renders at the top of Home
- **THEN** the existing responsive image fills the viewport at opacity `1` whenever the film cannot play; on a film-capable visit it remains unpainted until the film plays and then hidden behind it
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
- **WHEN** the shopper scrolls from the top of Home towards `42vh` and returns above the coarse threshold
- **THEN** the media layer and the veil take the same values along the same linear path as on a root scroll timeline, updated on the hero scroll synchronization's animation frame
- **AND** the coarse scrolled class causes no step or transition in either value
- **AND** the media remains fixed and visible at both endpoints.

#### Scenario: Scroll state changes only at the coarse threshold

- **GIVEN** the homepage hero scroll sync is connected
- **WHEN** repeated scroll events stay on the same side of the hero scrolled threshold
- **THEN** the app shell does not mutate the hero class repeatedly
- **AND** the app shell does not write `--homepage-hero-scroll-progress`, opacity, or any media style property on scroll
- **AND** it seeks the paused fade only where scroll-driven animations are unsupported, at most once per animation frame and only when the clamped scroll progress changes.

#### Scenario: Shopper leaves and returns to Home

- **WHEN** shell navigation leaves Home
- **THEN** the Home hero DOM and ghost no longer render on the destination route
- **AND** the route-scoped scroll synchronization disconnects
- **AND** returning to Home recreates the opacity-`1` first-viewport composition without global backdrop state or a full document reload
- **AND** the recreated hero's fade follows the scroll.

#### Scenario: Reduced motion remains respected

- **WHEN** the browser reports a reduced-motion preference
- **THEN** no scroll-linked animation applies and the app shell seeks nothing
- **AND** the media reaches opacity `0.12` and the black veil reaches opacity `0.5` in the scrolled state without a transition
- **AND** the media reaches opacity `1` and the black veil reaches opacity `0` in the not-scrolled state without a transition
- **AND** the media remains fixed and visible at both endpoints
- **AND** nonessential Home animation remains disabled
- **AND** visible content and status text remain available.

### Requirement: Homepage hero render work is bounded

The app shell SHALL preserve the homepage hero composition without continuous full-viewport raster effects except for the prepared homepage hero film, which loads while the page parses without waiting for the still and plays under the approved Home motion rules. One already-loaded fixed image or the prepared hero film's paused frame MAY remain behind later Home content. Its media layer and one internal solid-color veil MAY change opacity only along the root scroll timeline or, where that is unsupported, through the hero scroll synchronization seeking the same paused keyframes. They SHALL cause no hero-attributable layout, image decode, or style-property write per scroll frame, and no hero-attributable paint, raster, or application work where a scroll timeline drives them once the film has paused.

#### Scenario: Homepage hero is visible

- **WHEN** the homepage hero renders in the first viewport
- **THEN** its primary image retains eager high-priority responsive delivery
- **AND** no duplicate image request or decode is introduced for the ghost
- **AND** the approved monochrome, contrast, and static texture treatment does not require a runtime image filter, animated grain layer, backdrop filter, or blend mode
- **AND** no hero visual-effect animation other than the prepared hero film runs infinitely by default.

#### Scenario: Shopper passes the hero threshold

- **WHEN** the shopper scrolls through the first `42vh` of Home
- **THEN** only media opacity and the internal black-veil opacity change
- **AND** media visibility, position, scale, filter, and background position remain unchanged
- **AND** the hero shade leaves with its containing hero rather than remaining as a second fixed layer
- **AND** where a scroll timeline drives the fade, scroll evidence shows no hero-attributable paint, raster, image-decode, or JavaScript style write per frame
- **AND** where the fade is seeked, that seek is the only added per-frame application work, it runs only while the clamped progress changes within the first `42vh`, and frame pacing matches the coarse crossfade it replaces
- **AND** application-attributable main-thread plus style, layout, and paint work remains within the existing performance budget
- **AND** no application-attributable task or long animation frame of at least 50 milliseconds is introduced.

#### Scenario: Reduced motion is requested

- **WHEN** the browser reports a reduced-motion preference
- **THEN** the selected opacity endpoint applies without a transition or scroll-linked animation
- **AND** no fallback effect adds continuous filter, paint, raster, or compositor animation work.

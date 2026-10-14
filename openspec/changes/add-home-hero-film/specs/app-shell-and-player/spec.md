## ADDED Requirements

### Requirement: Homepage hero film

When prepared hero film files exist, the homepage hero SHALL play a silent looping film over its still image under the approved Home motion rules. The film SHALL be high-contrast grayscale baked into the files, SHALL never show the BlackBox Studio logo burned into the source footage, and SHALL leave the still as the hero's eager image and its fallback.

#### Scenario: Eligible visitor opens Home

- **GIVEN** the browser requests no reduced motion and no data saving
- **WHEN** the hero still has loaded and at least half the hero is in view in a visible tab without a shell music session
- **THEN** the film plays muted, inline and looping inside the fixed media layer, fading in over the still once it plays
- **AND** a portrait viewport loads only the 9:16 centre crop and any other viewport loads only the landscape crop
- **AND** a pause/resume control with an accessible name is available and keeps the paused frame.

#### Scenario: Film is paused automatically

- **WHEN** less than half the hero is in view, the tab is hidden or a shell music session exists
- **THEN** the film pauses on its current frame and the control is disabled
- **AND** the film resumes when the condition ends unless the visitor paused it.

#### Scenario: Motion is not appropriate or the film cannot play

- **WHEN** the browser requests reduced motion or data saving, the source fails or muted autoplay is refused
- **THEN** the still remains without a film request, retry or pause control.

#### Scenario: Prepared files are delivered

- **WHEN** the hero film files are built
- **THEN** each file excludes the measured studio-logo bounding box by at least 32 source pixels
- **AND** the portrait file is under 2 MiB and the landscape file is under 4 MiB, both silent H.264 with a fast-start header.

## MODIFIED Requirements

### Requirement: Homepage hero render work is bounded

The app shell SHALL preserve the homepage hero composition without continuous full-viewport raster effects other than the homepage hero film while at least half the hero is in view. One already-loaded fixed image, and the hero film's paused frame, MAY remain behind later Home content. Its media layer and one internal solid-color veil MAY change opacity only along the root scroll timeline or, where that is unsupported, through the hero scroll synchronization seeking the same paused keyframes. They SHALL cause no hero-attributable layout, image decode, or style-property write per scroll frame, and no hero-attributable paint, raster, or application work where a scroll timeline drives them once the film has paused.

#### Scenario: Homepage hero is visible

- **WHEN** the homepage hero renders in the first viewport
- **THEN** its primary image retains eager high-priority responsive delivery
- **AND** the hero film is requested only after that image has loaded
- **AND** no duplicate image request or decode is introduced for the ghost
- **AND** the approved monochrome, contrast, and static texture treatment does not require a runtime image filter, animated grain layer, backdrop filter, or blend mode
- **AND** no hero visual-effect animation other than the eligible hero film runs infinitely by default.

#### Scenario: Shopper passes the hero threshold

- **WHEN** the shopper scrolls through the first `42vh` of Home
- **THEN** only media opacity and the internal black-veil opacity change
- **AND** media visibility, position, scale, filter, and background position remain unchanged
- **AND** the hero shade leaves with its containing hero rather than remaining as a second fixed layer
- **AND** the hero film pauses once less than half the hero is in view
- **AND** where a scroll timeline drives the fade, scroll evidence beyond that point shows no hero-attributable paint, raster, image-decode, or JavaScript style write per frame
- **AND** where the fade is seeked, that seek is the only added per-frame application work, it runs only while the clamped progress changes within the first `42vh`, and frame pacing matches the coarse crossfade it replaces
- **AND** application-attributable main-thread plus style, layout, and paint work remains within the existing performance budget
- **AND** no application-attributable task or long animation frame of at least 50 milliseconds is introduced.

#### Scenario: Reduced motion is requested

- **WHEN** the browser reports a reduced-motion preference
- **THEN** the selected opacity endpoint applies without a transition or scroll-linked animation
- **AND** no hero film is requested or played
- **AND** no fallback effect adds continuous filter, paint, raster, or compositor animation work.

## ADDED Requirements

### Requirement: Shell navigation reveals first-screen images

The shell SHALL prepare and wait for the destination's first-screen images so shell-managed section navigation and detail overlays do not show images appearing after the content swap. First-screen images are those the destination marks `loading="eager"`. Waiting SHALL be bounded and SHALL NOT block navigation.

#### Scenario: Link intent preloads eager images only

- **GIVEN** a shell section or detail overlay link
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

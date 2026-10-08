## MODIFIED Requirements

### Requirement: Coverflow preview makes active position and complete catalog depth explicit

Each eligible Coverflow preview SHALL expose the relationship between its bounded preview and complete source-derived catalog without creating another catalog, request, or interaction mode.

#### Scenario: Eligible preview communicates catalog depth

- **WHEN** an eligible group enters `preview` mode
- **THEN** it presents the source-derived total, one-based active position, and source-derived count after the active record in three aligned labelled fields
- **AND** it states `You're viewing {current} of {total}`
- **AND** no continuation rail or other decorative ratio repeats those values
- **AND WHEN** the active record changes
- **THEN** current, remaining, and summary update from the same canonical index without a second counter or catalog.

#### Scenario: Preview controls express distinct tasks

- **WHEN** Coverflow controls render in `preview` mode
- **THEN** Previous and Next remain secondary controls for navigating every record in the canonical group through the bounded six-position stage
- **AND** the Grid segment of the view switch is the full-catalog disclosure control, with an accessible name and a target at least 44 CSS pixels high
- **AND** the preview adds no per-item pagination dots, thumbnails, drag affordance, autoplay, or looping animation.

#### Scenario: Preview reads as one BlackBox artwork rack

- **WHEN** an eligible Coverflow renders in preview mode
- **THEN** its overview, live record identity, and artwork stage form one coherent square-edged group using straight rules and flat BlackBox surfaces
- **AND** the record identity plaque leads with a Listen end for the active record when that record has a listening source
- **AND** the active cover remains dominant while up to five neighboring covers visibly communicate additional records
- **AND** Previous, Next, and the view switch retain native button semantics with the existing hierarchy and visible focus
- **AND** the composition reuses the current Coverflow controller and canonical Store Item nodes, adding no registry carousel, Embla dependency, second state engine, runtime image, duplicated six-card window, or duplicate Store Item node.

#### Scenario: Catalog or search-results mode replaces preview disclosure

- **WHEN** an eligible group enters `catalog` or `search-results` mode
- **THEN** preview-only totals, remaining count, Previous, Next, and the active preview plaque with its Listen end leave presentation and focus order according to the existing exclusive-mode contract
- **AND** catalog mode retains the Coverflow segment of the view switch while search-results mode retains search ownership.

#### Scenario: Disclosure motion runs

- **WHEN** motion is permitted and the visitor activates the Grid segment
- **THEN** catalog mode and its accessible pressed state apply immediately
- **AND** one hard-edged catalog reveal removes the preview-only band from presentation and reaches its final state within 180ms of authored animation time
- **AND** no timer loop, animation-frame loop, document View Transition, layout animation, or new controller mode is introduced.

#### Scenario: Reduced motion or unsupported enhancement remains complete

- **WHEN** `prefers-reduced-motion: reduce` matches
- **THEN** preview total, current, remaining count, and controls remain perceivable while all new transitions reach their final state immediately
- **AND** the flat preview keeps each card's own Listen in place of the plaque
- **AND WHEN** JavaScript or required 3D support is unavailable
- **THEN** the complete server-rendered catalog remains available without nonfunctional preview disclosure.

#### Scenario: Catalog depth disclosure reflows

- **WHEN** the eligible group renders at 320 CSS pixels, 200% text size, or the 400% zoom equivalent
- **THEN** its title, three aligned labelled values, summary, plaque, and controls reflow in document order without clipped labels or two-dimensional page scrolling
- **AND** the full-catalog action remains distinguishable from Previous and Next without relying on colour alone.

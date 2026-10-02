## MODIFIED Requirements

### Requirement: Eligible Distro groups provide a bounded 3D Coverflow preview

Distro SHALL render one complete Grid by default and offer explicit-choice shared Coverflow for the complete unfiltered collection when it contains more than six items and platform support is available. Format, artist or text filtering SHALL force Grid. Both views SHALL reuse the same ordered canonical card nodes.

#### Scenario: Large group is eligible

- **WHEN** the unfiltered mixed catalog has more than six items and required platform support
- **THEN** it starts in Grid and offers Grid/Coverflow controls
- **AND** explicit Coverflow activation uses the existing six-position stage, source-derived totals, title/artist status and full catalog access in promotion/band order.

#### Scenario: Focused small group is eligible

- **WHEN** a format is explicitly selected
- **THEN** matching cards appear in Grid and selection does not create a separate or small-format Coverflow.

#### Scenario: Group is ineligible

- **WHEN** the complete collection contains six or fewer items or enhancement is unsupported
- **THEN** it remains complete Grid without nonfunctional Coverflow controls.

#### Scenario: Preview adapts to the viewport

- **WHEN** Coverflow is activated on a supported phone or desktop
- **THEN** existing responsive stage spacing and at most six positioned cards remain available without changing canonical order.

#### Scenario: Visitor navigates the preview

- **WHEN** existing Previous/Next, focus, swipe, wheel or keyboard interactions are used
- **THEN** the shared interaction contract selects and wraps through the complete collection without reordering cards, retaining title/artist status.

#### Scenario: Visitor activates a preview record

- **WHEN** a positioned active card is activated
- **THEN** its ordinary canonical Store Item link opens without an alternate product route or quick view.

#### Scenario: Visitor selects a side cover or scrolls through the stage

- **WHEN** an inactive side cover is selected or a qualifying gesture occurs
- **THEN** existing focus-before-navigation, gesture suppression and native vertical-scroll behavior remain intact.

#### Scenario: Preview exposes artwork without losing record identity

- **WHEN** Coverflow is active
- **THEN** positioned/offstage accessibility, artwork, purchase facts, independent Listen actions and named links retain the existing shared Store behavior
- **AND** returning to Grid exposes the complete same card list.

#### Scenario: Distro search starts

- **WHEN** any format, artist or text filter becomes active
- **THEN** Coverflow ends, matching cards remain in Grid, and Coverflow cannot reactivate while filtering.

#### Scenario: Distro search clears or disconnects

- **WHEN** every filter clears or route cleanup runs
- **THEN** the complete canonical list returns in Grid without replaying Coverflow intent.

#### Scenario: Store Distro route enters through the app shell

- **WHEN** the route activates directly or through shell restoration
- **THEN** one route-owned shared controller connects to the same canonical list and starts in Grid without stale selection, visibility or preview state.

### Requirement: Coverflow, catalog, and search-results modes are exclusive

The complete mixed Distro collection MUST occupy one shared `preview`, `catalog`, or `search-results` mode. Initial rendering uses catalog mode; any format, artist or text filter forces search-results Grid.

#### Scenario: Visitor requests the full group

- **WHEN** Grid is selected from Coverflow
- **THEN** the same complete ordered cards appear in Grid, with the active item focused and shared disclosure behavior preserved.

#### Scenario: Disclosure activation repeats while a transition is active

- **WHEN** a disclosure transition is active
- **THEN** shared controls ignore repeated activation and remove temporary state after completion, interruption or cleanup.

#### Scenario: Visitor returns to the preview

- **WHEN** Coverflow is explicitly selected without active filters
- **THEN** the shared controller positions its selected item or the first item without reordering the catalog.

#### Scenario: Distro search becomes active

- **WHEN** any format, artist or text filter is active
- **THEN** the collection enters search-results Grid before result visibility updates, and Coverflow cannot activate.

#### Scenario: Distro search clears

- **WHEN** every filter clears or route cleanup runs
- **THEN** the complete canonical list returns in Grid without replaying Coverflow intent.

#### Scenario: Viewport changes

- **WHEN** the viewport crosses a responsive breakpoint
- **THEN** existing CSS adapts the scene without changing the selected mode or requiring resize state.

#### Scenario: Distro route exits and re-enters

- **WHEN** the shell caches and restores Distro
- **THEN** existing snapshot cleanup restores the complete server-authored Grid, canonical order and initial controls.

### Requirement: Coverflow disclosure is progressive and accessible

The shared mixed-catalog Coverflow MUST preserve complete server-rendered browsing, canonical links, keyboard focus and reduced-motion behavior.

#### Scenario: JavaScript or platform support is unavailable

- **WHEN** enhancement is disabled, unsupported or fails to mount
- **THEN** all canonical cards remain visible in order without nonfunctional controls.

#### Scenario: Supported Distro route paints its initial state

- **WHEN** enhancement is supported
- **THEN** the complete Grid remains visible before and after readiness; Coverflow requires explicit selection.

#### Scenario: Visitor prefers reduced motion

- **WHEN** reduced motion is requested
- **THEN** existing controls reach the same final states without movement or stagger and no catalog access is removed.

#### Scenario: Visitor uses the keyboard

- **WHEN** the visitor operates view and navigation controls
- **THEN** shared accessible names, 44px targets, visible focus and focus-before-link activation remain intact, including with the mobile mini-player open.

#### Scenario: Visitor enlarges the presentation

- **WHEN** text sizing or zoom increases
- **THEN** controls and status reflow without horizontal page overflow or obscured focus targets.

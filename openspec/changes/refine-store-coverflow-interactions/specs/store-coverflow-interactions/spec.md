## MODIFIED Requirements

### Requirement: Store Coverflow uses one shared progressive enhancement contract

Every eligible flat Store collection route rendered through `StoreCollectionPage` and every eligible Distro group SHALL use one Store-level Coverflow controller and lifecycle contract while preserving route-owned canonical Store Item nodes and complete server-rendered catalogs.

#### Scenario: Shared enhancement mounts

- **WHEN** a flat Store collection contains more than six canonical Store Items, or a Distro group contains more than six classified Store Items, and JavaScript, required 3D CSS support, and the functioning controller caller are available
- **THEN** the shared Store Coverflow controller reads route-owned cards in their existing canonical order and enters `preview` mode
- **AND** at most six existing cards receive relative stage positions
- **AND** no card, Store Item projection, Store data request, authored collection, or commerce identity is duplicated
- **AND** Distro search remains the sole owner of Distro matching and controller lifecycle, so the app shell does not double-mount Distro groups.

#### Scenario: Flat collection eligibility is universal

- **WHEN** All, BlackBox Releases, populated Merch, or a future non-Distro flat category is rendered through `StoreCollectionPage`
- **THEN** the same greater-than-six eligibility rule, controller, wheel cadence, arrow-key behavior, hover/focus cue, disclosure behavior, reduced-motion contract, and fallback apply without a category-specific branch
- **AND** six or fewer canonical items remain the complete ordinary grid.

#### Scenario: Enhancement is unavailable

- **WHEN** JavaScript is disabled, required 3D CSS support is unavailable, or a direct-load or app-shell controller stalls or rejects mounting
- **THEN** the complete server-rendered catalog remains visible and operable in canonical order
- **AND** no nonfunctional Coverflow controls or pre-hydration hidden catalog state remain.

#### Scenario: Store route exits and re-enters

- **WHEN** the app shell caches, leaves, restores, or reloads a Store route containing Coverflow
- **THEN** generic Store Coverflow snapshot sanitation restores the first canonical item, initial positions, labels, controls, and rail ratio
- **AND** selected, ready, reveal, visited, and temporary transition state is removed before caching
- **AND** the route-specific controller remounts once for the active shell pathname and removes its listeners and in-flight animation state during cleanup
- **AND** a prior mount failure does not prevent a later Store activation from rechecking capability and mounting successfully.

#### Scenario: Editorial and detail routes remain outside Coverflow

- **WHEN** editorial Releases or a Store Item detail route renders
- **THEN** it remains outside Store Coverflow eligibility and lifecycle
- **AND** its existing editorial or detail availability and navigation behavior remains unchanged.

### Requirement: Store Coverflow supports intentional wheel navigation

An enhanced Store Coverflow in `preview` mode MUST use wheel input received by its stage for discrete Coverflow traversal while preserving browser-owned wheel behavior outside that hovered stage, in non-preview modes, and for browser zoom gestures.

#### Scenario: Visitor uses ordinary vertical wheel input

- **WHEN** the pointer is over the Coverflow stage, `Ctrl` is not active, and vertical wheel magnitude is greater than or equal to horizontal magnitude
- **THEN** positive normalized input advances toward the next Store Item and negative normalized input moves toward the previous Store Item
- **AND** handled input is prevented from producing competing native page scroll while the pointer remains over that preview stage.

#### Scenario: Visitor uses horizontal or Shift plus wheel input

- **WHEN** the pointer is over the Coverflow stage and horizontal wheel magnitude exceeds vertical magnitude, or the visitor holds `Shift` while producing vertical wheel input
- **THEN** that input follows the same normalized threshold, direction, repeat, and wrapping rules as ordinary vertical wheel input
- **AND** the handled input is prevented from producing a competing native horizontal scroll.

#### Scenario: Visitor sustains one wheel gesture

- **WHEN** same-direction normalized input accumulates to 48 pixels and qualifying wheel events continue without a 160ms event gap
- **THEN** the controller moves at most one Store Item per wheel event, preserves residual accumulated intent, and may move additional Store Items at intervals of at least 120ms
- **AND** sustained input can traverse more than one Store Item without waiting for a new gesture
- **AND** one large event cannot skip an unbounded number of Store Items.

#### Scenario: Wheel gesture changes direction or pauses

- **WHEN** qualifying input reverses direction or the next event arrives after a gap greater than 160ms
- **THEN** prior accumulated intent is discarded before the new direction or gesture is evaluated.

#### Scenario: Browser retains wheel ownership

- **WHEN** wheel input occurs outside the Coverflow stage, the Coverflow is in `catalog` or `search-results` mode, `Ctrl` + wheel indicates browser zoom or trackpad pinch, or no axis reports a non-zero delta
- **THEN** Coverflow does not change its active Store Item
- **AND** it does not prevent the browser's native behavior.

#### Scenario: Wheel delta units vary

- **WHEN** a handled wheel event reports pixel, line, or page delta units
- **THEN** pixel units remain unchanged, line units use a 16px line, and page units use the current stage width before threshold comparison
- **AND** the dominant non-zero axis supplies the signed traversal delta.

### Requirement: Store Coverflow keeps native keyboard and link behavior

Store Coverflow SHALL provide keyboard and simple-pointer operation through native controls and links, and SHALL add focus-scoped arrow traversal without creating a composite carousel focus model.

#### Scenario: Visitor uses the keyboard

- **WHEN** the visitor tabs through an enhanced Coverflow
- **THEN** Previous, Next, full-catalog disclosure, and every positioned card follow document order with visible focus and accessible names
- **AND** Enter or Space activates native buttons while Enter activates an ordinary positioned Store Item link
- **AND** focusing a positioned card makes it active before ordinary link activation.

#### Scenario: Visitor presses arrow keys inside preview

- **WHEN** focus is inside an enhanced Coverflow in `preview` mode and the visitor presses unmodified Left Arrow or Right Arrow
- **THEN** Left Arrow moves exactly one Store Item toward Previous and Right Arrow moves exactly one Store Item toward Next, with wrapping at both ends
- **AND** the handled key event prevents its browser default
- **AND** repeated keydown events may continue traversing at the operating system's native key-repeat cadence.

#### Scenario: A Store Item card owns focus during arrow traversal

- **WHEN** a positioned Store Item link owns focus and an arrow key changes the active item
- **THEN** focus moves to the newly active Store Item link after rendering
- **AND** visible focus and the front-facing active cover remain aligned.

#### Scenario: A native control owns focus during arrow traversal

- **WHEN** Previous, Next, or the full-catalog disclosure control owns focus and an arrow key changes the active item
- **THEN** that native control retains focus
- **AND** no new stage tab stop, roving tabindex, application role, or custom composite-widget focus model is introduced.

#### Scenario: Arrow input remains browser-owned

- **WHEN** focus is outside the Coverflow group, the group is in `catalog` or `search-results` mode, or Alt, Control, Meta, or Shift modifies the arrow key
- **THEN** Store Coverflow does not move and does not prevent the key event.

#### Scenario: Visitor uses simple pointer controls

- **WHEN** the visitor activates Previous or Next with a mouse, stylus, touch tap, keyboard, switch control, or assistive technology
- **THEN** the active item moves exactly one position and wraps at both ends
- **AND** the native button target remains at least 44 CSS pixels high.

### Requirement: Store Coverflow interaction work remains bounded

Store Coverflow MUST keep initial parsing linear in the canonical card count and each navigation event bounded to the positioned stage, without continuous rendering, delayed input queues, or global input listeners.

#### Scenario: Active Store Item changes

- **WHEN** Previous, Next, side-cover selection, focus, touch, wheel, or an arrow key changes the active Store Item
- **THEN** the controller clears no more than the previously positioned six cards and assigns no more than the next six positions
- **AND** only fixed status, count, summary, and rail fields update alongside those cards
- **AND** no clone, virtualized window, request, full-card rebuild, layout animation, or image preload is introduced.

#### Scenario: Interaction listeners run

- **WHEN** Store Coverflow is enhanced
- **THEN** pointer and non-passive wheel listeners remain stage-local, the keydown listener remains group-local, and every listener is removed during cleanup
- **AND** wheel repeat gating uses event timestamps and retained residual state rather than a delayed timer or queued navigation
- **AND** no document-level wheel, keydown, or scroll listener, autoplay, timer loop, animation-frame loop, continuous drag rendering, fling physics, or card-by-card catalog stagger runs
- **AND** the enhancement adds no carousel, gesture, animation, or state-management dependency.

#### Scenario: All controller joins Store shell activation

- **WHEN** `/store/` enters through uncached navigation, a cached or prefetched snapshot, or history restoration
- **THEN** Store HTML application, transition-veil closure, and listing-price presentation do not await the Coverflow controller import or mount
- **AND** the activation retains exactly one Store HTML request, one Store listing-price projection request, zero per-card Store Offer reads, and the existing `Cache-Control: no-store` listing response
- **AND** Coverflow does not start, clear, replace, or otherwise change Store route loading feedback.

#### Scenario: Practical performance regression checks run

- **WHEN** the exact final tree runs focused All and Distro interaction checks plus the required repository gates
- **THEN** each handled wheel or key event performs at most one reducer move and bounded prior-six/next-six position work
- **AND** the page shows no visible layout instability or repeatable interaction stall outside authored motion
- **AND** native page wheel behavior resumes when the pointer leaves the preview stage or the group leaves `preview` mode
- **AND** existing project LCP, CLS, and INP budgets remain applicable without requiring a new Store activation matrix unless focused evidence identifies a repeatable Coverflow-attributable regression.

## ADDED Requirements

### Requirement: Store Coverflow presents one shared actionable cover cue

Every enhanced All and Distro Coverflow SHALL use the same restrained hover and focus-visible treatment to make actionable positioned covers visibly clickable without changing Coverflow geometry or link semantics.

#### Scenario: Visitor hovers an actionable positioned cover

- **WHEN** the pointer hovers the active cover or a visibly exposed side cover that accepts pointer input
- **THEN** All and Distro apply the same inner-surface border or tonal change and the same restrained child-artwork scale
- **AND** the outer link's 3D position, rotation, depth, and scale remain owned by the Coverflow position state.

#### Scenario: Visitor focuses a positioned cover

- **WHEN** keyboard focus reaches a positioned Store Item link
- **THEN** the same actionable cue accompanies the existing visible focus treatment
- **AND** the shared controller makes that card active before ordinary link activation.

#### Scenario: Visitor prefers reduced motion

- **WHEN** `prefers-reduced-motion: reduce` matches
- **THEN** artwork scaling and its transition are disabled
- **AND** a static surface change and visible focus treatment still identify the actionable Store Item link.

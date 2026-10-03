## MODIFIED Requirements

### Requirement: Initial app-shell work follows immediate intent

The app shell SHALL keep navigation-critical behavior eager while loading dormant shell-owned and route-specific UI only for the active route or its first relevant intent. A dormant surface SHALL open from an intent-started module load without a suspended fallback commit.

#### Scenario: A normal route first hydrates

- **WHEN** `AppShell` hydrates on page load
- **THEN** same-document navigation interception, route state, focus reset, scroll reset, required event names, and minimal state bridges become ready immediately
- **AND** dormant cart drawer, player presentation, overlay presentation, mobile sheet content, and route-specific portal presentation are not all part of the initial eager closure
- **AND** the initial app-shell JavaScript closure is no more than 96 KiB using actual hosted Brotli transfer size.

#### Scenario: Active route owns a portal outlet

- **WHEN** Artists, Services, or Store is the active direct-load or shell-managed pathname and its server-rendered portal target exists
- **THEN** only the owning route's portal presentation loads through a direct route-owned import
- **AND** Artists filters, Services inquiry UI, and Store cart presentation are not mutually eager dependencies
- **AND** existing server content remains usable while a portal chunk loads or fails.

#### Scenario: Newsletter signup is present

- **WHEN** a direct-load or shell-managed page renders the newsletter signup
- **THEN** its note and privacy link are server-rendered
- **AND** the form mounts through the shell portal pattern, so it works after a direct load and after shell navigation
- **AND** no `client:visible` or `client:idle` directive is used for it.

#### Scenario: Shopper first requests dormant shell UI

- **WHEN** the shopper first opens the cart, player, detail overlay, mobile menu, or route-specific portal
- **THEN** the required code loads through a direct intent-owned path that may already have started on pointer or focus intent, or at idle
- **AND** the surface renders once its module has resolved, through an ordinary state update, without a Suspense fallback commit or its throttled reveal
- **AND** existing accessible loading feedback covers any remaining visible delay
- **AND** a failed surface chunk leaves the shell usable and closes the surface instead of throwing out of the shell root
- **AND** the interaction completes without a full document navigation.

#### Scenario: StoreCart event bridge becomes ready

- **WHEN** the shell installs eager StoreCart add, open, checkout-update, and page-show behavior
- **THEN** event names and listeners do not require checkout-summary, cart-presentation, or StoreCart parsing modules
- **AND** the StoreCart parser and its validation library load only when a stored cart exists, on Store or checkout routes, or on the first cart event
- **AND** the bridge still initializes, persists, opens, and refreshes StoreCart under the existing convenience-state contract.

#### Scenario: Eager helpers do not pull API clients or animation code

- **WHEN** an eager shell module needs a helper owned by a lazily loaded module
- **THEN** the helper lives in a dependency-free module, so the public checkout API client loads only when a purchase action is submitted
- **AND** navigation transition animation code loads on the first navigation intent rather than at module evaluation
- **AND** class-name merging code is not part of the eager closure solely for eager shell UI.

#### Scenario: Player code has loaded

- **WHEN** a player session is opened, minimized, reopened, carried through shell navigation, or stopped
- **THEN** the established single-session player behavior remains unchanged
- **AND** code splitting does not move player ownership into page-local content.

## ADDED Requirements

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
- **AND** reduced motion, `data-lenis-prevent` panes, iframes, form controls, and horizontal Coverflow keep native scrolling.

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

### Requirement: Player iframe starts from the Listen activation

The app shell SHALL create the provider iframe during the Listen activation inside a shell-owned host that stays mounted, so the first embed request does not wait for player presentation code.

#### Scenario: Shopper activates Listen for the first time

- **WHEN** the shopper activates a Listen trigger and no player presentation code has loaded
- **THEN** the provider iframe is created within the activation's handler inside an always-mounted shell host
- **AND** player presentation loads in parallel and attaches around the existing iframe without re-creating or re-parenting it
- **AND** the existing embed loading state, busy semantics, and copy that does not imply playback are shown until the iframe reports loaded.

#### Scenario: Shell navigation follows an active session

- **WHEN** same-document navigation runs while an embed is loading, playing, or minimized
- **THEN** the iframe host is not re-parented, re-created, or reloaded
- **AND** minimize, reopen, close-before-interaction, Stop, and Back keep their existing semantics.

#### Scenario: Shopper shows intent to listen

- **WHEN** the pointer or focus reaches any Listen trigger, including Store card triggers
- **THEN** the shell may warm the provider origin with a preconnect that the credentialed iframe navigation can reuse
- **AND** warm-up remains deduplicated per origin.

#### Scenario: Listen triggers are synchronized

- **WHEN** the shell synchronizes Listen trigger labels, attributes, and disabled states after mount, navigation, or overlay changes
- **THEN** it writes only values that differ from the current DOM
- **AND** unchanged triggers cause no layout work.

### Requirement: Shell navigation keeps document work off the input path

The app shell SHALL keep whole-document snapshot, parse, and prefetch work out of the input task and bounded per section document.

#### Scenario: Visitor leaves a long section

- **WHEN** the visitor activates a shell-managed section link
- **THEN** the click task does not snapshot the leaving page
- **AND** the leaving page is snapshotted after the navigation veil has had its frames, and only when no snapshot exists for that path
- **AND** the initial mount snapshot runs at idle.

#### Scenario: An uncached section is opened

- **WHEN** the target section has no cached snapshot
- **THEN** its document request starts before the veil's frame wait
- **AND** the scroll reset and the first-screen image wait run concurrently.

#### Scenario: A section document is fetched

- **WHEN** a section document arrives for navigation or prefetch
- **THEN** it is parsed once, sanitized in place, and its eager images are collected before any serialization
- **AND** a cached result applied more than once is cloned before each application
- **AND** cached snapshots stay inert, cloning fetches no lazy images, and islands rehydrate after cached returns.

#### Scenario: Player modal opens or closes

- **WHEN** the player modal opens or closes
- **THEN** the shell does not re-run its routing setup, re-snapshot `<main>`, re-bind document listeners, or abort in-flight navigation.

#### Scenario: Mouse pointer passes over section links

- **WHEN** a mouse pointer rests on a shell-managed link
- **THEN** prefetch starts only after a dwell of 60 to 100 milliseconds and is cancelled if the pointer leaves first
- **AND** the request uses low fetch priority, is skipped under Save-Data or 2G, and warms at most the first eager image
- **AND** focus and touch or pen pointer-down still prefetch immediately.

### Requirement: Shell surfaces animate with CSS state transitions

Shell sheets, the detail overlay, the player surface, and the Store Item gallery SHALL animate with CSS transitions or keyframes on their state attributes, so opening them does not require an animation library in their loading chain.

#### Scenario: A shell surface opens or closes

- **WHEN** the mobile menu, cart drawer, detail overlay, or player surface opens or closes
- **THEN** it animates through CSS on its `data-state` with the existing durations and easing
- **AND** dialog semantics, focus trapping, Escape, and focus return are unchanged, and exit animations finish before unmount
- **AND** reduced motion resolves the transition without spatial motion.

#### Scenario: Shopper browses a Store Item gallery

- **WHEN** a Store Item with several images is shown after direct load or shell navigation
- **THEN** the gallery crossfades through CSS and supports thumbnails, previous and next controls, keyboard navigation, and touch swipes
- **AND** artwork remains uncropped, reduced motion is honored, and single-image items stay static.

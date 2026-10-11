## Purpose

Specify persistent app-shell navigation, overlay routing, and music-player behavior in the static Astro frontend.

## Requirements

### Requirement: Same-document shell navigation

The system SHALL intercept exact top-level section, Store collection-category, Store Item detail and purchase-information navigation through the persistent shell while preserving direct page loads and excluding checkout documents.

#### Scenario: Shopper switches sections

- **GIVEN** a shopper clicks a header, footer, or mobile-nav section link
- **WHEN** the destination is Home, Artists, Releases, Store, Services, About, or another declared top-level shell route
- **THEN** `AppShellRoot` fetches and swaps the rendered `<main>` content
- **AND** scroll resets, focus moves to `main[data-app-shell-main]`, and transition indicators run without a full document reload.

#### Scenario: Shopper switches Store categories

- **GIVEN** a shopper follows Store category navigation
- **WHEN** the destination is `/store/`, `/store/blackbox-releases/`, `/store/distro/`, or `/store/merch/`
- **THEN** the route is handled as shell section kind `store`
- **AND** each normalized pathname receives distinct history and same-session snapshot state
- **AND** the persistent player and StoreCart bridge remain owned by the shell.

#### Scenario: Shopper opens a Store Item while listening

- **GIVEN** a player session is minimized
- **WHEN** the shopper follows a link to `/store/<slug>/` from a Store card, a Release card or a detail overlay
- **THEN** the route is handled as shell kind `store-item` and swaps `<main>` with the full Store Item page layout
- **AND** the same player iframe stays connected and its purchase controls hydrate
- **AND** Store collection behaviour keyed on kind `store` does not run on the item page.

#### Scenario: Shopper opens purchase information while listening

- **WHEN** the destination is `/terms/`, `/privacy/` or `/withdrawal/`
- **THEN** the route is handled as shell kind `information`
- **AND** the player session survives the navigation.

#### Scenario: Shopper follows a Store Item or checkout link

- **WHEN** the destination is a Store Item detail
- **THEN** the shell handles it as kind `store-item`, never as a Store collection route
- **WHEN** the destination is cart checkout, checkout return, or an item-scoped checkout route
- **THEN** the section matcher does not treat it as a shell route
- **AND** existing non-section navigation behavior remains authoritative.

#### Scenario: Store Item slug does not exist

- **WHEN** the shell fetches a `/store/<slug>/` document that is not found
- **THEN** it falls back to native navigation.

#### Scenario: Visitor reaches the legacy Distro path

- **WHEN** the destination pathname is `/distro/`
- **THEN** the shell section matcher rejects it
- **AND** the static compatibility document redirects to `/store/distro/`.

### Requirement: Detail overlays

The system SHALL open artist, release, and news detail routes as overlays for shell-managed navigation while preserving full Astro pages for direct loads. An open overlay SHALL be a dialog named by its detail title, and the document title SHALL read `<detail title> | <site name>` while it is open. Closing an overlay without routing SHALL keep the list's scroll position and return focus to the card that opened it. A link inside an overlay to a document the shell does not handle SHALL navigate natively without adding a duplicate history entry. A delayed content-focus callback SHALL do nothing once its overlay scroll container is missing or disconnected.

#### Scenario: Detail link opens in shell

- **GIVEN** a shell-managed page contains a release, artist, or news detail link
- **WHEN** the user follows that link
- **THEN** the shell fetches the partial overlay route
- **AND** the overlay dialog's accessible name and the document title carry the detail title
- **AND** direct loads to the same detail URL still render full pages.

#### Scenario: Shopper closes an overlay far down a list

- **GIVEN** a shopper opened a detail overlay from a card far down a list
- **WHEN** they close it with Close, Escape, the backdrop or Back
- **THEN** the list keeps its scroll position and focus returns to the card without scrolling
- **AND** the previous document title is restored.

#### Scenario: A delayed focus callback outlives its panel

- **GIVEN** an overlay content-focus callback is scheduled for a later animation frame
- **WHEN** its scroll container is missing or disconnected at execution
- **THEN** the callback does not scroll the document or focus a stale close button
- **AND** the background list retains its position and restored trigger focus.

### Requirement: Persistent player session

The system MUST keep the music player owned by the persistent shell with one active Bandcamp or Tidal session.

#### Scenario: User interacts with an embed

- **GIVEN** an embed iframe has loaded and the user interacted with the iframe area
- **WHEN** the user dismisses the player
- **THEN** close semantics minimize the active session into the player-ready state
- **AND** explicit stop destroys the session.

### Requirement: Shell navigation loading remains apparent

The app shell SHALL keep same-document route transitions visibly apparent while preserving focus and scroll behavior. For an uncached Store activation that remains in flight for 750 milliseconds, it SHALL add one shared accessible `Loading Store` status until the route transition closes, without adding per-card spinners.

#### Scenario: Shell section navigation is in flight

- **GIVEN** a shopper follows a shell-managed header, footer, or mobile-nav section link
- **WHEN** the shell is fetching and applying the next page snapshot
- **THEN** the route loading indicator and section transition communicate that navigation is in progress
- **AND** the final state still resets scroll, moves focus to `main[data-app-shell-main]`, and does not leave a stale busy indicator open.

#### Scenario: Uncached Store activation exceeds the feedback delay

- **GIVEN** an uncached Store collection activation has not completed its route transition within 750 milliseconds
- **WHEN** the shared feedback delay expires
- **THEN** the route transition shows one visible `Loading Store` status with polite live semantics
- **AND** its spinner respects reduced-motion behavior
- **AND** the status remains shared rather than rendering motion on each Store card.

#### Scenario: Store activation finishes before the feedback delay

- **GIVEN** a desktop, cached, or otherwise fast Store activation closes its route transition before 750 milliseconds
- **WHEN** the delayed feedback timer would have expired
- **THEN** no `Loading Store` status flashes after completion
- **AND** listing prices may still use the existing per-card `Checking price` state until the one projection settles.

#### Scenario: Store activation is canceled or fails

- **GIVEN** a delayed Store loading timer or status belongs to the current route activation
- **WHEN** navigation is superseded, fails, or the shell unmounts
- **THEN** that activation clears its timer and shared status
- **AND** a later route does not inherit stale Store loading feedback.

### Requirement: Overlay loading is visible and accessible

The app shell SHALL show an accessible overlay loading state while partial detail content is being fetched.

#### Scenario: Overlay content is loading

- **GIVEN** a shell-managed artist, release, or news detail link opens an overlay
- **WHEN** the partial overlay HTML is not yet available
- **THEN** the overlay panel reserves stable space and shows a visible loading status
- **AND** the loading status uses `role="status"` or equivalent polite live semantics
- **AND** close behavior and focus management remain available.

### Requirement: Player embed loading is visible and calm

The player surface SHALL make third-party iframe loading visible without implying playback has started.

#### Scenario: Embedded player iframe is loading

- **GIVEN** the user starts a Bandcamp or Tidal player session
- **WHEN** the iframe is mounted but has not reported loaded state
- **THEN** the modal displays a visible embed loading state with spinner or equivalent loading affordance
- **AND** the modal exposes busy state accessibly
- **AND** the loading copy does not imply audio playback is active before iframe interaction.

### Requirement: Shell loading motion respects reduced motion

The app shell SHALL keep loading and transition motion compatible with reduced-motion preferences.

#### Scenario: Reduced motion is requested

- **WHEN** the browser reports a reduced-motion preference
- **THEN** route, overlay, and player loading indicators avoid nonessential sweeping, pulsing, or animated placeholder motion
- **AND** visible status text remains available.

### Requirement: Same-session shell cache boundary

The system SHALL treat shell page and overlay fragment caches as same-session UI caches, not as authoritative data stores.

#### Scenario: Shell caches a page snapshot

- **GIVEN** a shopper navigates through the persistent shell
- **WHEN** `AppShellRoot` caches a fetched page snapshot
- **THEN** the cached snapshot is scoped to the current browser session
- **AND** it does not cache Worker API JSON, checkout state, stock state, payment state, or provider data.

#### Scenario: Overlay fragment is cached

- **GIVEN** a shopper opens an artist, release, or news overlay
- **WHEN** the overlay fragment loader caches fetched HTML
- **THEN** the cache is treated as static route markup for the current session
- **AND** it remains separate from Cloudflare CDN/browser HTTP cache policy.

#### Scenario: Live page snapshot starts no image requests

- **GIVEN** the shell captures the current page for its same-session cache, on mount or before a section navigation
- **WHEN** it copies and sanitizes the page's main content
- **THEN** the copy lives in an inert document with no browsing context, so images it contains, including lazy ones, are not requested
- **AND** the stored snapshot HTML is the same as before.

### Requirement: Shell caches are bypassable for future freshness needs

The system SHALL provide or preserve a path to bypass or invalidate same-session shell caches when future actions require fresh route markup.

#### Scenario: Future mutation changes visible route content

- **GIVEN** a future feature mutates content that is visible in a shell-cached route
- **WHEN** the mutation completes
- **THEN** the implementation can clear, bypass, or refresh the affected shell cache entry
- **AND** it does not require a full document reload unless the route boundary requires it.

#### Scenario: Checkout or stock state changes

- **WHEN** checkout, order, or stock state changes through Worker APIs
- **THEN** shell page and overlay caches do not become the source of truth for that changed state
- **AND** any refreshed authority state comes from the Worker API.

### Requirement: Route loading remains honest under cache hits

The system SHALL keep loading feedback consistent whether shell navigation uses a cached snapshot, an in-flight fetch, or a fresh network request.

#### Scenario: Shell navigation hits same-session cache

- **WHEN** a top-level shell route is already cached in memory
- **THEN** the UI may avoid unnecessary loading animation
- **AND** it still resets scroll, moves focus, and presents the correct route state.

#### Scenario: Shell navigation fetches fresh content

- **WHEN** a top-level shell route is not cached or cache is bypassed
- **THEN** route loading feedback appears according to the loading-feedback standard
- **AND** the fetched document follows the HTTP document revalidation policy.

### Requirement: Homepage hero scroll opacity is transition-free

The app shell SHALL keep the existing responsive homepage hero image fixed and visible for as long as the Home route owns it. The media layer SHALL fade from opacity `1` to `0.12` while an internal black veil fades from opacity `0` to `0.5`, both proportional to the root scroll position over the first `42vh`. Where the browser supports scroll-driven animations, a root scroll timeline drives both without JavaScript. Elsewhere, the same keyframes apply paused and the hero scroll synchronization seeks them to its scroll progress. Neither the media layer nor the veil declares a transition. The scroll indicator retains its immediate transition-free state.

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

The app shell SHALL preserve the homepage hero composition without continuous full-viewport raster effects. One already-loaded fixed image MAY remain behind later Home content. Its media layer and one internal solid-color veil MAY change opacity only along the root scroll timeline or, where that is unsupported, through the hero scroll synchronization seeking the same paused keyframes. They SHALL cause no hero-attributable layout, image decode, or style-property write per scroll frame, and no hero-attributable paint, raster, or application work where a scroll timeline drives them.

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
- **AND** where a scroll timeline drives the fade, scroll evidence shows no hero-attributable paint, raster, image-decode, or JavaScript style write per frame
- **AND** where the fade is seeked, that seek is the only added per-frame application work, it runs only while the clamped progress changes within the first `42vh`, and frame pacing matches the coarse crossfade it replaces
- **AND** application-attributable main-thread plus style, layout, and paint work remains within the existing performance budget
- **AND** no application-attributable task or long animation frame of at least 50 milliseconds is introduced.

#### Scenario: Reduced motion is requested

- **WHEN** the browser reports a reduced-motion preference
- **THEN** the selected opacity endpoint applies without a transition or scroll-linked animation
- **AND** no fallback effect adds continuous filter, paint, raster, or compositor animation work.

### Requirement: Homepage hero scroll synchronization is route-scoped

The app shell SHALL connect hero scroll synchronization only while the current shell route owns the homepage hero.

#### Scenario: Non-home route is active

- **WHEN** the current shell-managed route is not Home
- **THEN** no homepage hero scroll listener or animation-frame callback is installed
- **AND** ordinary route scrolling does not query for a missing hero element.

#### Scenario: Shell route changes between Home and another section

- **WHEN** same-document navigation leaves or enters Home
- **THEN** hero synchronization is disconnected or connected with the route transition
- **AND** at most the existing coarse threshold state is mutated.

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

### Requirement: Hidden shell animation work follows visible state

The app shell SHALL run nonessential infinite loading and orientation animation only while the owning cue is visible and active.

#### Scenario: Route loading is inactive

- **WHEN** `isRouteLoading` resolves false and the loading indicator is closed
- **THEN** the loading bar's sweep animation is stopped rather than hidden by opacity alone
- **AND** the closed indicator creates no focus stop, announcement, or pointer target.

#### Scenario: Route loading begins

- **WHEN** same-document navigation enters its visible loading state
- **THEN** the existing loading bar may animate for that bounded active interval
- **AND** it stops after completion, cancellation, error recovery, or the existing reset timeout.

#### Scenario: Home scroll cue is no longer visible

- **WHEN** the existing coarse Home scrolled class hides the scroll cue
- **THEN** the cue's child animation is stopped
- **AND** returning above the threshold restores the cue only while Home is active.

#### Scenario: Reduced motion is requested

- **WHEN** the browser reports a reduced-motion preference
- **THEN** loading and scroll-cue animation remain disabled
- **AND** shell navigation state, route completion, and visible content remain understandable without motion.

### Requirement: Editorial item fields exclusively author player sources

The system MUST derive player providers only from validated Release or Distro provider fields while keeping Artist profile links and commerce links outside player input.

#### Scenario: Artist has provider profile links

- **WHEN** an Artist has Bandcamp or Tidal entries in `profile_links`
- **THEN** those entries remain outbound navigation
- **AND** they do not create player providers or prove that a Release or Distro item is playable.

#### Scenario: Release has zero provider sources

- **WHEN** both provider fields are absent from a Release or Distro item
- **THEN** derived player data is unavailable
- **AND** no Listen trigger or player iframe is created.

#### Scenario: Release has one or both provider sources

- **WHEN** one or both provider fields fully match their supported URL shapes
- **THEN** the shared player-data derivation returns stable editorial source identity, a nonblank display title, and a nonempty provider collection
- **AND** content does not author provider availability, layout, priority, or session state.

#### Scenario: Merch URL points to a music provider

- **WHEN** a Release `merch_url` points to Bandcamp or another provider
- **THEN** it remains commerce navigation and does not become player input.

### Requirement: Provider data is internally coherent

The system SHALL use discriminated provider and player-data types so provider ID, embed layout, URL, and availability cannot contradict each other.

#### Scenario: Bandcamp provider is derived

- **WHEN** a valid Bandcamp album or track embed is parsed
- **THEN** provider ID is `bandcamp`
- **AND** layout is respectively `bandcamp-album` or `bandcamp-track`

#### Scenario: Tidal provider is derived

- **WHEN** a valid Tidal album, track, playlist, or video URL is parsed
- **THEN** provider ID is `tidal`, layout is `tidal`, and the corresponding embed URL is derived

#### Scenario: Provider URL is only partially supported

- **WHEN** a provider URL contains an unsupported host, entity, path segment, or unconsumed trailing path
- **THEN** content validation rejects it
- **AND** no partial or ambiguous provider is derived

### Requirement: Player sessions use stable editorial source identity

The persistent shell MUST distinguish session identity from display title, support both Release and Distro sources without cross-collection collisions, and retain established Release session identity across its listening surfaces.

#### Scenario: Player trigger opens a session

- **WHEN** a valid Release or Distro player trigger opens or switches a provider
- **THEN** session reuse and provider preference are keyed by stable editorial source identity
- **AND** formatted title and artist text remain display copy only.

#### Scenario: Two releases share display text

- **GIVEN** two Releases have the same formatted display title
- **WHEN** the user opens their player triggers
- **THEN** the shell treats them as distinct source sessions.

#### Scenario: Collections share a local ID

- **GIVEN** a Release and Distro source share the same collection-local ID
- **WHEN** the user opens their player triggers
- **THEN** the shell treats them as distinct source sessions.

#### Scenario: Same source appears on multiple surfaces

- **WHEN** a visitor activates the same editorial source from its catalog card, editorial detail, or Store Item listening action within the same document
- **THEN** it uses the same session identity and existing reuse rules
- **AND** it does not create a second simultaneous player.

### Requirement: Equalizer motion communicates a listening action without asserting playback

Shared Listen controls and the persistent player's modal header and mini player SHALL use the selected decorative Fluid five equalizer. Motion SHALL be finite, preserve control position, and respect reduced-motion preferences. The equalizer MUST NOT assert that a third-party iframe is playing.

#### Scenario: Listener focuses or activates the player

- **WHEN** a listener hovers or focuses Listen, opens the modal, or interacts with the minimized player
- **THEN** the equalizer can animate for two brief cycles before settling
- **AND** existing provider loading, close/minimize, Stop and iframe continuity semantics remain unchanged.

#### Scenario: Listener requests reduced motion

- **WHEN** reduced motion is enabled
- **THEN** the bars remain static while action labels, visible focus and provider controls remain usable.

#### Scenario: Provider playback state is unknown

- **WHEN** an iframe is loaded or receives interaction without verified playback state
- **THEN** the shell retains truthful loading or Player Ready copy
- **AND** decorative bars are hidden from assistive technology.

### Requirement: Header cart control has a supplementary visible label

The public header SHALL render its cart control only while the cart contains at least one item or the current route is a store route (the Store collections, Store Item pages and checkout pages). While rendered, it SHALL show a compact English Cart label beneath its cart icon on pointer hover and keyboard focus without moving the header or changing the button's accessible item count, badge or cart-opening behavior. The header SHALL reserve the control's space so its appearance or disappearance does not shift other header controls.

#### Scenario: Shopper hovers the cart

- **WHEN** a hover-capable pointer rests on the header cart button
- **THEN** the square, dark label appears after 200 milliseconds with a 120-millisecond opacity fade
- **AND** it remains visible while the pointer is over the button, the label or the space between them
- **AND** it disappears when neither hover nor keyboard focus remains.

#### Scenario: Shopper uses the keyboard

- **WHEN** the cart button receives visible keyboard focus
- **THEN** the label appears immediately and the existing focus indicator remains visible
- **AND** Escape dismisses the label without moving focus or opening the cart
- **AND** dismissal persists until a new hover or focus interaction.

#### Scenario: Shopper activates the cart

- **WHEN** the shopper clicks, presses Enter or Space, or taps the cart button
- **THEN** the label is dismissed and the existing cart drawer opens
- **AND** touch activation needs only one tap.

#### Scenario: Shopper requests reduced motion

- **WHEN** the browser requests reduced motion
- **THEN** the label still identifies the cart but has no opacity fade.

#### Scenario: Cart count or shell route changes

- **WHEN** the cart contains one item or multiple items, or the shopper changes shell sections with items in the cart
- **THEN** the control stays rendered, the supplementary label remains Cart and is hidden from assistive technology
- **AND** the button retains its correct accessible name and count badge
- **AND** shell-owned cart state and player continuity are preserved.

#### Scenario: Cart is empty away from the store

- **WHEN** the cart is empty and the current route is not a store route
- **THEN** the header renders no cart control and no cart fallback
- **AND** the header layout does not shift.

#### Scenario: Cart is empty on a store route

- **WHEN** the cart is empty and the route is a Store collection, Store Item or checkout page
- **THEN** the cart control is rendered with the accessible name Cart and no count badge.

#### Scenario: Cart drawer closes

- **WHEN** the shopper closes the cart drawer
- **THEN** focus returns to the control that opened it (Add to cart or the header cart control) while that control is still in the page
- **AND** otherwise to the header cart control when it is rendered
- **AND** otherwise to the main content landmark.

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
- **AND** reduced motion, `data-lenis-prevent` panes, iframes, form controls, and the Store Crate stage keep native scrolling.

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

- **WHEN** the visitor prefers reduced motion or interacts with a form control, iframe, embedded player, or the Store Crate stage
- **THEN** the system honors immediate or native scrolling for that interaction
- **AND** each runtime instance is removed or refreshed when its owned surface disconnects.

### Requirement: Public coordinated transitions use Motion without changing shell ownership

First-party coordinated public transitions SHALL use cancellable Motion animations. They MUST preserve existing route loading semantics, overlay focus, dialog behavior, and the identity of an active player iframe. Reduced motion SHALL complete transitions without spatial motion or decorative repetition.

#### Scenario: Navigation or an overlay transition is interrupted

- **WHEN** a transition is superseded, its surface closes, or the owning component unmounts
- **THEN** its animation is stopped and cleaned up
- **AND** no stale callback changes the current route, locks scrolling, or disables controls.

### Requirement: Store browsing preserves orientation and truthful availability

Store view controls SHALL stay mounted during Crate movement and filtering. Repeating a format selection SHALL preserve the Crate's item in hand. Static cards MUST NOT claim current availability from build-time data; live Store Offer details remain authoritative.

#### Scenario: Visitor browses a product with several images

- **WHEN** the visitor opens a Store Item with additional source images
- **THEN** the artwork area presents every image through thumbnails, previous/next controls, keyboard navigation, and touch swipes
- **AND** Motion respects reduced-motion preferences, artwork remains uncropped, and single-image items remain static.

#### Scenario: Visitor follows an artist provider link

- **WHEN** Bandcamp or TIDAL appears among an artist's links
- **THEN** the link uses its provider's recognizable brand mark with its existing accessible name.

### Requirement: Back closes the cart drawer and phone Menu

While the cart drawer or the phone Menu is open, the shell SHALL keep one history entry for it at the page's own URL, so Back closes the sheet without routing the page beneath it. Closing the sheet in place SHALL consume that entry, and following a Menu section link SHALL replace it.

#### Scenario: Shopper presses Back with the cart open

- **GIVEN** the cart drawer or the phone Menu is open over a page
- **WHEN** the shopper presses Back
- **THEN** the sheet closes and the page keeps its URL, content and scroll position
- **AND** Forward reopens the sheet.

#### Scenario: Shopper closes the sheet with its controls

- **WHEN** the shopper closes the sheet with Close, Escape or the backdrop
- **THEN** the sheet's history entry is consumed
- **AND** the next Back navigates, with no press that does nothing.

### Requirement: History traversal restores the scroll position

The shell SHALL record the scroll offset in the current history entry before a section navigation, before a sheet opens and when the document is hidden, and SHALL restore it when Back or Forward returns to that entry, including a returned or reloaded document. Clicked links and Menu links SHALL keep resetting the scroll to the top.

#### Scenario: Visitor returns to a scrolled section

- **GIVEN** a visitor scrolled a section page, then followed a link to another section
- **WHEN** they press Back
- **THEN** the earlier section is shown at the offset it had when they left.

### Requirement: The floating player reserves page space and stacks below sheets

While a player session exists, the page end and the root bottom scroll padding SHALL reserve the floating player's height plus the bottom safe area, so the last content and focused controls stay visible above it. The phone Menu sheet SHALL stack above the floating player and below the player modal.

#### Scenario: Phone visitor scrolls to the footer with the player minimized

- **GIVEN** a minimized player session on a 390 × 844 phone
- **WHEN** the visitor scrolls to the end of the page
- **THEN** the footer is fully visible above the floating player
- **AND** the open Menu's Close control receives a tap at its own position.

### Requirement: The player modal fits short viewports and phone album embeds

On viewports up to 30rem tall, the player modal SHALL show its header and controls beside the embed with no scrolling inside the modal, and the Bandcamp embed SHALL narrow to fit the available height. Below 40rem wide, a Bandcamp album embed SHALL be sized to its cover-and-transport height without an empty area beneath it.

#### Scenario: Landscape phone opens the player

- **WHEN** the player modal opens at 844 × 390
- **THEN** the embed, its transport controls and Close are inside the viewport
- **AND** the modal does not scroll.

### Requirement: The background is inert behind the player modal and detail overlays

While the player modal or a detail overlay is open, the skip link, header, main content and footer SHALL be inert. Inertness SHALL lift before focus returns on close, and focus return SHALL NOT scroll the page.

#### Scenario: Keyboard user opens a detail overlay

- **GIVEN** a detail overlay or the player modal is open
- **WHEN** the user moves through the page with Tab or a screen reader's reading order
- **THEN** only the open dialog's content is reachable
- **AND** after closing it, the page is interactive again and focus is on the control that opened it.

### Requirement: The fixed header never covers focused or anchored content

The root top scroll padding SHALL equal the header height plus 0.5rem, section scroll margins SHALL be relative to it, and script-driven target scrolling SHALL apply the same offset. The skip link and the route loading indicator SHALL paint above the header and below sheets and dialogs.

#### Scenario: Keyboard user starts on a phone

- **WHEN** a keyboard user presses Tab on a fresh page at 390 px wide
- **THEN** the skip link is the first stop and is painted above the header
- **AND** following an in-page anchor lands the target below the header.

### Requirement: Cart quantity changes are announced

The cart drawer's quantity controls SHALL form a labelled group, and each quantity step SHALL be announced politely with the item title, the new quantity and the line total; a removal announcement SHALL take priority.

#### Scenario: Shopper increases a quantity

- **WHEN** the shopper presses the increase control for a cart line
- **THEN** a polite live region announces the title, the new quantity and the line total.

### Requirement: Closing the cart returns focus to its opener on tap-only browsers

Closing the cart drawer SHALL return focus to the control that opened it, the Buy or Add To Cart control or the header Cart, even when the browser did not focus that control on tap; otherwise to the element focused before opening, then the header Cart, then main. The shell SHALL set `html[data-app-shell-ready]` once its document listeners are attached, so tests and tooling wait for that marker instead of a delay.

#### Scenario: iOS Safari shopper closes the cart after Buy

- **GIVEN** a shopper tapped Buy on a Store card and the cart drawer opened
- **WHEN** they close the drawer
- **THEN** focus is on that Buy control.

### Requirement: Public documents declare a dark browser theme

Every public shell document, the redirect layout and the 404 page SHALL declare `theme-color` `#0d0d0d` and a dark `color-scheme`, so phone browser chrome and form controls match the site.

#### Scenario: Phone visitor loads any public page

- **WHEN** a public page, a redirect page or the 404 page loads
- **THEN** its head contains `theme-color` `#0d0d0d` and `color-scheme` `dark`.

### Requirement: Shell documents link a touch icon and a web manifest

Shell documents SHALL link a 180 px `/apple-touch-icon.png` and `/manifest.webmanifest`. The manifest's start URL and scope SHALL be relative, its icons SHALL include 192 px, 512 px and maskable 512 px images, and its display SHALL be `minimal-ui`, so an installed site shares the browser's cart storage and checkout return.

#### Scenario: Visitor adds the site to a home screen

- **WHEN** a phone browser reads the page's icon and manifest links
- **THEN** it receives the 180 px touch icon and a manifest with relative start URL and scope and `minimal-ui` display.

### Requirement: Shared links use the configured site and the product image

The canonical link and `og:url` SHALL be built from the configured site and the request pathname, and a Store Item page SHALL use its product image and alt text as the sharing image.

#### Scenario: Visitor shares a Store Item from a phone

- **WHEN** a Store Item page is loaded
- **THEN** its canonical link and `og:url` are the configured site plus the item's pathname
- **AND** its `og:image` is a 1200 px JPEG of the product image.

### Requirement: Public text fields are 16 px on phones

Below 48rem every public text input, select and textarea SHALL render at a computed size of at least 16 px without disabling pinch zoom; wider viewports keep their sizes.

#### Scenario: iPhone visitor focuses a field

- **WHEN** a visitor at 390 px wide focuses any public text field
- **THEN** its computed font size is at least 16 px, so iOS Safari does not zoom the page.

### Requirement: Search fields and form errors suit phone keyboards

The Store and Artists search fields SHALL offer a search Enter key with autocorrect, autocapitalisation and spellcheck off, and Return SHALL dismiss the keyboard without changing results. Clear filters SHALL move focus to the live result count. A Notify me submission failing only on consent SHALL move focus to the consent checkbox.

#### Scenario: Shopper searches the Store on a phone

- **WHEN** the shopper types a query in Store search and presses Return
- **THEN** the keyboard closes
- **AND** the filtered results stay as typed.

#### Scenario: Shopper clears the filters

- **WHEN** the shopper activates Clear filters
- **THEN** focus moves to the live result count.

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

### Requirement: Main navigation is one model on every surface

The public site SHALL build one main navigation in which Home is structural and always first, followed by the main-menu sections editors choose.

- The phone Menu SHALL list Home and every section.
- The desktop header SHALL list the sections beside the logo, which links Home.
- The header, the Menu and the footer sitemap SHALL render page links through one link model and one link style, so a destination keeps the same attributes, accent and current-page state wherever it appears.

#### Scenario: Shopper opens the Menu on a phone

- **WHEN** a shopper below the desktop breakpoint opens the Menu
- **THEN** Home is the first link, followed by the main-menu sections in editorial order
- **AND** Home appears exactly once
- **AND** following Home uses same-document shell navigation and preserves the persistent player.

#### Scenario: The current page is marked

- **WHEN** a header, Menu or footer link targets the current page
- **THEN** it carries `aria-current="page"` and the shared underline marker under its label
- **AND** after same-document shell navigation, the header and footer links update without a reload.

#### Scenario: Store and Services links are not current

- **WHEN** a Store or Services link does not target the current page
- **THEN** it uses the neutral link colour without a side stripe
- **AND** it shifts to its route accent only on hover from a hover-capable pointer, keyboard focus or press.

#### Scenario: Shopper uses the Menu button

- **WHEN** the header renders below the desktop breakpoint
- **THEN** the Menu button shows its icon with the visible label Menu, which is also its accessible name
- **AND** it exposes `aria-haspopup="dialog"` and an `aria-expanded` value that matches the Menu
- **AND** closing the Menu with Escape or Close returns focus to the button.

#### Scenario: The layout reaches the desktop breakpoint

- **WHEN** the viewport widens to the desktop breakpoint while the Menu is open
- **THEN** the Menu closes, because only the phone layout offers it.

#### Scenario: Shopper taps navigation on a small phone

- **WHEN** the viewport is 320 to 390 CSS pixels wide
- **THEN** every Menu link, the Menu Close control and every footer sitemap link is at least 44 CSS pixels tall
- **AND** the footer sitemap wraps onto more lines instead of clipping a link
- **AND** the page has no horizontal overflow.

### Requirement: Back closes the open player

While the player modal is open, the shell SHALL keep one history entry for it at the page's own URL, so the device or browser Back control closes the modal instead of navigating the page beneath it. Closing through Back SHALL use the modal's close semantics: an interacted session minimizes into the floating player and any other session stops. Toggling the player through history SHALL NOT route, scroll or re-render the page beneath it.

#### Scenario: Listener presses Back while the player is open

- **GIVEN** the player modal is open over a page
- **WHEN** the listener presses the Android Back key, the Back gesture or the browser's Back
- **THEN** the modal closes, minimizing a session the listener interacted with and stopping one they did not
- **AND** the page beneath keeps its URL, content and scroll position
- **AND** the next Back navigates as it would without the player.

#### Scenario: Listener closes the player with its controls

- **WHEN** the listener closes the modal with Close or Minimize, Escape or the backdrop
- **THEN** the player's history entry is consumed
- **AND** one Back then navigates, with no press that does nothing.

#### Scenario: Player opened from a release overlay

- **GIVEN** the listener opened the player from a release detail overlay
- **WHEN** they press Back
- **THEN** only the player closes and the overlay stays open at its URL
- **AND** the next Back closes the overlay.

#### Scenario: Listener goes Forward after Back closed the player

- **GIVEN** Back minimized an interacted session
- **WHEN** the listener presses Forward
- **THEN** the player modal reopens with the same session
- **AND** the page beneath is not routed again.

### Requirement: Cached shell pages rehydrate their islands

The system SHALL restore a cached shell page's framework islands with their server markup and hydration marker, so they hydrate again instead of returning inert or with markup from an earlier visit.

#### Scenario: Shopper returns to a cached page with an island

- **GIVEN** a shell section page holds a hydrated island, such as the newsletter form on Home or Who we are
- **AND** the shopper typed into it and then navigated to another section
- **WHEN** the shopper returns to the page from the shell cache
- **THEN** the island shows its server-rendered state and hydrates again
- **AND** submitting it runs the island's handler without a document navigation.

### Requirement: Shell page entry keeps fixed layers viewport-fixed

The shell page-enter transition SHALL NOT apply a transform, translate, scale, filter, perspective or other containing-block-creating property to the shell main element, during or after the transition.

#### Scenario: Shopper navigates to Home through the shell

- **GIVEN** a shopper is on another shell section
- **WHEN** the shopper activates a link to Home and the page-enter transition runs
- **THEN** the main element only fades its opacity
- **AND** the fixed Home hero media layer stays sized to the viewport during and after the transition, as on a direct load.

### Requirement: Mobile Releases preserve aligned readable actions

The Releases page SHALL preserve its approved editorial hierarchy on small screens with consistent gutters, complete artwork, naturally wrapping metadata and usable touch controls, without disrupting shell-owned navigation or playback.

#### Scenario: Narrow viewport

- **WHEN** Releases renders from 320px through tablet widths
- **THEN** artwork, identity, release state, price and actions align coherently without horizontal document overflow
- **AND** long titles and metadata remain readable

#### Scenario: Existing desktop and shell behavior

- **WHEN** the viewport is desktop-sized or the shopper navigates through the persistent shell
- **THEN** the approved desktop composition and existing listening, purchase and player continuity remain available

### Requirement: Mobile footer links form a balanced navigation group

The mobile footer SHALL align all sitemap links as an intentional group, including Delivery information, while preserving their logical order, accessible targets and native destinations.

#### Scenario: Footer renders on a narrow screen

- **WHEN** the footer renders at a phone width
- **THEN** links use balanced columns and usable touch targets without horizontal overflow or an isolated delivery-information row.

#### Scenario: Footer is used on desktop

- **WHEN** a visitor follows a footer section link on desktop
- **THEN** the existing composition, destination and persistent shell/player navigation remain usable.

### Requirement: Staff footer text wraps naturally

The footer SHALL render the Staff description as one paragraph without inserting sentence-dependent line breaks.

#### Scenario: Staff saves a short description with several sentences

- **WHEN** Staff saves `No borders. No genres. Just noise.`
- **THEN** the footer keeps the sentences together whenever they fit and wraps only according to available width.

### Requirement: Homepage motto cycles its last word with a waveform scrub

The homepage hero SHALL cycle the last word of the Staff motto through Records, Art and Noise when the motto ends with one of them, starting from the written word in its casing and punctuation. A playhead SHALL scrub between words with random glitch tears and torn track-waveform fragments, confined to a span that moves from the old word's length to the new word's length and ending before the scrub's last third. The written word SHALL hold 1.5 s on entry, every later word 2.8 s, and each scrub SHALL take 1.4 s. Assistive technology SHALL read the written motto.

#### Scenario: Visitor opens Home

- **WHEN** Home renders the motto `No borders. No genres. Just records.`
- **THEN** Records shows first and is the word announced to assistive technology
- **AND** after its hold a playhead scrubs to Art, then Noise, then Records again without moving the preceding words or the line layout.

#### Scenario: Staff writes a different motto

- **WHEN** the motto's last word is not Records, Art or Noise
- **THEN** the motto renders exactly as written with no animation.

#### Scenario: Visitor prefers reduced motion or cannot see the hero

- **WHEN** the visitor prefers reduced motion
- **THEN** the written word stays and no playhead or tears appear
- **AND** while the hero is off screen or the tab is hidden the cycle pauses and resumes its remaining hold afterwards.

#### Scenario: Visitor returns to Home through the shell

- **WHEN** the visitor leaves Home through shell navigation and returns
- **THEN** the motto keeps cycling without a full page load.

### Requirement: News is reachable from the main navigation

The public main navigation SHALL include News directly before the final Who we are section on desktop and in the phone Menu, linking to `/news/`. It SHALL use the existing section-link appearance, current-page underline, keyboard focus and same-document routing. The footer navigation SHALL remain unchanged.

#### Scenario: Visitor returns to News from another section

- **GIVEN** a visitor is browsing another public section
- **WHEN** they choose the News link in the desktop header or phone Menu
- **THEN** the existing News listing opens without reloading the document
- **AND** News becomes the current section, focus moves to the main content and the viewport returns to the top
- **AND** the phone Menu closes after navigation

#### Scenario: Visitor reads an article and returns to the listing

- **GIVEN** the visitor reached News through the main navigation
- **WHEN** they open a News article and close its detail overlay
- **THEN** they return to the News listing with News still marked as the current section

#### Scenario: News navigation preserves an existing player

- **GIVEN** a visitor has interacted with and minimized the music player
- **WHEN** they navigate to News and open and close an article
- **THEN** the existing player iframe remains connected and the player can be reopened

#### Scenario: Main navigation fits desktop and phone widths

- **WHEN** the navigation is displayed at 320, 390, 1024 or 1440 px
- **THEN** News precedes the final Who we are link without clipping or horizontal overflow
- **AND** phone Menu links retain targets at least 44 px tall

### Requirement: Home motto transitions preserve appearance with bounded work

The Home motto SHALL keep its approved word timing, torn slices, waveform shards, and playhead while avoiding repeatable transition-attributable main-thread tasks of 50 milliseconds or longer in the declared 4× CPU mobile profile.

#### Scenario: Visible Home motto changes word

- **WHEN** the visible Home motto reaches a word transition with motion permitted
- **THEN** the written word cycles with the existing hold and scrub timing, seven torn text slices, five waveform shards, random burst positions, and playhead reveal
- **AND** repeated transitions introduce no motto-attributable task of at least 50 milliseconds in the declared mobile profile.

#### Scenario: Font or viewport metrics change

- **WHEN** the brand font finishes loading or the viewport changes size
- **THEN** the next transition uses current word dimensions and color without a clipped or displaced waveform.

#### Scenario: Motion is disabled or Home leaves view

- **WHEN** reduced motion is requested, the document is hidden, or Home leaves view
- **THEN** the motto preserves the existing pause, settle, and readable-word behavior.

### Requirement: Shell prefetch follows deliberate pointer or keyboard intent

The shell SHALL NOT fetch a destination document or overlay from a touch or pen hover/press gesture before activation. It SHALL preserve deliberate mouse-hover and keyboard-focus warming, subject to reduced-data preferences for speculative requests.

#### Scenario: Touch or pen begins a swipe on a link

- **WHEN** a touch or pen pointer enters or presses a shell or overlay link and the gesture is cancelled or turns into a swipe
- **THEN** no destination document or overlay is fetched from that gesture, including focus generated by the press.

#### Scenario: Touch or pen activates a link

- **WHEN** a touch or pen tap activates a shell or overlay link
- **THEN** the existing navigation loader fetches the destination and preserves shell focus, scroll, overlay, and player behavior.

#### Scenario: Mouse hovers or keyboard focuses a link

- **WHEN** a mouse deliberately dwells over a link or keyboard navigation focuses it
- **THEN** the shell may warm the relevant destination or player origin before activation
- **AND** speculative document requests respect reduced-data preferences.

### Requirement: Every listening action identifies the existing session

The shell SHALL mark shared controls for the active editorial source as disabled amber In player status across Store, Releases and details. Other sources SHALL retain Listen. The floating player's Open and Stop actions SHALL remain available on desktop and mobile. Status MUST NOT claim verified playback.

#### Scenario: A session is minimized and its source appears elsewhere

- **WHEN** shell navigation, cached restoration or detail rendering shows the active source
- **THEN** its listening control displays In player and cannot open a second session
- **AND** the floating player remains the place to reopen or stop the existing session.

#### Scenario: A session is stopped or replaced

- **WHEN** Stop ends the session or another source replaces it
- **THEN** all previously matching controls return to their original enabled label
- **AND** a cached page is synchronized with the current source when restored.

#### Scenario: Store cards offer listening

- **WHEN** a Store collection renders a record with a verified source
- **THEN** its 112 × 44px listening action appears below artwork and before the title in Grid
- **AND** source-less records retain row alignment without displaying an invented action.
- **AND** Grid actions align with card text.

#### Scenario: The Store Crate's item in hand listens from its own card

- **WHEN** the Store Crate holds an item with a verified source
- **THEN** that item's own Store card offers its Listen action beside the bin, with its source, provider data and current session state
- **AND** activating it opens the player for that item, and closing the player returns focus to it
- **AND** it displays In player while that source is the active session.

#### Scenario: Stop is pressed once

- **WHEN** the shopper activates Stop in the floating player
- **THEN** the control reads Stop? and keeps its accessible name and position
- **AND** the session continues
- **AND** the control returns to Stop after three seconds without a second activation.

#### Scenario: Stop is pressed twice

- **WHEN** the shopper activates Stop? within the window
- **THEN** the session ends with the existing Stop semantics, including focus restoration and iframe removal.

### Requirement: Homepage hero offers Store entry points

The homepage hero SHALL show, under the motto, a Browse the Store link to `/store/` as its only action. The hero SHALL NOT render a See pre-orders link. The showcase SHALL hydrate at browser idle priority so the main page can load first. Browse the Store SHALL remain available in the initial HTML independently of the showcase. The hero SHALL show no Scroll label; its animated scroll line keeps its existing states.

#### Scenario: Visitor lands on Home with pre-orders open

- **GIVEN** the Worker reports at least one stocked pre-order
- **WHEN** the visitor opens Home
- **THEN** the hero shows only Browse the Store under the motto
- **AND** Browse the Store opens `/store/`
- **AND** the pre-orders showcase remains available further down Home

#### Scenario: Main page loads before the pre-order showcase is ready

- **WHEN** Home has rendered and its deferred pre-order check is still pending
- **THEN** the hero, motto and Browse the Store link remain available
- **AND** no additional hero action appears when the showcase renders
- **AND** the showcase loads automatically at browser idle priority without requiring scrolling or a click

#### Scenario: Visitor lands on Home with no pre-orders open

- **GIVEN** the Worker reports no stocked pre-orders
- **WHEN** the visitor opens Home
- **THEN** the hero shows Browse the Store
- **AND** no See pre-orders link is shown

#### Scenario: Visitor sees the hero without a Scroll label

- **WHEN** the homepage hero renders
- **THEN** no Scroll text is shown
- **AND** the animated scroll line still hides without a transition once the hero is scrolled

### Requirement: Compact hero Store action remains accessible

Browse the Store SHALL use the approved compact outlined treatment on mobile and desktop: a 28 px drawn height, approximately 100 px width at the default text scale, 12 px type and a translucent black face. Touch devices SHALL retain a target at least 44 px high independently of the drawn frame. Keyboard focus SHALL remain visible.

#### Scenario: Visitor opens Home on a phone

- **WHEN** Home is displayed at 390 px or narrower, down to 280 px
- **THEN** the motto and Store link share the logo's left edge
- **AND** nothing overflows horizontally
- **AND** the Store link keeps its 44 px touch target

#### Scenario: Visitor taps outside the compact frame

- **GIVEN** Home is displayed on a touch device
- **WHEN** the visitor taps within the Store link's invisible 44 px target, just above or below its drawn frame
- **THEN** the Store opens through the persistent shell

#### Scenario: Visitor uses a keyboard on desktop

- **WHEN** the visitor focuses Browse the Store with a keyboard
- **THEN** the link has a visible focus outline
- **AND** pressing Enter opens the Store through the persistent shell

### Requirement: Bandcamp embeds use the house dark appearance

The system SHALL render every valid Bandcamp embed with the house appearance, whatever appearance options the stored URL carries: `size=large`, `bgcol=0d0d0d`, `linkcol=f5f5f5`, `artwork=big`, `transparent=true`, and `tracklist=false` for a track. Only the album or track identity SHALL come from the stored URL.

#### Scenario: Staff paste Bandcamp's default light embed

- **GIVEN** a stored embed URL with `bgcol=ffffff` and `linkcol=0687f5`
- **WHEN** the player provider is derived
- **THEN** the embed URL uses the house appearance for the same album
- **AND** content validation accepts the stored URL
- **AND** the staff Bandcamp field stores the house URL for a newly pasted embed.

#### Scenario: Embed carries an unknown option

- **WHEN** a stored Bandcamp embed URL contains an option outside the supported set
- **THEN** content validation rejects it and no provider is derived.

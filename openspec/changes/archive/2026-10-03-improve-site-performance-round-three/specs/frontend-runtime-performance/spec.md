## ADDED Requirements

### Requirement: Settled public pages run no recurring frame work

The system SHALL keep a settled public page free of recurring animation-frame callbacks and document-wide blocking input listeners that serve no visible behavior.

#### Scenario: A page sits idle

- **GIVEN** Home, About, or Store Distro has finished loading and the visitor is not scrolling or interacting
- **WHEN** five settled seconds are traced at 4× CPU in desktop and in touch emulation
- **THEN** no animation-frame callback recurs during the window
- **AND** main-thread work stays within run-to-run noise of the same route measured without the scroll runtime.

#### Scenario: A touch device loads any page

- **WHEN** a page loads on a coarse or hover-less pointer
- **THEN** no non-passive wheel or touch listener is registered on `window` or `document`
- **AND** scrolling and modal locking still behave as the app shell specifies.

#### Scenario: A fine-pointer device loads any page

- **WHEN** a page loads on a fine pointer with hover
- **THEN** wheel input remains native and constructs no public Lenis instance
- **AND** the existing scroll API uses browser smooth scrolling for in-page intent, immediate resets for navigation, and shell body state for modal locking.

### Requirement: Repeated state changes restyle bounded element sets

The system SHALL keep the style recalculation caused by a repeated user-driven state change bounded by the elements that state actually affects, independent of document size.

#### Scenario: A class changes on the document element

- **WHEN** any class is added to or removed from `<html>` on `/store/distro/`
- **THEN** the resulting style recalculation touches a small constant number of elements rather than the whole document
- **AND** the stylesheet contains no third-party rules that descend from a document-element class and no `[class*=…]` attribute-substring selectors in shared UI primitives.

#### Scenario: Shopper steps through Coverflow

- **WHEN** the shopper activates Next or Previous in a Store Coverflow preview
- **THEN** the style recalculation touches only the rail and the positioned and newly positioned cards, not the whole group
- **AND** an inherited custom property that changes per step is set on its only reader.

#### Scenario: Shopper types the first search keystroke

- **WHEN** the first keystroke switches a Store collection from catalog to search results
- **THEN** image `sizes` are not rewritten on every card
- **AND** the artist picker commits once per keystroke.

### Requirement: Store collection chrome does not shift the catalog

The system SHALL render Store collection toolbar, view controls, and the mobile artist picker in their final boxes before hydration, so enhancement does not move the cards.

#### Scenario: Store collection loads directly

- **WHEN** `/store/` or a Store category page loads and the shell hydrates
- **THEN** the search toolbar, view controls, and mobile artist picker are present in the server HTML at their final size, disabled until ready
- **AND** enhancement changes their state in place without changing their box sizes
- **AND** the result total stays hidden in the server render
- **AND** desktop and mobile CLS from that enhancement are within run-to-run noise of zero.

#### Scenario: Store collection opens through shell navigation

- **WHEN** a Store collection is applied by shell navigation or restored from a cached snapshot
- **THEN** the same server-rendered chrome is enhanced in place
- **AND** no control is lost or duplicated.

### Requirement: Store Item pages are covered by the eager JavaScript check

The system SHALL apply the route eager-JavaScript check to Store Item pages, including a page with an image gallery.

#### Scenario: Public build output is checked

- **WHEN** the bundle-graph check runs against fresh public output
- **THEN** it measures a single-image Store Item page and a gallery Store Item page beside the existing routes
- **AND** each stays within the public eager budget, or within an explicit Store Item budget whose reason is recorded with the check
- **AND** no budget is raised only to turn a failing result into a pass.

#### Scenario: A Store Item page with a gallery loads

- **WHEN** a gallery Store Item page completes its initial load
- **THEN** no animation library is part of its eager graph solely for the gallery
- **AND** the StoreCart parser is not eager unless a stored cart exists.

### Requirement: Public fonts are self-hosted and discovered early

The system SHALL serve every public font face from the site's own fingerprinted assets and SHALL start the brand font request from the document head.

#### Scenario: A public page loads

- **WHEN** any public page, including 404, loads
- **THEN** it requests no third-party font origin and loads no third-party font stylesheet
- **AND** Inter, Geist Mono, and Bebas Neue are declared in the bundled stylesheet from fingerprinted files
- **AND** only faces used above the fold are preloaded.

#### Scenario: Brand font is preloaded

- **WHEN** the document head is parsed
- **THEN** it preloads the fingerprinted Veneer file as a font with CORS mode, matching the URL the stylesheet declares
- **AND** the preload decision records at least three equivalent A/B runs on the mobile stress profile, font request discovery, LCP, layout work and CLS without treating a small shared-machine LCP difference as causal proof.

#### Scenario: A UI face arrives late in the same-document shell

- **WHEN** a self-hosted UI face finishes loading after the first document's block period
- **THEN** its declared `font-display` and preload choice are recorded with their reason
- **AND** no face is downloaded on every page while remaining unused for the rest of the shell session without a recorded reason.
- **AND** Inter, Geist Mono and Bebas Neue use `font-display: swap`; only Latin Inter and Veneer preload in the public shell, with Latin Geist Mono added on Releases and Latin Bebas Neue added on 404.

#### Scenario: The 404 page is shown

- **WHEN** the 404 page loads
- **THEN** it uses the site's font strategy without render-blocking third-party stylesheets
- **AND** its decorative infinite animations stop under reduced motion and while offscreen.

## MODIFIED Requirements

### Requirement: Long catalog pages skip offscreen rendering

The system SHALL balance initial rendering and first traversal on Store All and Store Distro without requiring one containment strategy for every category route or breakpoint.

#### Scenario: Shopper scrolls through contained content

- **WHEN** a skipped Store All or Store Distro group approaches the viewport
- **THEN** its content renders without a visible scrollbar jump, overlapping content, broken responsive image loading, or horizontal overflow
- **AND** keyboard order, find-in-page, accessibility-tree access, and shell scroll reset remain correct.

#### Scenario: Native containment meets the route budget

- **WHEN** Store All and Store Distro pass the declared scroll gate with native containment
- **THEN** list virtualization, pagination, and infinite scrolling are not added for performance reasons.

#### Scenario: Long catalog initially renders

- **WHEN** `/store/` or `/store/distro/` contains content beyond the viewport
- **THEN** the complete selected server-rendered Store collection remains present in source order
- **AND** any offscreen-rendering boundary uses measured native card paint skipping, semantic groups or bounded chunks rather than mandatory strict containment on every card
- **AND** intrinsic-size estimates, when used, are measured for the owning route and breakpoint
- **AND** client-side virtualization is not introduced by default.

#### Scenario: Listing-card paint skipping improves traversal

- **GIVEN** equivalent three-run Store All and Store Distro catalog traversals show lower main-thread work with native card paint skipping
- **WHEN** the complete server-rendered listing remains in the document
- **THEN** listing cards use `content-visibility: auto` and a remembered intrinsic block size with the measured 520 px initial estimate
- **AND** preview layout, native keyboard access and shell navigation remain governed by their existing acceptance checks.

#### Scenario: Distro initial layout boundary is bounded

- **GIVEN** Store Distro renders multiple six-card chunks across one or more groups
- **WHEN** the initial document is laid out
- **THEN** the first chunk of the first group remains eagerly rendered
- **AND** below-fold chunks use a measured rendering strategy for their actual preview, expanded catalog, or fallback state
- **AND** containment is not required on wrappers that generate no layout box
- **AND** group headers, format navigation, and search structure remain outside card containment; cards may use layout and inline-size containment without block-size or paint containment
- **AND** every card remains server-rendered in canonical source order.

#### Scenario: Store rendering modes are measured

- **WHEN** a Store rendering change is evaluated
- **THEN** Store All and Store Distro settled preview and expanded catalog first and repeat traversal are measured separately at the declared wide and mobile profiles
- **AND** evidence identifies the implementation tree, browser version, group modes, card counts, and scroll extent
- **AND** a failed enhancement setup is not silently counted as preview acceptance
- **AND** raw traces for failing traversals remain available to attribute individual rendering slices and tasks
- **AND** windowed work summaries do not replace individual-slice, long-task, or long-animation-frame gates
- **AND** native animation-frame timestamps and callback-dispatch intervals are recorded separately, with a rendering interval for the final scroll input
- **AND** search, later-group selection, reduced motion, and enhancement-disabled fallback preserve complete content and accessible navigation.

#### Scenario: Store preserves prepared catalog layout

- **WHEN** an enhanced Store collection shows a Coverflow preview
- **THEN** non-preview cards may remain invisibly laid out in their canonical grids at catalog width
- **AND** only positioned preview cards are visible and keyboard-accessible in that preview
- **AND** catalog, search, reduced-motion, and enhancement-disabled views retain complete content without estimated-height corridors
- **AND** Store listing and Distro card titles may use the existing UI display font while page/group headings retain the brand font and original font assets remain unchanged
- **AND** self-hosted UI font delivery prevents an unbounded late font replacement.

#### Scenario: Distro disclosure separates rendering phases

- **WHEN** View all changes the group to catalog mode
- **THEN** catalog state and expanded accessibility state apply synchronously
- **AND** the existing controller may resolve styles before allowing a complete rendering frame ahead of focus
- **AND** search, format selection, cleanup, or navigation cancels obsolete deferred focus
- **AND** the existing disclosure visual-completion and long-task budgets still apply.

#### Scenario: Shopper begins the first traversal

- **WHEN** previously skipped content approaches the declared first-scroll corridor
- **THEN** it is rendered or activated early enough to pass the first-traversal budget
- **AND** an activated group remains rendered until route exit
- **AND** the shopper sees no blank corridor, late card pop, scrollbar jump, overlapping content, broken image loading, horizontal overflow, or input stall
- **AND** keyboard order, find-in-page, accessibility-tree access, and shell scroll reset remain correct.

#### Scenario: Grouped or retained activation misses the route budget

- **WHEN** measured grouped containment or retained ahead-of-viewport activation still misses first or repeat traversal
- **THEN** `content-visibility` is disabled for the failing Store route and breakpoint when the declared load and interaction budgets remain passing
- **AND** first-scroll quality is not sacrificed solely to preserve an initial-layout optimization.

#### Scenario: Native and eager strategies both miss

- **WHEN** neither measured containment nor eager rendering can satisfy both load and traversal budgets
- **THEN** implementation stops and records the residual trace
- **AND** pagination, virtualization, infinite scrolling, or node recycling requires an amended OpenSpec design with accessibility and shell-navigation acceptance before implementation.

#### Scenario: Approved Store rendering rungs are exhausted

- **GIVEN** grouped containment, retained activation, and eager rendering have been measured against the same Store All or Store Distro route
- **WHEN** no rung passes both load and application-attributable traversal gates
- **THEN** the existing Store renderer remains authoritative and the residual is recorded as non-passing
- **AND** the report names the rejected evidence, the unchanged commerce/request boundary, and this post-consolidation Store route remeasurement before any future bounded remedy
- **AND** the residual does not authorize pagination, virtualization, infinite scrolling, node recycling, batch Store Offer reads, static price authority, or a passing performance claim.

#### Scenario: September 2026 catalog residual is explicitly accepted

- **GIVEN** the final `contain-below-fold-distro-chunks` implementation has passing functional, load, and request checks
- **WHEN** its explicitly approved acceptance is recorded
- **THEN** the 51 ms mobile disclosure task, instrumented 51–77 ms tasks, and inconclusive attribution of occasional wide traversal spans remain documented as change-specific exceptions
- **AND** closure does not relabel those measurements as numerical passes or relax the default budgets for subsequent changes.

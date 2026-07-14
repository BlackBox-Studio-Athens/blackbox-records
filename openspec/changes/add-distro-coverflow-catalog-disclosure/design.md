## Context

Distro currently renders 79 records in five populated format groups. Vinyl 12-inch contains 54 records across nine six-card wrappers; CDs contain 19. The current mobile layout preserves scanability but produces a long page. A measured full-length horizontal rail reduced page height yet required an 80-step two-axis traversal instead of 76 vertical steps, raised median task duration from about 26ms to 106ms, and produced one 62ms long task across five runs. That candidate was rejected.

OriginKit's Coverflow Gallery established the approved visual direction: one front-facing cover, angled side covers, and genuine 3D depth. A disposable BlackBox prototype used the first six real Vinyl cards, all 54 catalog cards, and the existing nine wrappers. At 320px and 390px it retained focus, produced no horizontal overflow, exposed only six links to assistive technology in preview, and expanded to all 54 cards exactly once. A trusted 1x trace measured INP 159ms and CLS 0; five warm expansion/collapse cycles produced no long task. A separate 4x diagnostic exposed layout work that the final production profile must keep inside the existing Distro budgets. An instant 54-card reveal performed substantially worse, so unsupported clients must receive the existing full catalog rather than a degraded Coverflow.

This change follows `organize-distro-format-discovery`, `add-static-distro-search`, and `add-distro-format-jump-navigation`. Those changes own grouping, search, and cross-format navigation. This change owns only bounded within-group preview and disclosure.

## Goals / Non-Goals

**Goals:**

- Give mobile visitors an intentional, BlackBox-specific 3D preview before they choose a long group.
- Preserve canonical item order, the existing vertical catalog, search, format navigation, keyboard access, and no-JavaScript access.
- Represent each eligible group with one exclusive browse state and keep search from coexisting with a collapsed preview.
- Keep motion native, event-driven, reduced-motion-safe, and within existing Distro performance budgets.

**Non-Goals:**

- A 54-item horizontal rail, featured-item model, autoplay, looping, swipe/drag physics, pagination, virtualization, or category route.
- Copying OriginKit code or styling, adding a carousel/motion dependency, or creating a reusable carousel framework.
- Duplicating cards, changing catalog order, adding content fields, or changing commerce behavior.
- Altering desktop Distro presentation or groups containing six or fewer records.

## Decisions

1. **Enhance only large mobile groups.**

   A group is eligible only below `40rem` and only when its authoritative chunk list contains more than one chunk. Preview uses the first existing six-card chunk in canonical order. Groups with six or fewer records and all desktop layouts remain the current catalog. The UI says `Showing 6 of {count}`; it never calls those records featured.

2. **Use one DOM and one exclusive state per group.**

   The Distro-specific client controller will keep a small discriminated state:

   - `preview`, carrying the bounded active index;
   - `catalog`;
   - `search-results`.

   `View all {count}` moves `preview` to `catalog`; `Show Coverflow` may return `catalog` to `preview` at the first record while no query is active. Resetting avoids carrying hidden active-index state outside `preview`. A non-empty normalized search query moves every eligible group to `search-results`; clearing it moves those groups to `catalog`, never to a collapsed preview that could hide restored results. Route cleanup discards client state, so a later Distro entry starts from server output and may enhance again. No parallel `isExpanded`, `isSearching`, or `isCoverflow` booleans are introduced.

3. **Make the 3D treatment BlackBox-owned.**

   The first six existing cards form a bounded perspective scene. The active cover faces forward; the immediate neighbors use mirrored `rotateY`, depth translation, scale, and opacity; the outer neighbors recede further. Existing square artwork, hard borders, Bebas/Geist typography, monochrome colors, and card links remain authoritative. One compact status below the stage exposes active position, title, and artist.

   Previous/Next buttons are bounded rather than looping and become disabled at the ends. Focusing a visible card selects it; activating any card follows its existing Store link without intercepted first-click behavior. No autoplay, timer, animation frame loop, pointer tracking, custom drag, or scroll listener is added.

4. **Morph only the meaningful surface.**

   Native CSS handles Coverflow movement. The catalog toggle uses `document.startViewTransition()`. During that disclosure only the toggled group's active cover image receives a unique transition name; root snapshot animation is disabled and the name is removed after `transition.finished`. The remaining wrappers switch as a group without a card-by-card stagger. Coverflow transitions stay at or below 300ms and use the approved 3D transforms and opacity.

   `prefers-reduced-motion: reduce` removes Coverflow and view-transition animation while retaining the same controls and final states. The native View Transition may still stage the DOM update with animation disabled. No programmatic scrolling occurs during either transition, so the toggle keeps focus and the browser keeps the user's position.

5. **Keep the complete catalog as the baseline.**

   Astro continues to server-render every card and wrapper in normal catalog mode. The controller enables preview only after a successful mount, a matching mobile viewport, and native same-document View Transition support. Without JavaScript, with a failed mount, or without the required API, the current full catalog remains visible and the Coverflow controls remain absent or inert. Widening the viewport promotes an enhanced group to `catalog`; narrowing again does not unexpectedly collapse it before route re-entry.

6. **Extend the Distro controller, not the architecture.**

   Implement after the search predecessor and extend its Distro-specific lifecycle rather than creating a second React island, generic carousel, event bus, or registry. Server markup supplies the smallest required data hooks, counts, controls, and status targets. Coverflow writes only a parent browse-mode attribute; search remains the sole writer of card and wrapper `hidden` state. The controller does not recreate or reorder nodes.

7. **Treat measured performance as a release gate.**

   Retain every six-card wrapper and assign motion only to the first six cards and active cover image. At normal speed, the final fixed mobile-stress profile must preserve LCP at or below 2.5 seconds, CLS at or below 0.1, INP at or below 200ms for Coverflow controls and disclosure, and no task of 50ms or longer introduced by this enhancement. Test five fresh preview-to-catalog runs at both 320px and 390px. Run one 4x CPU trace as diagnostic evidence, not as an acceptance threshold. If the normal-speed production path misses a gate, diagnose and simplify the transition; the full server-rendered catalog remains the rollback.

## Risks / Trade-offs

- [The first six look editorially selected] → Label them as a count-based preview and preserve canonical order; add no featured language or data.
- [Revealing 54 cards activates expensive layout] → Keep chunk wrappers, use the native staged transition, avoid programmatic scroll, and fail the change if the production profile exceeds current budgets.
- [3D depth obscures content or focus] → Keep one clear front cover, expose title/artist separately, preserve visible focus, and verify 320px/390px clipping.
- [Search and Coverflow hide different nodes] → Give the Distro controller one exclusive group state; active search always wins and clear returns to full catalog.
- [Unsupported clients receive a broken instant reveal] → Do not enable Coverflow there; retain the server-rendered catalog baseline.
- [Motion becomes ornamental overhead] → Animate at most six covers and one shared image, with no autoplay, scroll-linked work, or dependency.

## Migration Plan

1. Implement and archive the grouping, Distro search, and format-navigation predecessors.
2. Add eligible-group hooks and controls while leaving the server-rendered catalog as the default.
3. Extend the Distro controller with the exclusive group state, bounded controls, search transitions, and shell cleanup.
4. Add BlackBox 3D styles and the active-image View Transition, then complete focused, browser, and performance checks.
5. Roll back by removing the enhancement hooks/controller/styles; no content or data migration exists.

## Open Questions

None.

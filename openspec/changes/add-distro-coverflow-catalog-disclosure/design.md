## Context

Distro currently renders 79 records. After `organize-distro-format-discovery`, its four populated browse groups will contain 53 Vinyl 12-inch, three combined small-vinyl, 19 CD, and four Tape records across 15 six-card wrappers. The current mobile layout preserves scanability but produces a long page. A measured full-length horizontal rail reduced page height yet required an 80-step two-axis traversal instead of 76 vertical steps, raised median task duration from about 26ms to 106ms, and produced one 62ms long task across five runs. That candidate was rejected.

OriginKit's Coverflow Gallery established the approved visual direction: one front-facing cover, angled side covers, and genuine 3D depth. Its small generic stage, rounded portrait treatment, single unnamed keyboard group, and lack of visible Previous/Next controls are not copied. A disposable BlackBox prototype used the first six real Vinyl cards, the then-current 54-card group, and its existing wrappers. At 320px and 390px it retained focus, produced no horizontal overflow, exposed only six links to assistive technology in preview, and expanded every card exactly once. At 320px the front and immediate side-cover hit centers resolved correctly; outer covers fell outside reliable pointer space and therefore remain depth cues rather than promised tap targets. A trusted 1x trace measured INP 159ms and CLS 0; five warm expansion/collapse cycles produced no long task. A separate 4x diagnostic exposed layout work that the final production profile must keep inside the existing Distro budgets. Initial full-catalog-to-preview mount cost was not measured and remains a release risk.

This change follows `organize-distro-format-discovery`, `add-static-distro-search`, and `add-distro-format-jump-navigation`. Those changes own grouping, search, and cross-format navigation. This change owns only bounded within-group preview and disclosure.

## Goals / Non-Goals

**Goals:**

- Give mobile visitors an intentional, BlackBox-specific 3D preview before they choose a long group.
- Preserve canonical item order, the existing vertical catalog, search, format navigation, keyboard access, and no-JavaScript access.
- Represent each eligible group with one exclusive browse state and keep search from coexisting with a collapsed preview.
- Keep preview presentation artwork-only while preserving concise record-link names and one shared active-record status.
- Keep motion native, event-driven, reduced-motion-safe, and within existing Distro performance budgets.

**Non-Goals:**

- A full-length horizontal rail, featured-item model, autoplay, looping, swipe/drag physics, pagination, virtualization, or category route.
- Copying OriginKit code or styling, adding reflections, gloss, rounded cards, pagination dots, a carousel/motion dependency, or a reusable carousel framework.
- Duplicating cards, changing catalog order, adding content fields, or changing commerce behavior.
- Altering desktop Distro presentation or groups containing six or fewer records.

## Decisions

1. **Enhance only large mobile groups.**

   A group is eligible only below `40rem` and only when its authoritative chunk list contains more than one chunk. Preview uses the first existing six-card chunk in canonical order. After the grouping predecessor, this makes only the 53-item Vinyl 12-inch and 19-item CD groups eligible; all counts remain source-derived rather than encoded in client logic. Groups with six or fewer records and all desktop layouts remain the current catalog. The UI says `Showing 6 of {count}` and the active status says `1 of 6 preview`, never `1 of {catalog count}` or featured language.

2. **Use one DOM and one exclusive state per group.**

   The Distro-specific client controller will keep a small discriminated state:
   - `preview`, carrying the bounded active index;
   - `catalog`;
   - `search-results`.

   `View all {count}` moves `preview` to `catalog`; `Show Coverflow` may return `catalog` to `preview` at the first record while no query is active. Resetting avoids carrying hidden active-index state outside `preview`. A non-empty normalized search query moves every eligible group to `search-results`; clearing it moves those groups to `catalog`, never to a collapsed preview that could hide restored results. Route cleanup discards client state, so a later Distro entry starts from server output and may enhance again. No parallel `isExpanded`, `isSearching`, or `isCoverflow` booleans are introduced.

3. **Make the 3D treatment BlackBox-owned.**

   The first six existing cards form a bounded perspective scene. An outer shell owns perspective and clipping; an inner stage owns `transform-style: preserve-3d` and avoids overflow, opacity, filters, or clipping that would flatten its children. The active cover faces forward at an initial size near `clamp(14rem, 58vw, 17rem)`; immediate neighbors use mirrored `rotateY`, depth translation, scale, and per-cover opacity; outer neighbors recede as visual depth cues. Existing square artwork, hard borders, Bebas/Geist typography, monochrome colors, and card links remain authoritative. Reflections, gloss, rounded corners, shadows, gradients, and carousel decoration remain absent.

   Preview visually suppresses each card's copy while each link keeps one static, server-authored `{title} — {artist_or_label}` accessible name across all modes. One compact `<p role="status">` below the stage exposes `position of 6 preview`, title, and artist or label without leaving a large fixed-height gap. Preview mode applies `display: none` to every wrapper after the first, not opacity, offscreen positioning, or `aria-hidden`, so later records leave rendering, focus order, and the accessibility tree without empty wrapper gaps.

   Previous/Next buttons are bounded rather than looping. At the ends they remain focusable with `aria-disabled="true"`, and activation is a no-op. Focusing any of the six links promotes it before its focus ring is presented; activating it follows its existing Store link without intercepted first-click behavior. Pointer activation is expected only for the front and visibly exposed side covers. No custom arrow-key model, autoplay, timer, animation frame loop, pointer tracking, custom drag, or scroll listener is added.

4. **Morph only the meaningful surface.**

   Native CSS handles Coverflow movement. The catalog toggle uses `document.startViewTransition()`. During that disclosure only the toggled group's active cover image receives a unique transition name; root snapshot animation is disabled and the remaining wrappers switch as a group without a card-by-card stagger. While a disclosure is active, its toggle stays focusable with `aria-disabled="true"` and repeated activation is ignored. Temporary names and in-flight state clear in `try/finally`; search, viewport promotion, and route cleanup win over pending presentation work. Coverflow transitions stay at or below 300ms and use the approved 3D transforms and opacity.

   `prefers-reduced-motion: reduce` removes Coverflow, the existing card-image hover/focus zoom, and view-transition animation while retaining the same controls and final states. The native View Transition may still stage the DOM update with animation disabled. The disclosure control is placed before the wrappers it reveals, so expansion adds content below the focused control. No programmatic scrolling occurs, and the toggle must remain visible even when the mobile mini-player is open.

5. **Keep the complete catalog as the baseline.**

   Astro continues to server-render every card and wrapper in normal catalog mode. The controller enables preview only after a successful mount, a matching mobile viewport, and native same-document View Transition support. No pre-hydration hiding script or second baseline is added. Without JavaScript, with a failed mount, or without the required API, the current full catalog remains visible and the Coverflow controls remain absent or inert. Widening the viewport promotes an enhanced group to `catalog` only when no query is active; active search remains `search-results`. Narrowing again does not unexpectedly collapse either state before route re-entry.

   Fresh direct-load and app-shell-entry measurements at 320px and 390px must cover the required initial catalog-to-preview mount, not only later disclosure. If automatic collapse exceeds the CLS or interaction budget, the change is not complete: simplify it or revise this specification with separate approval before changing the initial mode. Do not add pre-hydration hiding or silently ship a catalog-first branch.

6. **Extend the Distro controller, not the architecture.**

   Implement after the search predecessor and extend its single Distro portal/controller lifecycle rather than creating a second React island, generic carousel, event bus, or registry. Server markup supplies the smallest required data hooks, counts, controls, and status targets. Search remains the sole writer of card, wrapper, and group `hidden` state; Coverflow may write only its own group-mode, six bounded card-position, control-state, status, and temporary transition attributes. Six CSS position rules cover the bounded scene instead of a parent-index/`:nth-child` matrix. The controller does not recreate or reorder nodes.

   App-shell route caching snapshots live `<main>` before React cleanup. The existing clone sanitizer must therefore remove Coverflow mode, active positions, control contents, and temporary transition names before cache storage; controller cleanup remains the second line of defense.

7. **Treat measured performance as a release gate.**

   Retain every six-card wrapper and assign motion only to the first six cards and active cover image. At normal speed, fresh direct loads, app-shell entries, and five preview-to-catalog runs at both 320px and 390px must preserve LCP at or below 2.5 seconds, CLS at or below 0.1, INP at or below 200ms for Coverflow controls and disclosure, and no task of 50ms or longer introduced by this enhancement. Run one 4x CPU trace as diagnostic evidence, not as an acceptance threshold. If the normal-speed production path misses a gate, diagnose and simplify the transition; the full server-rendered catalog remains the rollback.

## Risks / Trade-offs

- [The first six look editorially selected] → Label them as a count-based preview and preserve canonical order; add no featured language or data.
- [Revealing a long group activates expensive layout] → Keep chunk wrappers, use the native staged transition, avoid programmatic scroll, and fail the change if the production profile exceeds current budgets.
- [Initial enhancement causes a large layout shift] → Measure direct and shell entry; simplify the enhancement or respecify it before changing the required initial preview.
- [3D depth obscures content or focus] → Keep one clear front cover, expose title and artist or label separately, preserve visible focus, and verify 320px/390px clipping, 200% text, 400% zoom, and the open mini-player.
- [Grouping properties flatten the 3D scene] → Separate the clipping/perspective shell from the `preserve-3d` stage and apply opacity per cover.
- [Search and Coverflow hide different nodes] → Give the Distro controller one exclusive group state; active search always wins and clear returns to full catalog.
- [Unsupported clients receive a broken instant reveal] → Do not enable Coverflow there; retain the server-rendered catalog baseline.
- [Motion becomes ornamental overhead] → Animate at most six covers and one shared image, with no autoplay, scroll-linked work, or dependency.

## Migration Plan

1. Implement and archive the grouping, Distro search, and format-navigation predecessors.
2. Add eligible-group hooks and controls while leaving the server-rendered catalog as the default.
3. Extend the Distro controller with the exclusive group state, bounded controls, search transitions, snapshot sanitization, and route cleanup.
4. Add BlackBox 3D styles and the active-image View Transition, then complete focused, browser, and performance checks.
5. Roll back by removing the enhancement hooks/controller/styles; no content or data migration exists.

## Open Questions

None.

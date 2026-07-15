## Context

Distro currently renders 79 records. After `organize-distro-format-discovery`, its four populated browse groups will contain 53 Vinyl 12-inch, three combined small-vinyl, 19 CD, and four Tape records across 15 six-card wrappers. The current layout preserves scanability but produces a long page, especially on mobile, and the format navigation scrolls away after a deep jump. A measured full-length horizontal rail reduced page height yet required an 80-step two-axis traversal instead of 76 vertical steps, raised median task duration from about 26ms to 106ms, and produced one 62ms long task across five runs. That candidate was rejected.

OriginKit's Coverflow Gallery established the approved visual direction: one front-facing cover, angled side covers, and genuine 3D depth. Its small generic stage, rounded portrait treatment, single unnamed keyboard group, and lack of visible Previous/Next controls are not copied. A disposable BlackBox prototype used the first six real Vinyl cards, the then-current 54-card group, and its existing wrappers. At 320px and 390px it retained focus, produced no horizontal overflow, exposed only six links to assistive technology in preview, and expanded every card exactly once. At 320px the front and immediate side-cover hit centers resolved correctly; outer covers fell outside reliable pointer space and therefore remain depth cues rather than promised tap targets. A trusted 1x trace measured INP 159ms and CLS 0; five warm expansion/collapse cycles produced no long task. A separate 4x diagnostic exposed layout work that the final production profile must keep inside the existing Distro budgets. Initial full-catalog-to-preview mount cost was not measured and remains a release risk.

This change follows `organize-distro-format-discovery`, `add-static-distro-search`, and `add-distro-format-jump-navigation`. Those changes own grouping, search, and cross-format navigation. This change owns only bounded within-group preview and disclosure.

## Goals / Non-Goals

**Goals:**

- Give mobile and desktop visitors an intentional, BlackBox-specific 3D preview before they choose a long group.
- Preserve canonical item order, the existing vertical catalog, search, format navigation, keyboard access, and no-JavaScript access.
- Keep format choices and a return-to-top action reachable while visitors browse deep groups.
- Represent each eligible group with one exclusive browse state and keep search from coexisting with a collapsed preview.
- Keep preview presentation artwork-only while preserving concise record-link names and one shared active-record status.
- Keep motion native, event-driven, reduced-motion-safe, and within existing Distro performance budgets.

**Non-Goals:**

- A full-length horizontal rail, featured-item model, autoplay, looping, swipe/drag physics, pagination, virtualization, or category route.
- Copying OriginKit code or styling, adding reflections, gloss, rounded cards, pagination dots, a carousel/motion dependency, or a reusable carousel framework.
- Duplicating cards, changing catalog order, adding content fields, or changing commerce behavior.
- Altering groups containing six or fewer records.

## Decisions

1. **Enhance large groups at every viewport.**

   A group is eligible when its authoritative chunk list contains more than one chunk. Preview uses the first existing six-card chunk in canonical order. That order already comes from the editorial `order` field, so the six are deterministic label curation rather than random inventory; no new featured flag or content model is needed. After the grouping predecessor, this makes only the 53-item Vinyl 12-inch and 19-item CD groups eligible; all counts remain source-derived rather than encoded in client logic. Groups with six or fewer records remain the current catalog. The UI says `Selected 6 of {count}` and the active status says `01 / 06 · {record}`, never using the full catalog count as the active-position total.

2. **Use one DOM and one exclusive state per group.**

   The Distro-specific client controller will keep a small discriminated state:
   - `preview`, carrying the bounded active index;
   - `catalog`, optionally carrying the selected preview index;
   - `search-results`.

   `View all {count}` moves `preview` to `catalog` while retaining the selected index for one visible catalog highlight; `Show Coverflow` returns to that record while no query is active. A non-empty normalized search query moves every eligible group to `search-results`; clearing it moves those groups to `catalog` without a selected index, never to a collapsed preview that could hide restored results. Route cleanup returns to the server-authored first-record preview. No parallel `isExpanded`, `isSearching`, or `isCoverflow` booleans are introduced.

3. **Make the 3D treatment BlackBox-owned.**

   The first six existing cards form a bounded perspective scene. An outer shell owns perspective and clipping; an inner stage owns `transform-style: preserve-3d` and avoids overflow, opacity, filters, or clipping that would flatten its children. Mobile uses an active cover near `clamp(14rem, 60vw, 17rem)` with compact side-cover spacing. Desktop uses a wider stage, restrained cover size, and larger lateral/depth offsets rather than stretching the mobile composition. Shared CSS variables feed the same six position rules at both widths. Existing square artwork, hard borders, Bebas/Geist typography, monochrome colors, and card links remain authoritative. Reflections, gloss, rounded corners, shadows, gradients, and carousel decoration remain absent.

   Preview visually suppresses each card's copy while each link keeps one static, server-authored `{title} — {artist_or_label}` accessible name across all modes. One prominent, high-contrast `<p role="status">` between the controls and stage exposes position, title, and artist or label without leaving a large fixed-height gap. Preview mode applies `display: none` to every wrapper after the first, not opacity, offscreen positioning, or `aria-hidden`, so later records leave rendering, focus order, and the accessibility tree without empty wrapper gaps.

   Previous/Next buttons are bounded rather than looping. At the ends they remain focusable with `aria-disabled="true"`, and activation is a no-op. Focusing any of the six links promotes it before its focus ring is presented. For pointer input, a side cover's first deliberate click selects it and only an already-active cover opens its Store link. A bounded pointer-intent guard suppresses link activation after more than 10px of movement so vertical scrolling cannot select a route accidentally. Keyboard activation retains ordinary link semantics. Pointer intent is not a drag model: it does not translate covers, capture the pointer, add velocity, or listen to scroll. No custom arrow-key model, autoplay, timer, animation frame loop, custom drag, or scroll listener is added.

4. **Reveal one meaningful surface without page snapshots.**

   Native CSS handles Coverflow movement and catalog disclosure. The toggle changes the existing DOM in place while one black, hard-edged surface uncovers the catalog from top to bottom without a card-by-card stagger. The controller reads the resulting CSS animations through the Web Animations API only to serialize disclosure and cleanup; it does not create keyframes, timers, or an animation loop. Native document View Transitions are deliberately not used: Firefox's page-snapshot compositor produced the reported gray frame and failed under the same disclosure in a headless SWGL diagnostic, while this component-local CSS surface has no document snapshot or gray default canvas. While disclosure is active, its toggle stays focusable with `aria-disabled="true"` and repeated activation is ignored. In-flight state clears in `try/finally`; search and route cleanup cancel active CSS animations and win over pending presentation work. Disclosure motion stays at or below 480ms; cover navigation remains at or below 300ms.

   `prefers-reduced-motion: reduce` removes Coverflow, the existing card-image hover/focus zoom, and the catalog reveal while retaining the same controls and final states. On disclosure, the selected card receives focus without implicit scrolling and then uses an instant nearest-block scroll so it becomes immediately recognizable below the sticky navigation; this makes a second-row selection as legible as a first-row selection. The selected card uses a low-contrast border and tonal surface in catalog mode without adding an outer outline. The sticky format navigation and `Top` action provide the stable route back to page-level menus.

5. **Render the supported initial state before paint and keep the complete catalog as fallback.**

   Astro continues to server-render every card and wrapper once, but eligible groups now carry the deterministic first-record preview mode, six positions, controls, and active label in their HTML. A tiny synchronous capability marker in the document head enables that presentation only when `transform-style: preserve-3d` is supported. Without JavaScript the marker is never written; without the required CSS support it is not written; both paths therefore show the complete catalog and hide Coverflow controls. The controller marks a successful group mount; direct-load and app-shell-entry watchdogs remove the capability marker if mounting stalls, while the Distro portal error boundary removes it immediately on a rejected mount. Viewport changes retain the current exclusive browse mode while responsive CSS adapts the scene; no resize listener or viewport-specific client state is required.

   Fresh direct-load and app-shell-entry measurements at 320px, 390px, and desktop width must verify that the supported path paints as Coverflow without a preceding full-catalog frame. This is server presentation of the same complete DOM, not duplicate markup or asynchronous pre-hydration hiding. App-shell snapshot sanitization restores this initial server state so cached re-entry does not recreate the flash.

6. **Extend the Distro controller, not the architecture.**

   Implement after the search predecessor and extend its single Distro portal/controller lifecycle rather than creating a second React island, generic carousel, event bus, or registry. Server markup supplies the smallest required data hooks, counts, controls, and status targets. Search remains the sole writer of card, wrapper, and group `hidden` state; Coverflow may write only its own group-mode, six bounded card-position, control-state, status, and temporary transition attributes. Six CSS position rules cover the bounded scene instead of a parent-index/`:nth-child` matrix. The controller does not recreate or reorder nodes.

   App-shell route caching snapshots live `<main>` before React cleanup. The clone sanitizer must therefore restore the server-authored first-record preview mode, initial positions, control contents, active label, and remove selected/transition state before cache storage; controller cleanup remains the second line of defense.

7. **Treat measured performance as a release gate.**

   Retain every six-card wrapper and assign motion only to the first six cards and one group reveal layer. Query animation state only from that layer or the six preview cards, never the complete catalog subtree. At normal speed, fresh direct loads, app-shell entries, and five preview-to-catalog runs at 320px, 390px, and desktop width must preserve LCP at or below 2.5 seconds, CLS at or below 0.1, INP at or below 200ms for Coverflow controls and disclosure, and no task of 50ms or longer introduced by this enhancement. Run one 4x CPU trace as diagnostic evidence, not as an acceptance threshold. If the normal-speed production path misses a gate, diagnose and simplify the transition; the full server-rendered catalog remains the rollback.

8. **Keep cross-format navigation in context.**

   The existing server-derived format navigation becomes a compact sticky bar directly below the fixed site header. Its format links remain native fragments enhanced by the existing app-shell target scroll behavior. A separate `Top` link targets the Distro intro, remains available beside the horizontally scrollable format links, and requires no observer, scroll listener, active-section model, or duplicate navigation. Group headings receive enough scroll margin to remain visible below both fixed layers. Active search continues to hide the whole navigation through the search predecessor's existing ownership.

## Risks / Trade-offs

- [The first six appear arbitrary] → Treat the existing authored `order` as the curation source, label the set `Selected 6 of {count}`, keep it deterministic, and add no randomization or second featured model.
- [Revealing a long group activates expensive layout] → Keep chunk wrappers, limit animation inspection to the reveal layer, scroll only the selected record instantly to its nearest visible block, and fail the change if the production profile exceeds current budgets.
- [Initial enhancement flashes the full catalog] → Emit the initial preview state in server markup and gate only its CSS presentation with the synchronous capability marker.
- [3D depth obscures content or focus] → Keep one clear front cover, expose title and artist or label separately, preserve visible focus, and verify 320px/390px/desktop clipping, 200% text, 400% zoom, and the open mini-player.
- [Grouping properties flatten the 3D scene] → Separate the clipping/perspective shell from the `preserve-3d` stage and apply opacity per cover.
- [Search and Coverflow hide different nodes] → Give the Distro controller one exclusive group state; active search always wins and clear returns to full catalog.
- [Unsupported clients receive a broken instant reveal] → Do not enable Coverflow there; retain the server-rendered catalog baseline.
- [Motion becomes ornamental overhead] → Animate at most six covers and one group reveal surface, with no autoplay, scroll-linked work, or dependency.
- [Sticky navigation hides a destination heading] → Keep the bar compact and give group headings a scroll margin covering the site header and format bar.

## Migration Plan

1. Implement and archive the grouping, Distro search, and format-navigation predecessors.
2. Add eligible-group hooks and controls while leaving the server-rendered catalog as the default.
3. Extend the Distro controller with the exclusive group state, bounded controls, search transitions, snapshot sanitization, and route cleanup.
4. Add BlackBox 3D styles and the component-local catalog reveal, then complete focused, browser, and performance checks.
5. Roll back by removing the enhancement hooks/controller/styles; no content or data migration exists.

## Open Questions

None.

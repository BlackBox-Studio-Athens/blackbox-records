## Context

See `proposal.md` for motivation. `StoreDistroCatalog.astro` renders every group once, derives both responsive format-navigation presentations from that group list, and gives large groups independent Coverflow markup. Current grouping combines 7-inch and 10-inch vinyl even though the catalog classifies them separately. `StoreDistroSearch` already owns route-scoped DOM discovery, search visibility, mobile disclosure cleanup, and Coverflow-controller lifecycle. Shell target scrolling may run before the route controller presents a newly selected group, so the route controller must perform the final select-then-scroll operation. Shell snapshots already sanitize transient Distro and Coverflow state.

## Goals / Non-Goals

**Goals:**

- Present `Vinyl 10-inch` and `Vinyl 7-inch` as separate derived groups.
- Make one selected format the only presented group on the enhanced route.
- Keep format-selection presentation separate from search-owned `hidden` state.
- Reuse the existing Coverflow for explicitly selected groups with more than one item, including the current small 7-inch group.
- Preserve server rendering, no-JavaScript fragments, canonical card nodes, and shell cleanup.

**Non-Goals:**

- New format routes, query parameters, persisted selection, hash listeners, ongoing URL rewriting, or active-section observers.
- Lowering the greater-than-six Coverflow threshold while `All formats` is current or adding meaningless Coverflow controls to a single-item group.
- Changing catalog membership, content classification, Store requests, or commerce behavior.

## Decisions

### Split vinyl sizes in the existing derived grouping

Replace the combined 7-inch/10-inch presentation group with separate server-derived `Vinyl 10-inch` and `Vinyl 7-inch` groups in the existing exact physical-type order. Navigation entries, counts, headings, fragments, and intro copy continue to come from the same populated group list; no authored category data or catalog identity changes.

### Extend the existing Distro route controller

Add format-selection state and DOM helpers to the existing route-scoped `StoreDistroSearch` module instead of mounting a second React island or controller. The format navigation and catalog groups receive matching server-derived data keys. Enhanced link activation updates one selected key, current-state attributes, the mobile summary, and one route-root selection marker.

Alternative considered: a separate format-filter component. Rejected because it would duplicate DOM discovery, cleanup, and interaction coordination already owned by `StoreDistroSearch`.

### Keep links progressive

Keep format entries as ordinary fragment links. The enhanced path applies the selection first, closes the mobile disclosure, then performs the final heading scroll/focus from the route controller. Initial direct or shell-managed fragments follow the same order after controller connection, so an earlier browser or shell scroll attempt is harmless. `All formats` targets the catalog start when JavaScript is absent.

Alternative considered: buttons or new filtered routes. Rejected because links already provide the complete no-JavaScript fallback and the catalog is static.

### Read a valid initial fragment once

After transient DOM state is sanitized, controller connection reads the current fragment once. If it matches a server-rendered Distro group heading, that group becomes the initial selection and the controller performs the final scroll/focus after presentation updates; otherwise `All formats` remains current. This makes direct links and Store All format links focused without adding a hash listener, query state, or later URL rewriting.

### Use CSS for selection presentation

Selection writes a route-root selected-format marker and current-state attributes. CSS removes non-selected sections from presentation while retaining their canonical DOM nodes. Selection never writes card, wrapper, or group `hidden`; existing Distro search remains the sole owner of those attributes. `All formats` removes the selection marker. No cards are cloned, moved, or filtered into a second list.

### Reuse Coverflow for focused small groups

While `All formats` is current, retain the existing greater-than-six eligibility threshold. Server-render the existing Coverflow shell and enrollment data for every group with two or more items, but keep small groups in their normal grid with controls out of presentation until selected. Separate Coverflow enrollment from initial preview presentation so dormant small-group cards retain normal grid image sizing. Relax the existing DOM reader's count guard to accept two or more cards, and reuse `getStoreCoverflowPosition` to assign each card once instead of applying the fixed six-offset map to groups with fewer than six cards. Initialize each controller from its server-authored mode. When selection changes, the route controller uses that same group's existing preview/catalog transition; returning to `All formats` or starting search returns small groups to grid mode. A single-item group receives no Coverflow shell. No second controller, card set, layout engine, or mode system is added.

### Search always starts from the complete catalog

When a non-empty search begins, reset selection to `All formats`, close the disclosure, and run the existing matcher unchanged. Clearing search restores all groups. This avoids intersecting two filters, maintaining per-format result counts, or changing current search requirements.

### Sanitize transient state at the shell boundary

Extend existing snapshot sanitation to clear selected-format/current markers, return small groups to their server-authored grid mode, reset the mobile summary, and close the disclosure. Search sanitation continues to own `hidden` restoration. When the route controller reconnects, it derives the initial selection from a valid current fragment or falls back to `All formats`; no stale client state is retained.

## Risks / Trade-offs

- [Selection and search visibility drift] → Keep one selection marker, leave `hidden` to search, and cover select, search, clear, cleanup, and restore with one focused test suite.
- [Small focused Coverflow regresses shared behavior] → Reuse the existing controller and verify two-item, single-item, select-away, and select-back cases.
- [Mobile summary or focus becomes unclear] → Expose the current selection, close the disclosure after activation, and verify keyboard/focus behavior at 390 pixels.
- [Initial fragments or group switches scroll too early] → Apply selection before the route controller's final scroll/focus and test direct, Store All, and in-route switches.
- [Active performance work regresses] → Keep the complete DOM and existing controller, then run the established bounded Store/Distro request and interaction smoke.

## Migration Plan

1. Add focused failing tests for exact 7-inch/10-inch grouping, selection, valid initial fragments, ordered scrolling, selected small-group Coverflow, `All formats`, search reset, and snapshot cleanup.
2. Split the derived vinyl-size group, add shared server-derived format keys, and extend the existing route controller and styles.
3. Run focused Store/Distro tests, then `pnpm test:unit`, `pnpm check`, and `pnpm build`.
4. Use Browser Use on direct, Store All-linked, and shell-managed `/store/distro/` at desktop and 390 pixels.
5. Roll back the controller/markup/style commit if selection, search, shell restoration, or performance acceptance fails.

## Context

`organize-distro-format-discovery` will make one ordered, populated group list authoritative for Distro presentation. `add-static-distro-search` will add a Distro-specific control that hides unmatched cards, chunks, and groups in place. This change follows both predecessors.

The current route already derives group chunks server-side and gives every heading a deterministic ID. The app shell already supports `data-scroll-to-target`, while `href="#..."` remains the no-JavaScript fallback. Local `buttonVariants` provides the only shadcn styling needed.

## Goals / Non-Goals

**Goals:**

- Let visitors reach any populated Distro format without scanning the full catalog.
- Derive links, counts, order, and targets from the rendered group list.
- Preserve native links, keyboard access, no-JavaScript behavior, search cleanup, and existing page budgets.
- Reuse existing group, target-scroll, search, and button seams.

**Non-Goals:**

- Featured products, rails, category routes, tabs, filters, pagination, virtualization, or sticky navigation.
- New content fields, taxonomy, component registry entries, dependencies, or app-shell behavior.
- Dynamic result counts or per-format navigation while search is active.

## Decisions

1. **Add target metadata to the existing grouped route model.**

   The route's current `groupedDistroChunks` mapping will derive each heading ID once beside its entries and chunks. Navigation and sections will render from that same array. Counts use `group.entries.length`; empty groups remain impossible because the predecessor omits them before this mapping. No helper, schema, or second category model is added.

2. **Render one native, wrapping navigation block.**

   Place a visible `Browse formats` navigation after the Distro search placeholder and before `.distro-page-groups`. Each link shows the derived browse-group name and current item count, uses `href="#<heading-id>"`, and points to the same ID used by the section's `aria-labelledby` heading. Reuse local `buttonVariants({ variant: 'outline', size: 'sm' })` with existing utility overrides; do not add Carousel, ScrollArea, Tabs, NavigationMenu, or custom controls.

3. **Reuse shell target scrolling without making it required.**

   Add `data-scroll-to-target="<heading-id>"` to each anchor so the existing app shell scrolls the target in the current document. The ordinary fragment `href` remains authoritative when the shell handler or JavaScript is unavailable. No shell code changes.

4. **Hide one static index during active search.**

   Mark the navigation with one Distro-specific data hook. The Distro search control created by the predecessor will set the navigation's `hidden` state whenever its normalized query is non-empty and restore it on clear or cleanup. This avoids a second filtered navigation model, stale counts, and links to groups hidden by search.

5. **Extend predecessor tests at the narrow seams.**

   Route coverage will assert one ordered link per populated group, matching link/heading targets, and source-derived counts. Distro search DOM coverage will assert whole-navigation hide, clear, and cleanup behavior. Browser Use will cover desktop/mobile wrapping, keyboard activation, app-shell scrolling, search transitions, and no-JavaScript fragment fallback.

## Risks / Trade-offs

- [Navigation and headings drift] → Derive both from one route array and one heading ID property.
- [Search leaves links to hidden groups] → Hide the whole navigation for every non-empty normalized query.
- [Catalog growth crowds narrow screens] → Allow wrapping; add horizontal scrolling only after measured failure.
- [Shell interception breaks native fallback] → Keep a real fragment `href` beside the existing optional scroll hook.

## Migration Plan

1. Complete `organize-distro-format-discovery` and `add-static-distro-search` first.
2. Add shared route metadata, navigation markup, and the single search visibility hook.
3. Run focused, repository, and Browser Use checks. Roll back by removing the navigation block and hook; no data migration exists.

## Open Questions

None.

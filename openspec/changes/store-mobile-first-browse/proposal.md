# Proposal

## Why

At 390×844 the measured Store puts its first card at y=674, after 594px of chrome below the header. The approved browse pattern brings records forward through one toolbar and one phone Filter sheet, with clearer artist, format and purchase hierarchy.

## What Changes

- Remove the visible Store/category introduction on every viewport, retain a visually hidden H1 and remove the desktop side pane.
- Keep category links and one toolbar row: Search plus Filter on phones; Search, Formats, Artists, eligible Pre-orders, View and count on desktop.
- Move today's Distro format links and their existing Distro counts into the phone Filter sheet and desktop Formats popover, retaining their destinations, enhanced Distro behavior and reachable no-JavaScript fallback.
- Keep today's catalogue order, local search, multi-artist filtering, Pre-orders, Crate mechanics and counts.
- Rebuild card hierarchy and move Listen to the artwork corner, 44×44 with an accessible name on phones and labelled on desktop. The format line is plain ink Inter; Buy retains its existing format icon.
- Keep the purchase note above the grid as one compact line.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `section-page-identity`: visually hidden Store H1 on all viewports.
- `catalog-discovery`: one responsive toolbar and shared Filter surface.
- `distro-format-jump-navigation`: placement of existing Distro links and Artists controls, with progressive access.
- `store-catalog-categories`: toolbar, card hierarchy, grid and compact above-grid purchase note.
- `store-preorders`: existing filter placement and updated card composition.
- `app-shell-and-player`: Store Listen placement while preserving session semantics.

## Scope and Non-Goals

Themes T3–T4 cover presentation of existing Store browse controls and shared cards. Preserve category membership, exact physical types, canonical links, current counts/order, complete no-JavaScript catalogs and commerce authority. All retains BlackBox releases first by catalog number, then Distro by artist.

Sort control is out of scope and is a possible separate follow-up only. Cross-category format facets, new counts, new data/projection fields, comparator changes, remote search, pagination, content backfills and provider reads are not part of this change. Release-list layouts belong to `mobile-layout-rhythm`.

## Dependencies

Depends on `accent-and-button-system`. Preserve `add-release-catalog-numbers` and the existing All comparator, including catalog-first ordering and date-line identity. No prerequisite data contract or Codex data implementation remains.

## Impact

Future edits reach web-store presentation, web-layouts/pages, shared styles, shell integration and existing UI tests. Claude owns implementation and DESIGN.md updates. No dedicated tooling or module-boundary implementation is identified, so Codex has no separate implementation tasks. Shared verification and the final coordinated UAT release remain implementation tasks outside this authoring pass.

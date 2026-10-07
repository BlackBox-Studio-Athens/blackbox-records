# Design

## Context

`getMainNavigation()` feeds the desktop header and phone Menu from the same published content. News already has a listing route and shell support; its navigation entry is hidden. See proposal.md for the visitor problem.

## Decisions

- Change the existing News entry to `show_in_header: true` and `order: 6`. Existing sections use orders 1–5; no other entry needs reordering. Keep `show_in_footer: false`.
- Reuse the existing navigation and shell components instead of adding a hardcoded News link. This preserves editorial ownership and shared accessibility behavior.
- Update both the retained JSON fixture and the Local CMS entry. Existing Local storage retains its accepted snapshot across restarts, so changing a fixture alone does not update that website. Review and publish only the saved News navigation revision.
- Extend the existing shell-navigation browser suite for listing access, News overlays and connected-player continuity. Check the existing styles at all four approved widths.

## Risks / Trade-offs

Local publication does not update UAT or PRD. Each hosted environment needs its own separately authorized Content Publication of the navigation entry; a software release preserves its accepted content.

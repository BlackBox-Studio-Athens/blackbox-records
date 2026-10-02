# Design

## Context

See proposal.md. UAT at 390x844 had a 648px drawer with 771px of content; PRD at 390x667 also put both actions below the viewport. The item-only scroll pane had equal client and scroll heights. Automatic flex minimums let its parent expand, and delivery information remained outside that pane.

## Decisions

- Reuse one `data-lenis-scroll-root` for the heading, empty or populated content and delivery summary. Bound the flex child with `min-h-0`; contain overflow on the existing viewport-height drawer.
- Keep only shopping actions in a `shrink-0` footer. The user selected this over scrolling the whole cart. The heading may scroll so short viewports still leave room for content.
- Keep the existing modal lock, cart bridge and focus return. No global Lenis, shared Sheet, storage or commerce changes are needed.
- Use the existing content-overlay layer (1100) for the cart surface, above the minimized player's layer (92). The player-continuity regression showed the player intercepting Continue Shopping at the original Sheet layer (50); its iframe and session remain mounted behind the cart.
- Extend the existing cart Playwright spec and its mobile selection. Exercise trusted touch gestures, footer geometry and the actual repeated-BUY path.

## Release

Commit only this change's files, deploy the candidate through the normal UAT workflow, verify its identity and mobile behavior, then promote that retained candidate through the existing PRD acceptance gates. Preserve other agents' staged and unstaged work. A failed acceptance stops promotion; any rollback uses the existing release process.

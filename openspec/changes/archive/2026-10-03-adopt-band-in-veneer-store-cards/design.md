# Design

## Context

See proposal.md for motivation. The user selected Band in Veneer in the review canvas and confirmed listing cards only. All Store collection renderers share StoreItemCard; its title family is currently set in two listing CSS rules. The existing subtitle contains the release artist or Distro artist-or-label credit.

## Goals / Non-Goals

**Goals:** Reproduce the approved font pairing and connected credit without changing the title/credit size ramp or independent artist links.

**Non-Goals:** Changing shared public title tokens, item-page typography, cart/checkout presentation, content data or commerce behavior.

## Decisions

- Add one credit-name span around the existing linked/unlinked name branch and a separate plain “by ” prefix. This preserves the artist-link target and hit area rather than moving “by” inside the link or changing source data.
- Change both Store listing title font rules to the existing Inter stack, weight 600, source casing. Keep the current responsive size, tracking, underline and line height. Scope Veneer weight 900 to the new credit-name span while the parent credit remains Inter weight 400 at 0.875rem/1.4.
- Keep all search attributes and purchase/listening data intact. Update only the card and item-link accessible-name phrase. Reuse the original Veneer asset byte-for-byte and existing loaded Inter weights.
- Use the existing Store browser spec for a rendered regression check. Its deterministic font mock checks configured font stacks; native Chrome visual inspection checks the actual loaded fonts, wrapping and layout.

## Risks / Trade-offs

- Inter item titles can wrap differently from condensed Veneer. Verify long titles and credits at narrow widths and enlarged text; retain the existing content-driven wrapping instead of shrinking type or truncating names.
- Broad typography selectors could affect detail or checkout titles. Keep overrides on Store listing cards and inspect an unchanged item page as a boundary check.

## Migration Plan

No migration or new dependency is needed. Complete local validation in the authorized worktree and leave the change ready for review. Merging and hosted deployment require a later request; rollback is reverting these presentation changes.

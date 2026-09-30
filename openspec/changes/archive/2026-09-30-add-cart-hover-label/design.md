# Design

## Context

See proposal.md for the problem. The existing React cart button is portaled into the persistent Astro header. Its 44px hit area, count badge and dynamic accessible name already work. The user approved the small-tooltip treatment and English Cart copy.

## Goals / Non-Goals

**Goals:** Add a supplementary label without layout movement and arbitrate Escape with existing shell dismissal.

**Non-Goals:** A shared tooltip framework, new dependencies or changes to cart/player ownership.

## Decisions

- Keep presentation inside StoreCartButton. A relative wrapper and an absolute label with 6px top padding provide placement and a continuous hover target. Existing Tailwind variants control hover, visible focus, delay and reduced-motion duration.
- Use one local dismissal flag. A cleaned-up document capture listener consumes Escape only while the label is visible; this covers hover when keyboard focus is elsewhere and prevents the same key from dismissing shell UI. Activation hides the label before calling the existing callback. New pointer entry or focus resets dismissal.
- Use existing monochrome tokens, square edges and a compact sentence-case Cart label at 12px, regular weight and normal letter spacing. The user approved this quieter typography after the shop comparison and Carbon's typography guidance. Preserve the button's accessible name and hide the duplicate label from assistive technology.
- Native title was considered but cannot provide the selected styling and keyboard behavior. A tooltip dependency would add machinery for one fixed label.

## Risks / Trade-offs

- A gap can break hover persistence: include the gap in the positioned label's padding and verify pointer movement in Chrome.
- A global Escape listener can affect overlays: consume only an Escape for a visible label, and remove the listener on dismissal/unmount.
- A temporary preview can accidentally show main's source: serve this worktree on explicit loopback port 4322 and verify its source and tooltip markup.

## References

- Design Library STATE-01 and STATE-02, reviewed during planning; inherited pattern evidence, not runtime certification.
- https://carbondesignsystem.com/components/tooltip/usage/
- https://carbondesignsystem.com/components/tooltip/style/
- https://www.w3.org/WAI/WCAG22/Understanding/content-on-hover-or-focus.html

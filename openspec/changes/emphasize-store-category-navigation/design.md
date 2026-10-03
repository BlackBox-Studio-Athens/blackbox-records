# Design

## Context

See `proposal.md` for the motivation. The user selected Centered + larger and explicitly authorized the implementation plan on October 3, 2026.

The reference revision is `ca685294`. `StoreCategoryNavigation.astro` renders server-derived native category links, and `StoreCollectionPage.astro` places them between the route hero and purchase note. The effective collection styles use Inter at 14px, a wrapping group aligned left, and 44px-high links. The earlier base styles and baseline spec describe an equal-width rail; the collection overrides are the current source evidence.

Graphify established the category component's ownership and the collection layout's connections to the hero, shell, cards and collection routes. CodeGraph supplied the exact component and layout source from the primary checkout at the same revision. The new worktree's missing Graphify output was rebuilt locally with `graphify update .`; no semantic enrichment was used.

Review canvas: `.codex-artifacts/designs/store-filter-canvas.html`. Its source and preparation helper live beside it. The current reference is a source-based reconstruction, not a screenshot of a running Store. The canvas embeds existing logo, artwork and Veneer; specimen cards supply visual context and do not simulate catalogue membership or commerce. Category clicks demonstrate selection and heading states only.

## Goals / Non-Goals

**Goals:** Give record buyers an immediately recognizable choice of shelves, retain a clear current category, and review desktop/mobile hierarchy before changing the Store.

**Non-Goals:** Redesigning cards, search, the artist pane, header, player, checkout, category classification or content. The canvas is a supporting design artifact, not a shipped route.

## Decisions

### Approved centered composition

Approved: **Centered + larger**. Center the content-width group inside the navigation band; use 18px semibold Inter labels from 640px and 16px below it, 1.35 line height, 0.02em tracking and uppercase labels. Use rem equivalents so text enlargement remains supported. The Store remains monochrome and image-led.

The reviewed larger left-aligned alternative was not selected. The 14px treatment remains in the canvas as the previous reference.

Desktop links are at least 52px high with 12px / 16px / 9px top / inline / bottom padding and a 24px column gap. Mobile links are at least 48px high with 11px / 8px / 8px padding and 4px / 8px row / column gaps. The group has 8px vertical padding. Retain container gutters and outer band borders, remove cell dividers, and center each wrapped row. Keep the 3px active underline, restrained tint and 2px focus outline; disable transitions for reduced motion.

### Use the established BlackBox visual language

Register: brand. Strategy: Restrained, with the existing Store accent confined to selection. Scene: a record buyer browsing artwork on a phone in a dim venue or on a laptop at home, with the familiar dark sleeve-like surface retaining the label's identity. Anchors from `PRODUCT.md` and `DESIGN.md`: the working distro table, photocopied gig wall, and BlackBox's existing Store rail. Keep Veneer for public titles and Inter for these navigation labels.

This minor refinement does not need generated visual-direction probes. Existing imagery provides context; no new assets are proposed for the shipped navigation.

### Keep category access native and responsive

Scope: two detailed visual studies of one component in its existing page context, each with desktop and 390px mobile views. The prototype demonstrates active, hover and keyboard-focus treatment. Optional host controls adjust size or show the populated Merch case; they are review controls only.

Retain All / BlackBox Releases / Distro in order, appending Merch only when populated. Keep at least 48px target height below 640px and 52px from 640px, full labels, the existing active underline/tint, and a distinct 2px focus outline. At 320px or enlarged text, allow content-driven rows; no horizontal scroller, ellipsis, fixed-height clipping or hidden destination. Avoid full-width equal cells on desktop so the shorter labels and longest label form one purposeful group.

### Cover the existing states

- Default and each active shelf: one current category, stronger type, 3px accent underline and restrained tint.
- Hover: foreground lift, with current selection still identifiable.
- Focus: a distinct outline on current and inactive links; native link semantics remain in implementation.
- Three or four categories: complete ordered labels, including populated Merch, with wrapping at narrow widths.
- Empty, loading or failed catalogue reads: retain navigation; existing catalogue states continue to own their feedback.
- JavaScript unavailable and reduced motion: category access and visual state remain available without animation or client state.

Content: retain the exact existing category labels. Do not add category counts, explanatory copy, icons or new empty/error text to this bar. Relevant Impeccable references for implementation are spatial design, typography, interaction design and accessibility.

## Risks / Trade-offs

- Larger labels consume mobile width → wrap whole destinations and allow labels to wrap at enlarged text sizes; verify 320px, 390px and the populated Merch case.
- Centering changes the current left-aligned reading rhythm → the user explicitly chose the centered composition after reviewing both alternatives.
- Artwork can make the proposed bar seem less prominent → assess the bar with real existing artwork in view rather than an isolated control.
- Baseline equal-width specification differs from current source → the delta explicitly replaces that desktop composition, retaining its accessibility and static-navigation requirements.

## Migration Plan

After design approval, apply a scoped CSS change to the shared collection navigation. Verify category routes and player continuity locally, then run the required validation. Release follows the existing software-release workflow. Reverting the scoped presentation styles restores the current bar; there is no data migration.

## Review Decision

Approved on October 3, 2026: Centered + larger, followed by an explicit request to implement the complete plan. Implementation stays in the existing store-filter-design worktree; merging and deployment are separate actions.

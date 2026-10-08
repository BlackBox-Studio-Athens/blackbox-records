# Design

## Context

`HomeHero.astro` renders the motto over the fixed hero photo, followed by a Scroll label and an animated line. `StorePreorderShowcase` renders `<section id="preorders">` lower on Home only when the Worker reports stocked pre-orders; otherwise it renders nothing. The approved visual drafts are frames C and C · Mobile on the review canvas (https://claude.ai/artifact/HgDFJ4njPXD7yDuu3szbUq). See proposal.md for the visitor problem.

## Decisions

- **Copy and links live in code.** They are Store entry points, and editorial content must not acquire commerce controls. The showcase already hardcodes its labels ("All pre-orders"). New required CMS fields would also invalidate existing UAT/PRD snapshots that lack them.
- **Reuse the public button family.** Browse the Store uses the default (filled) `lg` variant and See pre-orders the `outline` `lg` variant from `buttonVariants`; See pre-orders adds the Pre-order Sea green bottom edge used by the pre-order action. This deviates from the drafts' 52 px buttons in favour of the shared 44 px size.
- **See pre-orders follows the rendered showcase.** Open pre-orders are a runtime Worker fact, so build data cannot decide visibility. An unlayered CSS rule shows the link only under `#main:has(#preorders)`; there is no JavaScript. It is unlayered because Tailwind's `inline-flex` utility outranks any components-layer rule. The `href="#preorders"` is a same-page hash, which shell anchor navigation ignores, so the browser's native jump runs and honours the section's existing `scroll-margin-top`.
- **Phone layout.** At 48rem and below the content block stretches to the gutter instead of centring, so the motto, copy and buttons share the logo's left edge. The copy scales down to `min(0.9375rem, 4.4vw)` to stay on one line down to 280 px. The buttons grow to share one row and wrap to full-width rows when they cannot fit.
- **Retire, do not delete, `hero.scroll_indicator_text`.** `home.hero` is one EmDash JSON field and `getCmsContentIssues` rejects unknown keys. Stored Home records still carry the key, so the schema keeps it as optional and unused. The staff form and retained fixtures drop it.

## Risks / Trade-offs

- See pre-orders appears once the showcase has loaded. It sits on the same row as Browse the Store, so its arrival does not move the motto. On phones it narrows Browse the Store, which shifts no other content.
- `:has()` needs Chrome 105, Safari 15.4 or Firefox 121. Older browsers never show See pre-orders, which is the safe default.
- Hosted Home records keep the retired value until a separate cleanup removes it.

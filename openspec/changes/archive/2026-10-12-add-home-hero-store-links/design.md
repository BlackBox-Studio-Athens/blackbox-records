# Design

## Context

`HomeHero.astro` renders the motto over the fixed hero photo, followed by a Scroll label and an animated line. `StorePreorderShowcase` renders `<section id="preorders">` lower on Home only when the Worker reports stocked pre-orders; otherwise it renders nothing. The approved visual drafts are frames C and C · Mobile on the review canvas (https://claude.ai/artifact/HgDFJ4njPXD7yDuu3szbUq). See proposal.md for the visitor problem.

## Decisions

- **Labels and links live in code.** They are Store entry points, and editorial content must not acquire commerce controls. The showcase already hardcodes its labels ("All pre-orders"). New required CMS fields would also invalidate existing UAT/PRD snapshots that lack them.
- **Reuse the public button family.** Browse the Store uses the shared outlined `sm` variant from `buttonVariants`, with local sizing and tone utilities for the approved smaller B draft: approximately 100 × 28 px, 12 px type, 8 px side padding, a fine light outline and a translucent black face. The shared focus, hover and active states stay available. Its coarse-pointer halo extends 9 px from inside the border to keep the touch target 44 px high.
- **Remove the conditional hero action.** The owner reported that See pre-orders still appeared late on PRD and then explicitly requested its removal. Delete the hero link and its showcase-dependent CSS. Browse the Store remains the hero's only action, whether the showcase is pending, populated or empty. The showcase and its own links remain further down Home.
- **Defer the runtime check.** Home continues to mount `StorePreorderShowcase` with `client:idle`. The showcase code and its live pre-order read wait for browser idle time. The hero, motto and Browse the Store remain available from the initial page without waiting for that check.
- **Apply the approved smaller B.** The owner reviewed three drafts, selected Quiet outline, requested a smaller revision and then approved that revision for implementation and a local commit. Use the same treatment on mobile and desktop. The approved desktop and phone review is retained at `.codex-artifacts/home-browse-drafts/quiet-outline-smaller/index.html`.
- **Phone layout.** At 48rem and below the content block stretches to the gutter instead of centring, so the motto and Browse the Store share the logo's left edge.
- **Retire, do not delete, `hero.scroll_indicator_text`.** `home.hero` is one EmDash JSON field and `getCmsContentIssues` rejects unknown keys. Stored Home records still carry the key, so the schema keeps it as optional and unused. The staff form and retained fixtures drop it.

## Risks / Trade-offs

- Removing See pre-orders also removes its late arrival and the associated hero layout change. The smaller Browse control retains a 44 px touch target and visible keyboard focus even though its drawn frame is 28 px high.
- Hosted Home records keep the retired value until a separate cleanup removes it.

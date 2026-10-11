# Design

## Context

`HomeHero.astro` renders the motto over the fixed hero photo, followed by a Scroll label and an animated line. `StorePreorderShowcase` renders `<section id="preorders">` lower on Home only when the Worker reports stocked pre-orders; otherwise it renders nothing. The approved visual drafts are frames C and C · Mobile on the review canvas (https://claude.ai/artifact/HgDFJ4njPXD7yDuu3szbUq). See proposal.md for the visitor problem.

## Decisions

- **Labels and links live in code.** They are Store entry points, and editorial content must not acquire commerce controls. The showcase already hardcodes its labels ("All pre-orders"). New required CMS fields would also invalidate existing UAT/PRD snapshots that lack them.
- **Reuse the public button family.** Browse the Store currently uses the default (filled) `lg` variant from `buttonVariants`, with a shared 44 px target. The requested smaller, quieter treatment is subject to the review below.
- **Remove the conditional hero action.** The owner reported that See pre-orders still appeared late on PRD and then explicitly requested its removal. Delete the hero link and its showcase-dependent CSS. Browse the Store remains the hero's only action, whether the showcase is pending, populated or empty. The showcase and its own links remain further down Home.
- **Defer the runtime check.** Home continues to mount `StorePreorderShowcase` with `client:idle`. The showcase code and its live pre-order read wait for browser idle time. The hero, motto and Browse the Store remain available from the initial page without waiting for that check.
- **Review Browse treatments before styling.** The owner requested a smaller, quieter button, possibly in a black frame. Prepare three drafts on the existing hero with desktop and phone views. Keep the current Browse styling in source until the owner selects a treatment; reuse the public button family and its accessible touch target when applying the selection.
- **Phone layout.** At 48rem and below the content block stretches to the gutter instead of centring, so the motto and Browse the Store share the logo's left edge.
- **Retire, do not delete, `hero.scroll_indicator_text`.** `home.hero` is one EmDash JSON field and `getCmsContentIssues` rejects unknown keys. Stored Home records still carry the key, so the schema keeps it as optional and unused. The staff form and retained fixtures drop it.

## Risks / Trade-offs

- Removing See pre-orders also removes its late arrival and the associated hero layout change. Browse sizing and tone remain a separate owner review gate.
- Hosted Home records keep the retired value until a separate cleanup removes it.

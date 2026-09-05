## Context

Commit `9f37b7db` reduced Store All mobile LCP to 2.460 seconds, but Store Distro remained at 2.564 seconds and retained layout-heavy first-traversal outliers. The Distro document already groups cards into server-rendered six-card chunks and already contains every non-first chunk. The missing boundary is the first chunk of each later, below-fold group.

## Goals / Non-Goals

**Goals:**

- Keep the first viewport eager while deferring layout for every below-fold Distro chunk.
- Reuse the existing six-card chunk structure and native CSS containment.
- Preserve canonical server-rendered content, navigation, search, Coverflow, accessibility, and image behavior.

**Non-Goals:**

- Changing Astro markup, controllers, cards, image priority, dependencies, APIs, types, or content.
- Adding observers, retained-activation JavaScript, pagination, virtualization, batching, or node recycling.

## Decisions

### Extend the existing chunk selector

Use the existing chunk class and intrinsic estimate:

```css
.distro-group-chunk:not(:first-child),
.distro-group-section:not(:first-child) .distro-group-chunk:first-child {
  content-visibility: auto;
  contain-intrinsic-block-size: auto 192rem;
}
```

The first selector preserves current containment for every non-first chunk. The second adds only the first chunk of later groups. The first chunk of the first group remains eager. This is smaller and more reliable than adding runtime activation state.

### Keep semantic structure outside containment

Group headers, format jump targets, search structure, and individual cards remain unchanged and uncontained. Search and Coverflow continue operating on the existing server-rendered nodes. This keeps invalid split render states unrepresentable: a card has one canonical DOM node and containment belongs only to its owning chunk.

### Accept only measured improvement

The exact implementation commit must pass the existing mobile-load, activation, traversal, request-cardinality, Browser Use, and repository gates. If any gate fails, revert only the new selector expansion and record the failing evidence. Do not climb to a JavaScript or virtualized renderer inside this change.

## Risks / Trade-offs

- **Intrinsic size differs for a later group** → Reuse the established `192rem` estimate only because chunk geometry and six-card size are identical; reject the change if Browser Use shows scrollbar or card-pop regressions.
- **Search or jump reveals skipped content late** → Verify search, clear, empty results, and later-group format jumps at desktop and 390 pixels.
- **Cold-load variance hides a regression** → Use five mobile cold runs per route and median LCP, plus the existing traversal profiles and trace classification.

## Migration Plan

1. Extend the existing source-contract test.
2. Apply the two-selector CSS rule.
3. Commit the exact implementation tree.
4. Run performance and Browser Use acceptance against that commit.
5. If accepted, record evidence, synchronize the delta, and archive this child. If rejected, restore the previous selector and keep the performance changes active with the measured failure recorded.

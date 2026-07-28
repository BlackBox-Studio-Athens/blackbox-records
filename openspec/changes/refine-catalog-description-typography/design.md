## Context

The public site already loads and uses `Geist Mono` through the shared `--font-mono` token for compact editorial labels. Distro browse-group introductions and the highlighted Release summaries use Inter today, while their surrounding labels and titles already establish a stronger mixed-type hierarchy.

This change is intentionally CSS-only. Existing markup exposes one selector for each target role, and the current font request already includes the required mono weights.

## Goals / Non-Goals

**Goals:**

- Give three bounded catalog-description roles a restrained editorial accent.
- Preserve current readability, hierarchy, responsive wrapping, and optional-content behavior.
- Keep the change covered by one focused source-contract test and rendered Browser Use checks.

**Non-Goals:**

- Changing Store orientation copy, Distro or Release cards, Store Item details, Release details, or long-form prose.
- Adding a font, token, component class, content field, runtime state, or client behavior.
- Changing font size, line height, color, width, spacing, casing, letter spacing, or layout.

## Decisions

### Reuse the existing mono token

Add only `font-family: var(--font-mono)` to `.distro-group-section__copy`, `.releases-latest-feature__summary`, and `.releases-latest-feature__upcoming-summary`. This reuses the loaded family and fallback stack without changing font delivery.

Adding another font was rejected because the existing type system already provides the needed contrast. Creating a new shared class or token was rejected because three stable selectors already own these roles.

### Keep the accent above item level

The mono family stops at Distro group introductions and highlighted Release summaries. Orientation copy, repeated cards, and detail prose retain Inter so dense browsing and longer reading remain calm.

Applying mono to every summary was rejected because repetition across the Distro catalog would become noisy and reduce readability.

### Lock the boundary with one focused contract test

Add one style-source test that verifies the three included selectors use `var(--font-mono)` and the excluded orientation, card, and detail roles do not opt into mono. Existing layout and content tests continue to own rendering structure and optional summary presence.

## Risks / Trade-offs

- **[Risk]** Mono body copy can read as technical or become tiring. **Mitigation:** keep normal sentence casing and tracking, preserve current readable sizes and line heights, and limit the family to three short editorial roles.
- **[Risk]** A later broad selector could spread mono into cards or detail prose. **Mitigation:** source-contract coverage asserts both the included and excluded boundaries.
- **[Risk]** Narrow layouts could wrap differently. **Mitigation:** verify direct and app-shell presentations at desktop, 390px, and 320px without clipping or horizontal overflow.

## Migration Plan

Ship as a static CSS change with no migration or feature flag. Rollback removes the three `font-family` declarations and their focused contract assertions.

## Open Questions

None.

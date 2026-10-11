# Design

## Context

See proposal.md. The direction was chosen from four rendered options on the design canvas; three details were then settled from a rendered comparison. The page keeps its content, data loaders, inquiry targeting attributes and the shell-owned inquiry form portal.

## Goals / Non-Goals

Restyle the page with existing primitives (`Prose`, `Image`, `buttonVariants`, `.layout-container`, `.brand-card-title`) and tokens. Do not change the form component's structure or behaviour, the inquiry contract, content fields or shell code.

## Decisions

- Tiles keep every CMS field. The contact note stays visible, muted, above the tile action, so no editor-maintained text silently disappears.
- `Share your demo` lives only in the Demos strip. The intro keeps one `Start an inquiry` action. One exact-name demo link keeps the existing e2e contract and avoids duplicate competing actions.
- The form takes the new layout (centred bordered panel, sentence-case labels) but keeps Services Rose labels and the rose-edged outline submit. Only CSS changes; the success panel replaces the framed form, so frames never nest.
- Tiles are not links, so they have no hover state. Inline service links use foreground at rest and Services Rose on hover and focus, matching the rule that route accents never show at rest.
- `ui/grid-pattern.astro` becomes unused but stays: the module-boundary test uses it as the ui-foundation entrypoint example.

## Risks / Trade-offs

- Square tiles crop the existing landscape photos more than the old panels; the photos are scene shots, so centre cropping keeps their subject.
- Between 40rem and 48rem the tiles stay one column with a large square photo.

## Migration Plan

No content or data migration and no hosted operation. Normal frontend promotion delivers it; reverting the page and stylesheet restores the previous layout.

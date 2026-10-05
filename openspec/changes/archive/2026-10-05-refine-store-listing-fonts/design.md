# Design

## Context

The supplied Disintegration / Afterwise reference shows the current sizing. Graphify's focused StoreItemCard explanation identifies both StoreCollectionPage and StoreDistroCatalog as callers; CodeGraph returned their current source. Both use the same card and typography.

## Decision

Interpret “distro item” as the shared Store listing title, consistently across All, BlackBox Releases, Distro and populated Merch. There is no separate Distro-only title role in the source. Use the existing `--font-display-brand` token (Veneer, weight 900) for titles and inherited `--font-sans` (Inter, weight 400) for the complete credit.

Keep the title's `clamp(1.25rem, 1.8vw, 1.5rem)`, line height 1.12, tracking 0.015em, source casing and underline. Keep the credit's 0.875rem size, line height 1.4 and muted color. Removing the artist-name font override lets linked and unlinked names inherit the existing body font without changing markup or link hit areas.

## Verification

Reuse the existing Store typography browser test for 320px, 390px, 1440px and modeled 200% reflow, linked/unlinked credits, long names, source accessible names and artist navigation. The parent chat owns final combined validation and graph refresh.

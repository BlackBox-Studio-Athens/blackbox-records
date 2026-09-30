# Proposal

## Why

Artist photos remain static while News images subtly zoom on hover. Matching that existing interaction gives the homepage and Artists roster consistent feedback.

## What Changes

- Give all three ArtistCard image variants the News-style 1.03 scale over 500 ms.
- Disable the decorative zoom when reduced motion is requested.
- Preserve photo fitting, frame sizes, overlays, links, and image delivery.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `site-images`: Define the shared Artist card image hover and reduced-motion behavior.

## Impact

Only ArtistCard image classes change in product code. Homepage featured cards and the Artists roster inherit the effect without JavaScript, dependencies, API changes, or publication work.

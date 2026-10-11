# Design

## Context

The retained source is an 800 × 1200 JPEG. `ArtistCard` already serves Home and Artists with 3:4 frames; `ArtistDetailContent` serves the page and shell overlay. Both use the Artist image reference and existing Astro responsive delivery.

## Decisions

- Create a sibling JPEG and change only the retained Artist image reference. Keeping the original makes recovery a reference-only change.
- Two built-in image-tool edits were rejected because they changed faces and scene details. The owner explicitly approved Sharp, then requested a more square crop after the initial 3:4 Local review. Crop the original at left 40, top 265, width 720, height 720, convert to neutral grayscale and encode a quality-95 JPEG without resizing, sharpening or reconstruction. This removes excess canopy and foreground while keeping all visible bodies within an exact 1:1 photograph. Existing card frames remain 3:4 with the established contain-and-blurred-fill behavior.
- Reuse the running primary-checkout Local static site for browser acceptance. Leave populated CMS records and hosted publication untouched.

## Risks

- The original is smaller than the ideal upload dimensions. Preserve its native detail rather than inventing detail through generative upscaling; existing Astro candidate handling remains unchanged.
- A retained content change does not update CMS-owned live snapshots. UAT and PRD publication remain outside this change.

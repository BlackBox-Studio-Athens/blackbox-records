# Design

## Context

Approved reference: `C:/Users/SVall/.codex/visualizations/2026/10/19/01a1560c-1448-7d51-8c12-9f9570f06966/quiet-actions-first.html`. Earlier compact/under-cover layouts are historical. The preview's illustrative depleted-price visibility does not change the existing offer-price policy.

## Goals / Non-Goals

Keep the existing release-presentation authority across SSR, live DOM updates, React details and shell snapshots. Preserve featured rows, catalog columns, source order, square artwork and detail purchase-block position. No checkout/data/public API/schema/dependency changes, new detail price or provider writes.

## Decisions

- Cards use one DOM/visual order at every width: title/band → purchase/status + optional Listen + existing price → formats → supplied shipping/applicable terms → digital date/catalog → editorial summary/Read more. Spacing follows approved 4/12/16/4/8/12px rhythm. Catalog type is Veneer32/36, Inter16/24, format/helper13/20, Bebas price24/28, metadata12/18. Preserve larger featured/detail headings.
- Human Local correction: controls use intrinsic width without growth, minimum112x44px,16px horizontal padding,16px Bebas labels,18px icons/8px internal gap and16px group gaps. The existing card price follows Listen in the wrapping action row, centered without auto margin; formats follow. A responsive container limit allows enlarged labels to wrap without clipping. Detail keeps its no-price policy.
- Research from parent: Design Library SPACE-01/UX-Fitts and [Carbon guidelines](https://www.carbondesignsystem.com/building-blocks/core/components/button/guidelines) support contextual intrinsic/fluid sizing, not universal ratios. [W3C Target Size Enhanced](https://www.w3.org/WAI/WCAG22/Understanding/target-size-enhanced.html) is AAA guidance. Numeric values are project choices; no global button-system/dependency changes.
- Remove digital badges from the offer model and routine In stock/View details from rendered release surfaces. Stable semantic digital dates are server metadata and never rewritten by offer correction. Detail labels the existing date Digital release without a second purchase-block date.
- Ready stocked normal offers use Flint Buy; ready stocked open preorders use Sea Pre-order, with format-aware labels. Coming soon/Repressing are static dashed Flint statuses; Sold out has a solid1px #bc4945 edge scoped to editorial release surfaces. DESIGN reconciles this explicit exception to the older Flint/red reservation.
- Unknown/pending/paused keeps internal classification but no public label or Buy. Any matching ready record retains its current price, including depleted/paused. Non-ready/missing/mismatched records show no asserted price.
- Replace generic details access with underlined44px native physical-format links only for known destinations. The shared format markup matches the actual primary edition format; other supplied formats remain plain. Announced editions may use their existing release detail URL. No inferred CD path.
- Existing native links keep their destinations and browser behavior; purchase navigates rather than adding to cart. External commerce target/rel remains. Listen/In player is independent and optional. Static statuses have no tab stop or control affordance. Vinyl uses static18px Lucide Disc3; existing CD/cassette marks remain.
- Keep shipping independent of digital timing and conditional terms without a reserved blank line. Astro's existing Listen child stays alongside the React action; format markup is passed as the named formats slot beneath it.
- Retain detail client:load, registered by the shell, for direct and overlay hydration. Preserve projection retention on failure, AbortController disposal and snapshot reset.
- Approved refinement reuses original artwork/fonts/icons; no image generation or new assets are needed.
- Accepted Local release geometry is reused by Store listing Buy through the same grouped CSS rule. Every Store format uses one static18px Disc3 and the generic Buy label, including CD/tape/merch; no global StoreBuyIcon replacement. Remove obsolete Store-only layered-icon animation listeners/keyframes. Keep existing ml-auto price-row placement, Grid/Crate composition, Pre-order/Adding/Added labels and authoritative offer/cart reads. Item Add to cart and checkout/payment/retry/status commands stay outside this extension.
- Parent R1: native physical-format links have minimum44px width as well as height, including short Vinyl/CD text. Parent R2: direct and overlay details share a small server-rendered metadata component that omits label/separators/time when date is absent while keeping catalog. Do not change the shared date formatter or add hydration.
- Parent R3: immediately before hiding/removing a focused Buy after successful correction, the card DOM renderer and React detail control focus the existing mapped format/edition link. Use the existing title destination as fallback when present. Check the current active element and connected action first; failed reads retain the projection/focus, aborted/disposed reads do nothing, and focus elsewhere is never moved. No focusable status or extra visible link.

## Risks / Trade-offs

Card heights can change when truthful shipping/terms arrive, as explicitly approved by removing blank reserved terms. Enlarged text wraps controls naturally. Verify320/390/768/1440, focus and native format routes, modified clicks, text spacing, reduced motion, projection depletion/failure/disposal and cache return.

## Migration Plan

No data migration. Human accepted the corrected Local release UI and authorized exact Store reuse without a new visual stop. Run source-bound focused checks, including Store Grid/Crate at desktop/mobile widths and actual dateless metadata SSR, and leave fresh normal Local with screenshots. Parent independent review/fixes precede the scoped local commit and applicable worktree cleanup. Archive/delivery acceptance follows those gates.

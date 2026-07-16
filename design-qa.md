# Store category signal rail design QA

## Evidence

- Source visual truth:
  - `docs/ui-mockups/store-category-signal-rail-poc.png`
  - `docs/ui-mockups/store-orientation-approved-poc.png`
  - `C:/Users/SVall/AppData/Local/Temp/codex-clipboard-6c83440b-f45c-45f6-a8f3-f9c0d8be2cea.png`
  - `C:/Users/SVall/AppData/Local/Temp/codex-clipboard-b9e6e33d-e963-4015-a220-58336f31cdde.png`
- Browser-rendered implementation:
  - `C:/Users/SVall/.codex/visualizations/2026/07/16/019f69bb-794e-7f42-87f5-6ee8584a8a8d/store-signal-rail-desktop.png`
  - `C:/Users/SVall/.codex/visualizations/2026/07/16/019f69bb-794e-7f42-87f5-6ee8584a8a8d/store-blackbox-releases-desktop.png`
  - `C:/Users/SVall/.codex/visualizations/2026/07/16/019f69bb-794e-7f42-87f5-6ee8584a8a8d/store-distro-coverflow-desktop.png`
  - `C:/Users/SVall/.codex/visualizations/2026/07/16/019f69bb-794e-7f42-87f5-6ee8584a8a8d/store-signal-rail-390.png`
  - `C:/Users/SVall/.codex/visualizations/2026/07/16/019f69bb-794e-7f42-87f5-6ee8584a8a8d/store-blackbox-releases-390.png`
  - `C:/Users/SVall/.codex/visualizations/2026/07/16/019f69bb-794e-7f42-87f5-6ee8584a8a8d/store-distro-coverflow-band-390.png`
  - `C:/Users/SVall/.codex/visualizations/2026/07/16/019f69bb-794e-7f42-87f5-6ee8584a8a8d/store-signal-rail-320.png`
  - `C:/Users/SVall/.codex/visualizations/2026/07/16/019f69bb-794e-7f42-87f5-6ee8584a8a8d/store-distro-coverflow-320.png`
- Full-view comparison boards:
  - `C:/Users/SVall/.codex/visualizations/2026/07/16/019f69bb-794e-7f42-87f5-6ee8584a8a8d/comparison-signal-rail.png`
  - `C:/Users/SVall/.codex/visualizations/2026/07/16/019f69bb-794e-7f42-87f5-6ee8584a8a8d/comparison-orientation-desktop.png`
  - `C:/Users/SVall/.codex/visualizations/2026/07/16/019f69bb-794e-7f42-87f5-6ee8584a8a8d/comparison-orientation-mobile.png`
  - `.codex-artifacts/store-distro-redesign/distro-panel-comparison.png`
  - `.codex-artifacts/store-distro-redesign/distro-coverflow-comparison.png`
- Distro extension captures:
  - `.codex-artifacts/store-distro-redesign/distro-desktop-top.png`
  - `.codex-artifacts/store-distro-redesign/distro-desktop-coverflow-overview.png`
  - `.codex-artifacts/store-distro-redesign/distro-desktop-coverflow.png`
  - `.codex-artifacts/store-distro-redesign/distro-mobile-390-top.png`
  - `.codex-artifacts/store-distro-redesign/distro-mobile-390-coverflow.png`
  - `.codex-artifacts/store-distro-redesign/distro-mobile-320-top.png`
  - `.codex-artifacts/store-distro-redesign/distro-mobile-320-coverflow.png`
  - `.codex-artifacts/store-distro-redesign/distro-coverflow-item-34-desktop.png`
  - `.codex-artifacts/store-distro-redesign/distro-coverflow-full-desktop-focused.png`
  - `.codex-artifacts/store-distro-redesign/distro-coverflow-full-390.png`
  - `.codex-artifacts/store-distro-redesign/distro-coverflow-full-320.png`
  - `.codex-artifacts/store-distro-redesign/distro-coverflow-match-1305x749.png`
  - `.codex-artifacts/store-distro-redesign/distro-coverflow-request-comparison.png`
- Viewports: desktop 1440×1024, 1380×768, and 1305×749; mobile 390×844, 320×800, and 320×720.
- States: All active, BlackBox Releases active, Distro active, Vinyl 12-inch Coverflow preview, records 1, 34, and 53, wrap to record 1, Previous/Next, full-catalog disclosure, Coverflow restoration, search results, search clear, reduced motion, and no JavaScript.

## Findings

- No actionable P0, P1, or P2 visual mismatch remains.
- Typography retains the existing BlackBox display and utility families. The All headline is deliberately smaller than the earlier panel and remains readable without duplicated Distro prose or subtotal.
- Spacing and layout follow the approved ruled, square-cornered composition. All, BlackBox Releases, and Coverflow use different content structures while retaining the same rules, spacing scale, and active accent.
- Colors use existing background, border, foreground, muted, and Store accent tokens. No new gradient, shadow language, or decorative runtime asset was introduced.
- Product artwork, logo assets, and card imagery remain the repository sources. The redesign adds no replacement or generated visual asset.
- Copy and counts are source-derived. The live rail has three categories because empty Merch remains undiscoverable; the four-category PoC remains illustrative.
- The Distro introduction now uses the same ruled orientation-panel grammar as All and BlackBox Releases. It keeps Distro-specific copy, one collection total, and the existing search control without repeating idle result totals.
- The search input now sits directly in the Distro tools column; the later generic artist-filter rule cannot reintroduce a nested border, background, or padding frame.
- The restored Coverflow is smaller and visually joined to its disclosure header. Six distinct covers remain visible, the remaining inventory is explicit, and the stage does not create horizontal page overflow at 1380px, 390px, or 320px.
- The aligned statistic columns now share the same number and label baseline logic. `Now viewing` and `More` update for every one of the 53 records instead of describing a curated six-item subset.
- The accent rail maps the active one-based catalog position to the full 53-record range. Its 260ms transform transition reads as location feedback rather than decorative motion, and reduced-motion users receive the same state immediately.

## Focused comparison

The full-view boards keep the rail, panel type, rules, counts, and action hierarchy readable at comparison scale. The Distro before/after board confirms removal of duplicated `79 items` output. The approved-direction/Coverflow board confirms that the implemented disclosure rail retains the selected hierarchy while adding the compact artwork stage. The request/implementation board compares the supplied 1305×749 reference with the rendered state; its statistic columns are aligned and the same compact six-cover stage is retained. Separate 390px and 320px captures verify wrapping and control reflow.

## Interaction and accessibility checks

- Native Store links switch direct and shell-managed routes; `aria-current`, focus reset, and active styling follow the selected category.
- Previous, Next, View all, Show Coverflow, search entry, and Clear search retain their existing modes and focus behavior.
- Distro search hides format navigation while active, reports one live result for `Indoctrinate`, and restores the format navigation after Clear search.
- Signal-rail and Coverflow controls remain at least 44 CSS pixels high.
- 200% text sizing and the 320px 400%-zoom equivalent have no horizontal page overflow or clipped panel text.
- Reduced motion produces static ratio/remainder presentation and immediate mode changes without animation.
- With script execution disabled, all 53 Vinyl 12-inch cards remain visible and linked while Coverflow controls stay absent.
- `aria-roledescription="carousel"` is attached only when the enhanced Coverflow controller is ready and is absent from the no-JavaScript catalog fallback.
- Coverflow navigation traverses all 53 records with six positioned covers at a time. Record 34 reports `34 of 53`, `19 More`, and a 34/53 rail ratio; record 53 wraps forward to record 1.
- Clicking a visible side cover moves selection and focus to the new active cover. View all reveals all 53 cards and Show Coverflow restores the compact preview.
- Browser console check: no errors or warnings on the validated Store routes.

## Comparison history

1. Initial comparison found one P2 reflow issue at 200% text sizing: the existing mobile Store card grid allowed intrinsic card width to exceed its container.
2. Fixed `.store-catalog-chunks` with a zero-minimum single column and `.store-item-card--listing` with `min-width: 0`.
3. Post-fix Browser Use evidence at 390px with 200% root text sizing showed no page overflow, card overflow, or clipped panel text.
4. Distro extension comparison found no new P0, P1, or P2 mismatch. The orientation panel aligns with the approved panel family, and the smaller Coverflow retains readable controls and recognizable side covers.
5. Browser Use rechecked the extension at 1380×768, 390×844, and 320×800. Search, disclosure, shell navigation, reduced motion, touch targets, and console output passed without another visual correction.
6. Independent diff review found a generic-filter specificity collision and premature server-rendered carousel semantics. The final pass strengthened the Distro search reset and moved carousel semantics into controller setup/cleanup; Browser Use then reconfirmed the final panel and no-JavaScript state.
7. The full-catalog extension rechecked alignment, arbitrary-count traversal, record 34 rail state, record 53 wrap, disclosure, search, shell restoration, reduced motion, no-JavaScript fallback, and 390px/320px reflow. No P0, P1, or P2 visual issue remained.

## Implementation checklist

- [x] Match approved Signal rail hierarchy and active state.
- [x] Keep All compact and remove duplicated information.
- [x] Keep BlackBox Releases smaller and purpose-specific.
- [x] Make remaining Coverflow inventory explicit with a compact primary disclosure.
- [x] Bring Distro into the orientation-panel family without duplicating collection or search information.
- [x] Retain the existing Coverflow controller and restyle its frame, scale, depth, and transitions instead of adding a second carousel dependency.
- [x] Traverse all 53 records while positioning only the active six-cover neighborhood.
- [x] Align the statistic columns and animate the accent rail to the active catalog position.
- [x] Validate responsive, zoom, reduced-motion, no-JavaScript, focus, interaction, and console states.

final result: passed

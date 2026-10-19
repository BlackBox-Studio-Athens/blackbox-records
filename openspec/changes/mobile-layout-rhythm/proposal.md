# Proposal

## Why

The Local audit measured a 1296px Home pre-order showcase, a 1084px featured Releases card, a 106×82px artist counter and a 417px phone footer. The approved preview tightens those compositions while keeping complete artwork, readable facts and the persistent player.

## What Changes

- Keep the 16px gutter at 390px; contain rules, photos, rows and footer inside the page frame, with header/hero bleed and approved Home video/photo desktop exceptions above 800px.
- Rebuild Home pre-order chapters below 48rem as the owner-chosen film strip: a 16:9 film/poster/photo band with only the corner 44px Watch control when a clip exists, facts and the equal-half 44px Sea Pre-order/amber Listen pair beneath, or a 160px sleeve beside identity/price when neither clip nor band photo exists. The current composition at 800px and below stays unchanged; above 800px restore the approved Thursday desktop layout; the owner removed manual chapter motion controls on every viewport, with reduced motion as the opt-out.
- Make artist release counts inline and use two roster columns from 360px with tighter padding and retained 3:4 photos (390px page height 3065px to 1583px); use amber current swipe dots in 44px targets and keep swipe peeks inside the gutter.
- Reduce Releases card gaps and padding (390px page height 2748px to 2556px) while retaining intrinsic sizing.
- Footer follow-up: the owner-approved `redesign-footer-flowing-links` supersedes this change's original 200px/four-column prescription. The new change owns footer implementation and acceptance; the original measurements remain historical evidence here.
- Assign the affected DESIGN.md composition rules and UI/browser tests to Claude.

## Capabilities

### New Capabilities

- `public-page-frame`: shared gutters and named responsive bleed exceptions.

### Modified Capabilities

- `release-catalog-presentation`: only card order, summary disclosure, status presentation, action/price placement and responsive composition.
- `artist-roster-presentation`: inline release count and compact two-column roster from 360px.
- `home-section-rows`: contained swipe rows and amber current dots.
- `store-preorders`: Home phone film-strip composition and automatic motion rules.
- `app-shell-and-player`: compact footer and preserved navigation.

## Scope and Non-Goals

Themes T5–T7 cover public layout and its tests. Preserve release role selection, catalog numbers, live price/stock authority, projection-first Home rendering, accepted artwork/content, full-video consent and player continuity. No Store toolbar redesign, Staff change, new content model, image generation, provider integration or release resequencing is included.

## Dependencies

Depends on `accent-and-button-system`. It can be implemented alongside `store-mobile-first-browse` after that foundation, with one writer per shared file and combined acceptance of the frame and Store grid. The existing shell Back/Forward contract remains required. The phone film-strip composition is chosen, with final measured heights still outstanding; C1's owner-approved amber family now supplies Listen and small marks: #e3b56c edges/bars/marks, #f0d7b0 In player label and rgba(227, 181, 108, 0.16) focus/hover/session surface.

## Impact

Future work reaches editorial, artists, Store Home showcase, shell/Footer, shared styles and existing Home/Releases/route tests. Claude owns the presentation and UI tests; no data, tooling or boundary implementation is planned for Codex. Final validation and the authorized UAT release remain implementation tasks; this pass writes plans and delta specs only.

## Approved desktop restoration, 19 October 2026

The owner accepted both canvas previews and explicitly assigned implementation and UI tests to Codex. Above 800 CSS pixels restore Thursday baseline adc595c83c6d09d3b732fb21f1e2bbe682b701f5: full-width video with centred copy/sleeve and lower-right Listen/Watch, plus photo-backed no-video chapters with complete photographs over blurred same-photo fill. Preserve current buttons/Soft edge, data, playback logic, cover-only fallback and every layout at 800px and below. This follow-up authorizes local implementation and checks only; earlier release permissions do not extend to it.

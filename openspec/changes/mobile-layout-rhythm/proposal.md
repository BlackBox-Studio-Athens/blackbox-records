# Proposal

## Why

The Local audit measured a 1296px Home pre-order showcase, a 1084px featured Releases card, a 106×82px artist counter and a 417px phone footer. The approved preview tightens those compositions while keeping complete artwork, readable facts and the persistent player.

## What Changes

- Keep the 16px gutter at 390px; contain rules, photos, rows and footer inside the page frame, with only the header and Home hero film allowed to bleed.
- Rebuild Home pre-order chapters and Releases cards around nearby 44px purchase/Listen pairs, truthful status and compact copy; retain the Home film chapter's 44px pause/resume icon on phones for accessibility.
- Make artist release counts inline and use two roster columns from 360px with tighter padding and retained 3:4 photos (390px page height 3065px to 1583px); use amber current swipe dots in 44px targets and keep swipe peeks inside the gutter.
- Reduce Releases card gaps and padding (390px page height 2748px to 2556px) while retaining intrinsic sizing.
- Compact the phone footer to approximately 200px at 390px (measured 198px): logo/socials on one 44px row, tagline in two 12px lines, eight links in four column-first columns of two 44px rows, and one 12px sentence-case meta line including Est. 2026.
- Assign the affected DESIGN.md composition rules and UI/browser tests to Claude.

## Capabilities

### New Capabilities

- `public-page-frame`: shared gutters and the two allowed bleed exceptions.

### Modified Capabilities

- `release-catalog-presentation`: only card order, summary disclosure, status presentation, action/price placement and responsive composition.
- `artist-roster-presentation`: inline release count and compact two-column roster from 360px.
- `home-section-rows`: contained swipe rows and amber current dots.
- `store-preorders`: Home chapter composition and phone motion controls.
- `app-shell-and-player`: compact footer and preserved navigation.

## Scope and Non-Goals

Themes T5–T7 cover public layout and its tests. Preserve release role selection, catalog numbers, live price/stock authority, projection-first Home rendering, accepted artwork/content, full-video consent and player continuity. No Store toolbar redesign, Staff change, new content model, image generation, provider integration or release resequencing is included.

## Dependencies

Depends on `accent-and-button-system`. It can be implemented alongside `store-mobile-first-browse` after that foundation, with one writer per shared file and combined acceptance of the frame and Store grid. The existing shell Back/Forward contract remains required. Round-2 geometry is settled; C1's owner-approved amber family now supplies Listen and small marks: #e3b56c edges/bars/marks, #f0d7b0 In player label and rgba(227, 181, 108, 0.16) focus/hover/session surface.

## Impact

Future work reaches editorial, artists, Store Home showcase, shell/Footer, shared styles and existing Home/Releases/route tests. Claude owns the presentation and UI tests; no data, tooling or boundary implementation is planned for Codex. Final validation and the authorized UAT release remain implementation tasks; this pass writes plans and delta specs only.

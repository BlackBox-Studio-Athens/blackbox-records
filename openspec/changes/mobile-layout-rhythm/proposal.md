# Proposal

## Why

The Local audit measured a 1296px Home pre-order showcase, a 1084px featured Releases card, a 106×82px artist counter and a 417px phone footer. The approved preview tightens those compositions while keeping complete artwork, readable facts and the persistent player.

## What Changes

- Keep the 16px gutter at 390px; contain rules, photos, rows and footer inside the page frame, with only the header and Home hero film allowed to bleed.
- Rebuild Home pre-order chapters and Releases cards around nearby 44px purchase/Listen pairs, truthful status and compact copy; retain the Home film chapter's 44px pause/resume icon on phones for accessibility.
- Make artist release counts inline, use Slate current swipe dots in 44px targets, and keep swipe peeks inside the gutter.
- Compact the phone footer to approximately 290px at 390px, with 44px tap rows, icons beside the logo, inline wrapping links and two-line meta beside Est. 2026.
- Assign the affected DESIGN.md composition rules and UI/browser tests to Claude.

## Capabilities

### New Capabilities

- `public-page-frame`: shared gutters and the two allowed bleed exceptions.

### Modified Capabilities

- `release-catalog-presentation`: only card order, summary disclosure, status presentation, action/price placement and responsive composition.
- `artist-roster-presentation`: inline release count.
- `home-section-rows`: contained swipe rows and Slate current dots.
- `store-preorders`: Home chapter composition and phone motion controls.
- `app-shell-and-player`: compact footer and preserved navigation.

## Scope and Non-Goals

Themes T5–T7 cover public layout and its tests. Preserve release role selection, catalog numbers, live price/stock authority, projection-first Home rendering, accepted artwork/content, full-video consent and player continuity. No Store toolbar redesign, Staff change, new content model, image generation, provider integration or release resequencing is included.

## Dependencies

Depends on `accent-and-button-system`. It can be implemented alongside `store-mobile-first-browse` after that foundation, with one writer per shared file and combined acceptance of the frame and Store grid. The existing shell Back/Forward contract remains required. The owner has approved the visual direction; no palette or layout choice listed in the request remains open.

## Impact

Future work reaches editorial, artists, Store Home showcase, shell/Footer, shared styles and existing Home/Releases/route tests. Claude owns the presentation and UI tests; no data, tooling or boundary implementation is planned for Codex. Final validation and the authorized UAT release remain implementation tasks; this pass writes plans and delta specs only.

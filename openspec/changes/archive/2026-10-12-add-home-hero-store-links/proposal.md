# Proposal

## Why

The Home hero fills the first screen without any sign that the label sells records. The pre-orders showcase appears only after scrolling, so a first-time visitor can leave without seeing that the Store exists. The hero's Scroll label also adds noise; the animated line already says the same.

## What Changes

- Under the motto, keep Browse the Store (to `/store/`) and remove See pre-orders entirely, as requested in the 11 October follow-up.
- Defer the showcase to browser idle time so the main page loads first; Browse the Store stays in the initial HTML and never depends on the showcase.
- Left-align the motto and button at the page gutter on phones, in line with the logo.
- Apply the owner-approved smaller Quiet outline Browse treatment on both mobile and desktop, while preserving a 44 px touch target and visible keyboard focus.
- Remove the Scroll label. The animated scroll line and its states stay.
- Retire the Home `hero.scroll_indicator_text` content field: nothing renders it, and editors no longer see it.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `app-shell-and-player`: the homepage hero links to the Store, removes its conditional pre-orders link and drops its Scroll label.

## Impact

`HomeHero.astro`, Home page wiring, hero CSS, the Home content schema, the staff Home form and retained Home fixtures change. Copy and links live in code, like the showcase's own labels; no new CMS field, API, dependency or JavaScript is added. Stored Home records keep their retired value, which the schema accepts and ignores, so existing drafts and publications stay valid. No commerce authority, prices, stock or checkout behavior changes.

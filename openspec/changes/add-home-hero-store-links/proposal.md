# Proposal

## Why

The Home hero fills the first screen without any sign that the label sells records. The pre-orders showcase appears only after scrolling, so a first-time visitor can leave without seeing that the Store exists. The hero's Scroll label also adds noise; the animated line already says the same.

## What Changes

- Under the motto, add two buttons: Browse the Store (to `/store/`) and See pre-orders (to the pre-orders showcase further down Home).
- Show See pre-orders only while the showcase is on the page, so the link never points at nothing.
- Left-align the motto and buttons at the page gutter on phones, in line with the logo; the buttons share a row and wrap when they cannot fit.
- Remove the Scroll label. The animated scroll line and its states stay.
- Retire the Home `hero.scroll_indicator_text` content field: nothing renders it, and editors no longer see it.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `app-shell-and-player`: the homepage hero links to the Store and to the Home pre-orders showcase, and drops its Scroll label.

## Impact

`HomeHero.astro`, Home page wiring, hero CSS, the Home content schema, the staff Home form and retained Home fixtures change. Copy and links live in code, like the showcase's own labels; no new CMS field, API, dependency or JavaScript is added. Stored Home records keep their retired value, which the schema accepts and ignores, so existing drafts and publications stay valid. No commerce authority, prices, stock or checkout behavior changes.

# Extend listening continuity and enforce the dark Bandcamp skin

## Why

The minimized player survives section and detail-overlay navigation, but every Store Item link (Store cards, Release Buy and edition links) and the footer's purchase, privacy and withdrawal links load a new document. That destroys the third-party iframe and stops playback on the paths shoppers use most while listening.

The embed's dark skin depends on the pasted URL. Bandcamp's player applies its dark theme only when `bgcol` is dark; staff pasting Bandcamp's default share code (white background, blue links) through the CMS get a light player on the site, because validation accepts any colour.

## What changes

- Store Item detail pages and the Purchase and delivery, Privacy and Withdrawal pages become same-document shell pages. The shell swaps `<main>` as it does for sections, so the player, StoreCart bridge and history behave as on other shell routes. Their page layout is unchanged. Checkout and checkout return stay full documents.
- The Bandcamp provider keeps only the album or track identity from a valid embed URL and always renders the house appearance: `size=large`, `bgcol=0d0d0d`, `linkcol=f5f5f5`, `artwork=big`, `transparent=true`, plus `tracklist=false` for single tracks. Validation still rejects unknown hosts, entities and options; a valid light embed is accepted and rendered dark.

## Scope

Public web shell and the shared content model. Embed layouts, provider tabs, the floating player, Stop and Back semantics are unchanged. Overlays for Store Items, a resumable player after full reloads (Bandcamp exposes no playback position) and Bandcamp exclusive embeds are out of scope.

## Acceptance

From a minimized session, opening a Store Item from the Store or a Release card, then the footer's Purchase and delivery link, keeps the same iframe connected; Back and Forward restore each page. Store Item purchase controls hydrate after the swap. A light Bandcamp embed URL renders with the dark house parameters. Unit tests, the player-continuity Playwright spec, strict OpenSpec validation and `pnpm validate` pass.

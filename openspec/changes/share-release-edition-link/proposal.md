# Share one edition destination between Releases artwork and its edition action

## Why

On Releases the cover opened the release page while the edition action beside it opened the Store edition, and only the action reacted to its own hover. The label wanted the cover and the edition action to be one target: the same destination and exactly the same feedback. The non-buyable action also read as body text ("View vinyl details" with an underline and arrow), which the label disliked; they chose a bracketed label and a record sliding out of its sleeve from rendered options and a live demo on 8 October 2026.

## What changes

- A Releases card with a native Store edition links its artwork to that edition, the same destination as its edition action. Both come from one value in `ReleaseCard.astro`, so they cannot diverge. Cards without a native edition keep the artwork's release detail link; the title keeps release detail access everywhere.
- Engaging either target (pointer on the artwork, pointer or keyboard focus on the action) gives both the same feedback through one CSS rule keyed on `data-release-edition-link`: the action's own hover look (bracket close, Buy or Pre-order fill) and, for vinyl, the record sliding out. The cover itself stays still, as before. Listen stays independent.
- The non-buyable action reads "Vinyl edition", "CD edition" or "Cassette edition" in uppercase mono, held in muted brackets that close in and brighten while engaged. The brackets are excluded from the accessible name. The artwork link is named "<Title>, <format> edition".
- A vinyl edition's card holds a record behind the cover: a public-domain photo of a 1967 Caedmon LP (Wikimedia Commons, no attribution required), 640px WebP of about 26 KB, with the release artwork as its label and fixed light layers (lit edge, key light, groove highlights). It slides 24% out below the lead cover and beside the supporting and catalog covers, turning 55 degrees. It renders only on hover-capable layouts from 64rem without reduced motion; the photo is requested on the card's first hover or focus and kept through the slide back.

## Scope

Public Releases cards only. Release detail pages keep their purchase link markup and take the new bracketed text through `ReleaseStoreLink`. Store, checkout, Worker and stock behavior are unchanged. Archive after `add-store-card-buy`, whose release-catalog-presentation delta this one builds on.

## Acceptance

On Releases at 1440px, each native edition's artwork and action share one href; hovering the artwork or the action slides the record out and closes the brackets identically; Listen leaves both at rest; the record photo is not requested before the first card hover; no horizontal overflow. Unit tests, the release-merchandising Playwright spec, strict OpenSpec validation and `pnpm validate` pass.

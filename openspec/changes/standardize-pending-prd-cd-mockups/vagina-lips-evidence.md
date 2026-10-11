# The Vagina Lips cassette background

The user requested the mockup background and explicitly authorized completing PRD publication on 11 October 2026. This is an image-only content publication. Software Release preserves the accepted content pointer and cannot adopt this image by deployment.

## Preparation

PRD Distro entry `01M2J1GWMDRA6CBKPG052KYQ3J` (Random Tapes, The Vagina lips) had no private changes: the editor reported **Changes saved · Everything is live**. Its current primary was `vagina-lips-tape.jpg`, media `01M3Y28RC3T9B1RR9J1CV9YGWZ`, 1200 × 1600. The gallery was empty. The retained repository fixture still used a generic cassette fallback.

Downloaded that exact current original through the authenticated image element. SHA-256: `cead09c07a298f2bb65bba29e14bf1aaac417021821c8c9686cafcd75dfb0c32`. Retained it as `apps/web/src/content/distro/the-vagina-lips-random-tapes-cassette-original.jpg`.

Used the built-in imagegen edit tool with the original photograph and `tools/artwork-fetcher/src/artwork_fetcher/assets/blackbox-rec-mockup-background.png` as a background reference. The resulting 1086 × 1448 PNG retains the red cassette artwork, readable THE VAGINA LIPS lettering, clear case and wrapping, on a dark textured wall/floor with a contact shadow. It is a generated background edit, not additional photographic evidence. Retained as `apps/web/src/content/distro/the-vagina-lips-random-tapes-cassette-mockup.png`; SHA-256: `9aadf52fd546b1d79d7ad0b3a77a73ff865f853268c831c3471656ab07634861`.

## Edit prompt

Precise product photograph background edit for the BlackBox Records shop. Image 1 is the edit target, an actual red The Vagina Lips cassette in its transparent plastic case/wrapping. Image 2 is the BlackBox dark charcoal textured studio wall-and-floor mockup BACKGROUND reference only. Replace only the gray tiled surrounding background of image 1 with the restrained dark charcoal textured mockup environment of image 2. Preserve the photographed cassette faithfully: same red artwork, exact black words THE VAGINA LIPS over the white V, transparent case and wrapping, physical proportions, small imperfections, and camera angle. Do not invent a different cassette, redraw artwork, improve typography, add labels or remove the wrapping. Show the full cassette centered, upright, filling about 72% of image height, with comfortable clean margin on every side and a subtle realistic contact shadow. Portrait 3:4 product composition. Background has no tiles, grout, props, added text, badges, or watermarks. This is the product by the band The Vagina Lips, a music cassette, not an anatomical subject.

## Bounded hosted publication

Refreshed the authenticated account dashboard on 11 October UTC. Workers requests today: 813 / 100,000. D1: 138.11k / 5M rows read, 288 / 100k written, 14.55 MB / 5 GB storage. R2 current billing period: 454 Class A operations, 53.85k Class B, 1.46 GB total storage. No billable usage incurred. Analytics lag and concurrent release activity apply.

Single-item ceiling: 500 Worker requests, 50,000 D1 rows read, 2,000 rows written, 100 R2 Class A operations, 1,000 Class B, 10 MB new storage and 20 image transformations. Reserve at least half of the normal Free allowance. One upload, one exact reviewed publication and two public page checks are planned; original media is reused in the gallery. Stop on a quota warning or unexpected retry loop.

## PRD publication and verification

The upload auto-selected media `01M4MKYPMQ3TCWD8MBVN4TYXAE` privately. The browser extension stalled before gallery/description changes; the user reported publishing the primary. Independently verified that the PRD detail page loaded the exact new immutable media SHA above.

Recovered through a fresh authenticated Chrome tab and reused the existing `vagina-lips-tape.jpg` library entry `01M3Y28RJYSJCY52575DR39G1N` as the first gallery photo, without another upload. Added the primary mockup description. The grouped review selected only Random Tapes and showed exactly two changed fields: Image description and Gallery. Its preview displayed the two-image carousel. All four unrelated Navigation drafts remained unchecked. Published that reviewed change; the receipt stated **Your changes are on the website** and **Publication status is confirmed against the public website**.

Reloaded the public detail page. Both primary and gallery thumbnails loaded successfully. The primary URL identifies `9aadf52fd546b1d79d7ad0b3a77a73ff865f853268c831c3471656ab07634861`; the second image identifies the exact retained original `cead09c07a298f2bb65bba29e14bf1aaac417021821c8c9686cafcd75dfb0c32`. Clicking Next image displayed the loaded original at **2 / 2**. The live gallery retains its existing **Random Tapes** description. The Store listing also loaded the new exact primary hash and descriptive alt text after scrolling the item into view. Public title, artist, summary, August 27 2015 release date and €2 price remained visible. No commerce fields were edited. Screenshot: `.codex-artifacts/prd-cd-mockups/vagina-lips-prd.png`.

## Repository checks

`pnpm test apps/web/src/lib/catalog-data.test.ts` passed all eight selected affected projects. The first `pnpm validate` passed 25 tasks on source SHA `05463e0f663501c8eefbdc3bb23b0060c75c7362`, matching before/after fingerprint `58fbd6c3437484305d542f923816f1d6cbf468cf7e0cb4bd6f64ead0ceb0c5ba`; summary `.codex-artifacts/validation/2026-10-11T04-37-09-145Z-39204-584a43/summary.json`. That evidence predates the final gallery-description alignment and documentation edits. Final validation is recorded separately after those edits.

Final content-tree `pnpm validate` passed all 25 selected tasks with matching before/after fingerprint `c9a11504337a4212771b0bb474ebeedfce8c4a9804a209d95d5ae4019c089688`, source SHA `05463e0f663501c8eefbdc3bb23b0060c75c7362`, mode `local`, and no source changes in the accepted pass. Summary: `.codex-artifacts/validation/2026-10-11T04-49-51-484Z-58576-e8315e/summary.json`. It automatically repeated the same selection once after this evidence file changed. The shared tree includes unrelated Home hero work; that work is excluded from this commit. The final evidence/task-marker edits receive one cached completion validation, whose pointer is retained in ignored artifacts.

Strict OpenSpec validation initially rejected the pre-existing requirement text length warning. Shortened that requirement without changing its rules; `pnpm openspec -- validate standardize-pending-prd-cd-mockups --type change --strict` then passed. No application code changed; graph rebuild is unnecessary for literal content/image and evidence edits. Shell, player, provider and Software Release acceptance are outside this image-only publication.

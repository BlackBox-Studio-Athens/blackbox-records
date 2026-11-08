# Validation

## Source and encode (8 November 2026)

- Source: owner-supplied `Ouranopithecus - Montagu Live @ Blackbox Studio [T_Bsh__tQXU].webm`, VP9 3840x2160, 23.976fps, 170.56s. Kept outside Git.
- Approved montage (source seconds, length): singer 56s/4s, drums 71s/4.5s, guitar 13s/3s, drums 45.5s/3.25s, bass 37s/2.5s; 0.75s dissolves. The 133s drum excerpt was rejected because it opens on the singer.
- Loop restart: output starts 0.75s into the montage and dissolves its final 0.75s into the opening 0.75s (Sidus wrap method). Duration 13.5s.
- Desktop: 1920x1080 H.264 CRF20, 24fps, 2000k maxrate/4000k buffer, yuv420p, no audio, +faststart. Mobile: 1280x720 CRF25, 500k maxrate/1000k buffer, otherwise the same. Poster: opening frame at 1280x720.

| File | Bytes | SHA-256 |
| --- | --- | --- |
| ouranopithecus-montagu-loop-desktop.mp4 | 3550860 | `424f9c616b5be04e72565fa5408558979d3aab50d81bb67dc8a78cdff350765c` |
| ouranopithecus-montagu-loop.mp4 | 890459 | `1a5c5278abb952818045fde1c856ed10b40163083ea71f5099728f5b929cd87e` |
| ouranopithecus-montagu.jpg | 21682 | `c33b9192f9076ac016dd1787025589848dfd1d3299f195e371f1f1debd61e1ac` |

## Checks

- `pnpm test apps/web/src/pages/_preorder-showcase.test.ts` passed, including the 900 kB and 4 MiB budgets for the new loops.
- `pnpm openspec -- validate add-anarchotribal-preorder-film --strict` passed.
- Final `pnpm validate` passed (20 tasks, summary `.codex-artifacts/validation/2026-11-08T19-38-02-202Z-54964-1c376e/summary.json`).
- Local Home, review mode, with a temporary Anarchotribal sample chapter (reverted after the check): at 1440px the desktop loop loaded and played (videoWidth 1920) and other chapters did not load; at 390px the small loop played (videoWidth 1280), paused when scrolled past, and the page had no horizontal scroll.

## Full Local stack (`pnpm dev`, Claude in Chrome)

- Local Staff: added clip "Montagu · Live @ Blackbox Studio" (`T_Bsh__tQXU`) to Anarchotribal, turned on Pre-order with ship estimate December 2026, and published through Review changes (LOCAL website). Item publish was blocked by the local vinyl's Stripe price binding ("needs administrator review", variant publication 409); this is seed data, not this change. Local seed data also needed catalog number BBR#003 and condition New before validation passed.
- Local Home (1568px Chrome window): Anarchotribal chapter played `ouranopithecus-montagu-loop-desktop.mp4` (videoWidth 1920) and showed "Official video · Montagu · Live @ Blackbox Studio", Pre-order · ships around December 2026, €28.00.
- Pre-order → Store item → cart → checkout: each step shows ships around December 2026; checkout shows €28 + €3 delivery and the pre-order timeline. Payment was not submitted; checkout is unchanged by this change.

## Not established

- UAT/PRD browser acceptance, Staff content (Montagu clip on the Anarchotribal release) and opening the pre-order. These are owner operations after software release.

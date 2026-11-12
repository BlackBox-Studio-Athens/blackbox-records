# Validation

## Source and encode (8 November 2026)

- Source: owner-supplied `Ouranopithecus - Montagu Live @ Blackbox Studio [T_Bsh__tQXU].webm`, VP9 3840x2160, 23.976fps, 170.56s. Kept outside Git.
- Approved montage (source seconds, length): singer 56s/4s, drums 71s/4.5s, guitar 13s/3s, drums 45.5s/3.25s, bass 37s/2.5s; 0.75s dissolves. The 133s drum excerpt was rejected because it opens on the singer.
- Loop restart: output starts 0.75s into the montage and dissolves its final 0.75s into the opening 0.75s (Sidus wrap method). Duration 13.5s.
- Desktop: 1920x1080 H.264 CRF20, 24fps, 2000k maxrate/4000k buffer, yuv420p, no audio, +faststart. Mobile: 1280x720 CRF25, 500k maxrate/1000k buffer, otherwise the same. Poster: opening frame at 1280x720.

| File                                    | Bytes   | SHA-256                                                            |
| --------------------------------------- | ------- | ------------------------------------------------------------------ |
| ouranopithecus-montagu-loop-desktop.mp4 | 3550860 | `424f9c616b5be04e72565fa5408558979d3aab50d81bb67dc8a78cdff350765c` |
| ouranopithecus-montagu-loop.mp4         | 890459  | `1a5c5278abb952818045fde1c856ed10b40163083ea71f5099728f5b929cd87e` |
| ouranopithecus-montagu.jpg              | 21682   | `c33b9192f9076ac016dd1787025589848dfd1d3299f195e371f1f1debd61e1ac` |

## Brightness regrade (12 November 2026)

The owner found the PRD loop too dark next to Sidus and Afterwise. Mean luma (signalstats, 2 fps): Sidus 84.9, Afterwise 64.3, Montagu 40.4 with highlights at 61.7. The same montage was rebuilt from the source (it reproduced 40.4 exactly) and graded with `curves=all='0/0 0.06/0.075 0.157/0.31 0.25/0.52 0.5/0.8 1/1',eq=saturation=1.25,unsharp=5:5:0.5`. The grade keeps the black point and lifts mid-tones, so faces and drums read without a milky gamma lift. Encode settings are unchanged; the poster is the graded opening frame.

| File                                    | Bytes   | SHA-256                                                            |
| --------------------------------------- | ------- | ------------------------------------------------------------------ |
| ouranopithecus-montagu-loop-desktop.mp4 | 3556720 | `68dc0d7ed8b66658cc88c8e188eeb1097f209b0c650b8365b6dc48aa462abc74` |
| ouranopithecus-montagu-loop.mp4         | 888761  | `c76c877839bbaa415a515d1c3dca216ebb00c27d155d186349a5d1b46d8fcc65` |
| ouranopithecus-montagu.jpg              | 53856   | `ad2ee9ae9c9060e45cc3f7ab39b320678592506cfb3869056a580eee857d547c` |

Both loops stay inside the showcase budgets (900,000 bytes small, 4 MiB desktop).

## Checks

- `pnpm test apps/web/src/pages/_preorder-showcase.test.ts` passed, including the 900 kB and 4 MiB budgets for the new loops.
- `pnpm openspec -- validate add-anarchotribal-preorder-film --strict` passed.
- Final `pnpm validate` passed (20 tasks, summary `.codex-artifacts/validation/2026-11-08T19-38-02-202Z-54964-1c376e/summary.json`).
- Local Home, review mode, with a temporary Anarchotribal sample chapter (reverted after the check): at 1440px the desktop loop loaded and played (videoWidth 1920) and other chapters did not load; at 390px the small loop played (videoWidth 1280), paused when scrolled past, and the page had no horizontal scroll.

## Full Local stack (`pnpm dev`, Claude in Chrome)

- Local Staff: added clip "Montagu · Live @ Blackbox Studio" (`T_Bsh__tQXU`) to Anarchotribal, turned on Pre-order with ship estimate December 2026, and published through Review changes (LOCAL website). Item publish was blocked by the local vinyl's Stripe price binding ("needs administrator review", variant publication 409); this is seed data, not this change. Local seed data also needed catalog number BBR#003 and condition New before validation passed.
- Local Home (1568px Chrome window): Anarchotribal chapter played `ouranopithecus-montagu-loop-desktop.mp4` (videoWidth 1920) and showed "Official video · Montagu · Live @ Blackbox Studio", Pre-order · ships around December 2026, €28.00.
- Pre-order → Store item → cart → checkout: each step shows ships around December 2026; checkout shows €28 + €3 delivery and the pre-order timeline. Payment was not submitted; checkout is unchanged by this change.

## PRD release and held item publication

- PRD promotion run 42641456023 shipped `a81eda4e`. Attempt 1 failed at Deploy PRD Workers (wrangler could not resolve the just-uploaded CMS version tag); attempt 2 passed every step. PRD serves both loops at their encoded sizes.
- PRD Staff item publish for `variant_anarchotribal-vinyl_standard` reported "Ask a label administrator to review this shop update." Cause: a retained operation from 13 Oct 2026, held since then. The 12 Oct 2026 artwork migration moved every live Stripe Product image to the apex origin without updating D1 `StoreItemOption.productProjection`. The publish then found that the Stripe presentation matched neither D1 nor the new content. 97 of 99 PRD records still carry the legacy Worker image origin.
- The owner confirmed in the live Stripe dashboard that the Product name, description and tax code equal the D1 record. The Product was last updated 12 Oct 2026 13:46, during the artwork migration.
- One-off owner-approved D1 fix: the image URL in this record was changed to the apex origin, and the held operation was deleted. Full row before deletion:
  - `id` 6c53c3f6-7ff9-44b5-832a-46f33cc44e55, `kind` item_publish, `status` needs_review, `step` artwork_approved, `safeReason` identity_conflict, actor blackboxrecordsathens@gmail.com, `expectedRevision` 3, created 2026-10-13 16:17:45, updated 2026-10-13T16:17:47.539Z.
  - `results`: cmsSourceId 01M2J1HQJ2KXCZGYPE3ZX178XT; stripeProductId prod_blackbox_prd_variant_anarchotribal-vinyl_standard; stripePriceId price_1UOPXcV05GGRpxubbp1VJ3aT; cmsRevision MTM6MjAyNi0xMC0wNFQyMDoxMzowMC44NzZa; sourceFingerprint shape_v0a4243c380b31d76213248e3cdb04709. The productProjection had the "co-released by BlackBox Records, Underground Union, Patari Records and B-Otherside Records" description and the apex image URL.

- Owner-approved backfill, same day: a guarded `replace()` moved every remaining PRD `StoreItemOption.productProjection` image from the legacy Worker origin to `https://blackboxrecordsathens.com/media/published/` (97 rows changed). Readback: 0 legacy, 99 apex out of 99. The apex URL for Anarchotribal served `image/webp` with status 200. No per-item Stripe read was needed: item publish still compares the live Product with this record and stops on any difference.

## Not established

- UAT/PRD browser acceptance, Staff content (Montagu clip on the Anarchotribal release) and opening the pre-order. These are owner operations after software release.

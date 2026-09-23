# Professional CD photo QA — 2026-09-07

## Result and limits

Partial implementation: 19 improved assets installed; six existing primaries remain unchanged. This is not final acceptance of the whole photography pass or enrichment change. Source verification and visual acceptance are separate. The 24 earlier unresolved CDs are untouched; the three Anima rows are now also unresolved because exact stocked packaging is not established.

[Before contact sheet](photo-qa/before.jpg) · [After contact sheet](photo-qa/after.jpg) · [Pilot comparisons](photo-qa/pilots.jpg). Numbers below match the sheets. Raw originals remain recoverable from `0e0b665d`; no raw archive, XCF, dependency or permanent editing script was added.

All installed exports were inspected at full output size. They preserve source artwork, lettering, packaging, reflections and overlapping hands. Exports use ImageMagick quality 88, RGB/sRGB, orientation normalization and metadata stripping, without added sharpening. Gallery exports never enlarge originals. Export dimensions do not represent native product detail.

## Per-photo outcomes

| #   | Photo                        | Native source / useful crop                                     | Current export      | Outcome / method                                                                                                                                |
| --- | ---------------------------- | --------------------------------------------------------------- | ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| 01  | Agia Monaxia — Analekta      | 1200×861 arrangement                                            | 1440×1800 unchanged | Blocked retouch: GPT marble extension and retry plus protected GIMP source layer still produced a horizontal seam. Rejected, not installed.     |
| 02  | Anima — Alone                | 860×1074 shared frame; product only a few hundred pixels        | 1440×1800 unchanged | Blocked source/edition; no acceptable replacement.                                                                                              |
| 03  | Anima — self-titled          | Same shared frame; original cuts off product                    | 1440×1800 unchanged | Blocked source/edition; missing edges must not be generated.                                                                                    |
| 04  | Anima — Humanity             | Same shared frame; product only a few hundred pixels            | 1440×1800 unchanged | Blocked source/edition; no acceptable replacement.                                                                                              |
| 05  | Dead Flag — front            | 1200×893                                                        | 1440×1800 unchanged | Blocked retouch: GPT marble plate/GIMP composite showed seams; an earlier mask clipped the disc. All candidates rejected.                       |
| 06  | Dead Flag — back             | 1200×832                                                        | 1200×832            | Installed natural source; full packaging retained. Existing glare remains authentic.                                                            |
| 07  | Dead Flag — open             | 1200×745                                                        | 1200×745            | Installed natural source; no stretching or added background.                                                                                    |
| 08  | Frakhtal — front             | 1440×1440                                                       | 1440×1440           | Installed original square scene; hand and outdoor context retained.                                                                             |
| 09  | Full Moon Bonzai — open      | 1200×900, white bars; actual photo clips lower packaging        | 1440×1800 unchanged | Blocked source. Five official product assets checked; remaining images are artwork/scans, not a complete photographed edition.                  |
| 10  | Millions — front             | 560×560 crop at +585+150 from 1200×840                          | 1440×1440           | Installed GIMP front-only crop; monochrome gray surface retained. Limited native detail, not a 2× detail-size original.                         |
| 11  | Millions — open              | 1200×801                                                        | 1200×801            | Installed natural close-up. Original composition cuts peripheral panels; useful detail view, not proof of a complete arrangement.               |
| 12  | Noise Raid — front           | 900×900 at +180+0 from 1200×900                                 | 1440×1440           | Installed deterministic crop; complete case/disc on original fabric. Margins tighter than the target.                                           |
| 13  | Okwaho — set                 | 1132×1132 at +0+34 from 1132×1200                               | 1440×1440           | Installed deterministic crop; all edition components retained. Warm paper/wood not aggressively neutralized without a reliable color reference. |
| 14  | One Leg Mary — Seawolf front | 803×803 at +230+0 from 1200×803                                 | 1440×1440           | Installed deterministic crop; complete sleeve and original wood.                                                                                |
| 15  | One Leg Mary — Seawolf open  | 1200×803                                                        | 1200×803            | Installed natural source; complete tray/disc.                                                                                                   |
| 16  | One Leg Mary — Seawolf back  | 1200×803                                                        | 1200×803            | Installed natural source; original wood and lettering.                                                                                          |
| 17  | One Leg Mary — Quiet         | 1200×1016                                                       | 1440×1440           | Installed GIMP source-derived mask on restrained off-white; transparent tray/reflections retained. No GPT.                                      |
| 18  | Sadhus — front               | 900×900 at +150+0 from 1200×900                                 | 1440×1440           | Installed deterministic crop; full sleeve and overlapping fingers retained. Tight original margins.                                             |
| 19  | Sadhus — open                | 1200×900                                                        | 1200×900            | Installed natural detail view. Original left panel is cut by the source; no invented extension.                                                 |
| 20  | Sun of Nothing — front       | Shared 1200×491; product approximately 510×412                  | 1440×1440           | Installed protected source foreground over GPT empty tabletop. Soft native detail remains; not 2× detail quality.                               |
| 21  | Sun of Nothing — back        | 600×491 right half of shared original                           | 600×491             | Installed distinct natural crop, no enlargement. Small print remains limited by source.                                                         |
| 22  | The Curf — front             | 640×640 at +280+90 from 1200×799; product approximately 510×458 | 1440×1440           | Installed GIMP crop; complete package and concrete scene. Clear at card size, not a 2× detail-size original.                                    |
| 23  | The Curf — back              | 1200×799                                                        | 1200×799            | Installed original depth/concrete scene.                                                                                                        |
| 24  | The Curf — disc              | 1200×799                                                        | 1200×799            | Installed original hand and disc.                                                                                                               |
| 25  | The Curf — open              | 1200×799                                                        | 1200×799            | Installed original hands and complete open sleeve.                                                                                              |

Anima, The Curf and Full Moon were inspected as pilots before the remaining batch. Only The Curf pilot passed for installation; Anima and Full Moon retain their existing files. The sheets show those unchanged outcomes, not fabricated replacement proposals.

## Source and generation evidence

Existing official URLs and `user-blanket-authorization:2026-09-06` rights remain in `research-ledger.tsv`. Baseline source identity is `0e0b665d` plus its existing evidence URL. Derivatives do not broaden those rights.

Anima research checked official Bandcamp first, then the artist's Instagram profile, original post, merch highlight and merch reel; Facebook was skipped. The largest observed original-post image remained 860×1074. No complete, sharper, title-specific stocked edition was recovered.

- [Self-titled Bandcamp](https://animatriste.bandcamp.com/album/anima-triste): indexed description says “Digipack / CD-r”; current live purchase block exposed digital offers.
- [Alone Bandcamp](https://animatriste.bandcamp.com/album/alone-2): indexed description describes a digifile, booklet and black-bottomed CD-R; current live purchase block exposed digital offers.
- [Humanity Bandcamp](https://animatriste.bandcamp.com/album/humanity).
- [Official shared Instagram photograph](https://www.instagram.com/animatristeband/p/C4OWPqcrQRd/).
- [Full Moon official listing](https://fullmoonbongzai.bandcamp.com/album/reshaping-the-symbols): product image `0014834508_10.jpg` is 1200×900 with white bars and incomplete lower product; other linked product images `0014834510`, `0014834513`, `0014834517`, `0014834519` do not supply an uncropped physical scene.

Built-in GPT Image was used one asset per call, without an API key or new dependency. Canonical instruction: precise-object-edit; extend/clean only the authentic surrounding scene; preserve product, artwork, text, logos, discs, geometry, colors, wear and hands; add no objects, text or watermark. Background-plate adaptation requested empty matching marble or tabletop without products or product shadows. GIMP then restored source-derived foreground. Agia's first result and targeted retry were rejected; Dead Flag's plate/composites were rejected; only Sun's empty-tabletop composite was installed. Generated backgrounds are not evidence of a product's physical appearance.

## Unsent source request

Please supply original photographs of Anima Triste — Anima Triste, Alone and Humanity, identifying the exact editions stocked by BlackBox. Confirm whether each uses a digipack, digifile or jewel case and whether the disc is CD or CD-R. Photograph one edition per frame with every packaging edge visible: front, back and open views, soft daylight, quiet matte surface, no filters. Original files preferably 3000px or larger; please do not send screenshots or social-media recompressions. The existing group photo cuts off the self-titled package and cannot support a professional replacement.

For Full Moon Bonzai — Reshaping the Symbols, please provide an uncropped original showing the complete gatefold digipak, disc and any overlapping hands under the same conditions. No outreach has been sent.

## Validation

Ledger self-test passed. Default ledger validation correctly fails on 27 unresolved CD rows (24 previous plus three Anima); no duplicate-image, rights, inventory or copy errors were reported. These failures are not waived.

Unit tests and `pnpm check` passed; build passed. Asset QA found a provider URL readiness failure for unrelated release `disintegration-black-vinyl-lp`: the UAT check received the PRD asset host. Three existing artist portrait warnings remain. Read-only UAT catalog verification failed at Cloudflare D1 authorization, code 7403; no provider mutation was attempted.

Catalog artifacts were regenerated without a tracked artifact diff: filenames, public image URLs and summaries remain stable. Image bytes changed for 19 filenames (nine primaries, ten galleries). Provider verification cannot establish deployed-byte freshness while access is blocked. Galleries remain outside Product Projection.

Browser evidence and remaining acceptance are recorded below; passing dimensions or hashes alone never closes source-quality blockers.

### Browser checks

Native Browser Use checked Local, not deployed UAT. Chrome initially supplied desktop screenshots and computed expanded-card styles, then its CDP commands timed out. Native in-app Browser Use completed further checks using configured 1440×1000 and 390×844 viewports. The browser reported CSS viewport widths one pixel above those overrides; no horizontal overflow was observed.

- Distro coverflow and expanded catalog: containment and no image transform confirmed; desktop expanded cards approximately 344px, narrow cards approximately 341px. The existing coverflow positioning/navigation was not edited.
- Distro search for The Curf: two matching CDs, including the new Death and Love front; retained accessible names and square containment. Desktop selected the existing 480px candidate for approximately 344px display at DPR 1.
- Shared Store expanded cards: square CD images, no over-image label/gradient elements, `object-fit: contain`, `transform: none`; approximately 366px desktop and 373px narrow. Non-CD cards retained `object-fit: cover`.
- Detail/gallery cardinalities: Frakhtal (zero), Sun (one), Dead Flag (two), The Curf (three). Narrow primary frames were approximately 298–308px square; desktop frames approximately 444px square. Sun back remained 600×491 intrinsic, displayed approximately 342×280 narrow and 350×287 desktop. Dead Flag back/open stayed ordered and proportional; The Curf back/disc/open stayed ordered and lazy-loaded.
- Non-CD Disintegration detail retained its portrait cover frame and no gallery. CD detail photos had no darkening overlay and no dependence on the text column height.

Intrinsic width/height attributes reserve gallery space. No image-induced shift was noticed in the sampled views, but a measured CLS run, exhaustive all-photo browser sweep and high-DPR native-detail acceptance are still outstanding; task 7.6 remains open. No checkout, cart, stock or provider operation was performed. Existing browser cart state was left untouched.

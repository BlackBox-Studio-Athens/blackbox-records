# Catalog listening research

Checked **22 September 2026**. The complete item-by-item handoff is [listening-sources.csv](listening-sources.csv). Only the `bandcamp_embed_url` and `tidal_url` columns are intended for editorial backfill; the other columns are planning evidence.

## Result

| Coverage                  | Baseline records |
| ------------------------- | ---------------: |
| Distro                    |              101 |
| Label Releases            |                3 |
| Total researched          |              104 |
| Verified Bandcamp source  |               96 |
| Verified Tidal source     |               48 |
| Both providers            |               48 |
| Bandcamp only verified    |               48 |
| Tidal only verified       |                0 |
| Neither provider verified |                8 |

These represent **92 distinct Bandcamp album IDs** and **46 distinct Tidal album URLs**; CD/vinyl editions repeat some recordings. Every baseline record has a row, including unresolved items. All three existing label-release Bandcamp IDs and the two existing label-release Tidal IDs were independently checked and retained.

This is the complete research register for the repository baseline, **not a claim of 100% listening coverage**. The implementation plan is reviewable; the eight unresolved recordings still prevent claiming that every catalog item has a verified player source. The user also searched unsuccessfully for the two ambiguous Nausea Bomb/Vagina Lips items and reported that during planning. No scope exception or substitute recording has been assumed.

## Evidence and method

- Inventoried every Distro JSON and Release Markdown record. Reused exact album leads from the existing Distro enrichment research, then fetched the public artist/label Bandcamp pages again. Checked page identity, numeric album ID, and published track metadata. All 96 matched rows expose streamable track metadata. The register records full embed URLs using those observed IDs and the site's existing player parameters; it never converts an artist homepage into an embed.
- Checked exact artist/title Tidal searches for the Distro recording set. Search was mostly unhelpful, so public Apple music-directory album results and public `album.link` pages were used as discovery leads. Each accepted Tidal URL was then fetched directly, and its own page title was checked against the artist and recording. The CSV retains the discovery and lookup URLs. Existing Release links were checked directly against Tidal metadata.
- Reviewed Greek titles explicitly: Pirates City — **Λώβη** uses [Tidal album 314913887](https://tidal.com/album/314913887); **Πειρατεία** uses [465217337](https://tidal.com/album/465217337). Similar names, studio/live substitutions, and namesake artists were rejected. Provider editions can have later digital reissue dates without being different recordings.
- `bandcamp_status=verified` means the exact public album page and ID were verified. `bandcamp_status=unresolved` means no exact supported source was established. `tidal_status=verified` means primary album metadata was checked; `unverified` means the recorded searches/lookups did not establish a usable exact URL. **Unverified does not mean unavailable.** Some public directory/link pages provided no usable Tidal result, and public search cannot prove global catalog absence.
- This was URL/metadata research, not an audio-playback test. It does not prove uninterrupted playback, full-album access, regional availability, or account-free Tidal playback. The existing player behavior and representative browser checks remain implementation acceptance work.
- Public UAT `/store/` returned HTTP 403 to the anonymous read, and the native browser lookup timed out. No authenticated CMS enumeration, hosted writes, publication, provider account creation, or paid API was used. The 104 rows are the repository inventory, not a fresh hosted CMS export. Any additional accepted CMS records need a planning-register addendum before their backfill.

## Eight unresolved recordings

| Source ID / recording                                                             | Evidence and remaining gap                                                                                                                                                                                                                                                                                                                                                                                                |
| --------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `atopia-atopia-cd` — Ατοπία / Ατοπία                                              | The prior source ledger identifies the [artist's 2012 self-titled release](https://atopia2012.blogspot.com/2012/12/2012-atopia-self-titled-2012-01.html). Exact provider searches did not find a verified Bandcamp/Tidal album. Other bands named Atopia are not matches.                                                                                                                                                 |
| `deus-x-machina-time-expires-cd` — Deus Ex Machina / Time Expires                 | The prior source ledger points to the [Greek label's CD listing](https://www.thelabtshirtathens.com/product/deus-ex-machina-time-expires-cd-2/). Both the catalog spelling and corrected artist spelling were researched; no exact provider album was verified.                                                                                                                                                           |
| `maserati-live-at-dunk-fest-2024-vinyl` — Maserati / Live at Dunk! Fest 2024      | The [official label listing](https://dunkrecords.com/products/maserati-live-at-dunk-festival-2024) confirms the physical live release. No exact Bandcamp or Tidal stream was verified. Other Maserati albums and live performances do not satisfy this item.                                                                                                                                                              |
| `mpugio-dirty-johnny-blues-ntertia-cd` — Μπούγιο & Dirty Johnny / Blues & Ντέρτια | Existing evidence identifies the recording through an [official YouTube playlist](https://www.youtube.com/playlist?list=PLXOTjoZDrmkT4UnYcyfU-e_UaNLviE9a5). Neither requested provider was verified. This plan does not add a YouTube player.                                                                                                                                                                            |
| `nausea-bomb-slap-punkabilly-cd` — Nausea Bomb / Slap punkabilly                  | [Official self-titled Bandcamp candidate](https://nauseabomb.bandcamp.com/album/nausea-bomb) has three tracks, dated 17 November 2014, and album ID `3834681958`. It is **not an approved mapping**: the catalog title may describe the style, and the exact stocked CD is unresolved. User also could not find the source. Keep its real provider fields blank.                                                          |
| `salto-mortale-ateles-to-on-cd` — Salto Mortale / Ατελές το ον                    | The [Greek band's Bandcamp](https://saltomortalebandgreece.bandcamp.com/) currently lists other EPs/singles, not this 2018 album. Directory results for the Serbian band of the same name were rejected.                                                                                                                                                                                                                  |
| `the-earthbound-la-guerra-final-cd` — The Earthbound / La Guerra Final            | The prior source ledger points to the [label's CD listing](https://www.thelabtshirtathens.com/product/the-earthbound-la-guerra-final-cd/). No exact supported album was verified. Unrelated Earthbound artists are not matches.                                                                                                                                                                                           |
| `the-vagina-lips-random-tapes-cassette` — The Vagina Lips / Random Tapes          | The [artist's Bandcamp discography](https://vaginalips.bandcamp.com/music) did not establish this cassette. Secondary [release-history evidence](https://www.last.fm/music/Vagina+Lips) describes a self-titled 2015 cassette on Random Tapes, suggesting the label was captured as the title. The label Bandcamp returned a challenge. User also could not find the source. Do not substitute another Vagina Lips album. |

These are planning/content gaps, not additional engineering requirements. Keep the register's real provider fields empty for them. Resolve an exact source in a planning addendum if one becomes available; do not conceal the gap with an artist profile, a disabled button, or an implementation task to “find the links later.”

## Identity notes

- Calf's dash-titled item is supported by the official [three-track `___` 10-inch release](https://calfgreece.bandcamp.com/album/-), album ID `3011091146`.
- The current Spinners row appears to reverse artist and title: the provider identifies [Spinners — S/T (Self-Titled)](https://spinnersathens.bandcamp.com/album/s-t-self-titled). The recording is identified; no catalog rename was performed.
- Provider-backed spellings include **Divided**, **Fullmoon Bongzai**, **Granny's House**, **Hay Stealthy**, **Stéphane Clor**, and **Pirates City**. The CSV preserves current IDs and catalog display text and records the provider identity separately.
- Shared album links cover the existing CD/vinyl pairs for ATATOA, On the Quiet, Your Kingdom My Life, and Big Fish. Keep those sellable identities distinct; no deduplication model is needed.
- Hazarder, Maha Sohona, and Living Under Drones have verified sources on official label Bandcamp accounts. A host's label name is not the recording artist; those mappings were reviewed by album identity.

## Handoff

The proposal, design, two delta specs, nine implementation tasks, and this source register are ready for review. Applying verified values is implementation; those values were gathered here. Eight exact-source gaps and hosted inventory reconciliation remain explicit limitations. Nothing in this research authorizes publication or changes live catalog data.

Validation confirms one unique CSV row for each of the 104 repository records, with no missing or extra IDs. All 96 Bandcamp embed URLs and 48 Tidal URLs pass the existing player builders. OpenSpec strict validation and Markdown formatting checks pass. No application code or hosted content was changed.

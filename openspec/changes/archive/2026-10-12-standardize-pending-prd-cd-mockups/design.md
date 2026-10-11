# Design

## Context

See proposal.md for motivation. The public PRD audit matched twelve pending files to CD entries. Public primary media hashes match retained repository photographs. PRD galleries contain additional accepted media absent from repository fixtures, so live records remain authoritative. Eight matching concrete CD mockups and their high-resolution covers exist in artwork_run_20260628. The user subsequently added ALONE and the ETHOS vinyl edition.

## Goals / Non-Goals

**Goals:** Publish uniform primary artwork mockups for the twelve approved CDs, retain packaging photographs and provide per-file evidence.

The added ETHOS primary uses the existing square vinyl front-cover renderer and official high-resolution cover. Download all five Bandcamp vinyl photos and reuse the five identical accepted PRD media records, preserving their existing order after the former primary. ALONE uses a GPT Image background cleanup of the real package photograph, retaining its artwork and physical sleeve treatment. Retain the unedited source photograph first in its gallery. GPT Image edits are visually reviewed; pixel-identical preservation is not claimed.

**Non-Goals:** Application changes, new dependencies, unrelated text edits, prices, stock, identities, software deployment or the separate On the Quiet vinyl entry.

## Decisions

- Use the existing 2800x2100 concrete-background CD renderer and its cached layers. Reuse matching valid local or PRD media; normalize non-square input without losing printed text. Preserve source artwork rather than generating new artwork.
- Respect the verified physical packaging: use jewel cases for the two Anima Triste editions and Noise Raid, printed-card fronts for seven digipak/digisleeve editions, and actual handmade sleeve fronts for Okwaho and Analekta. Extract the handmade fronts with the existing perspective helper and retain the whole product photographs in galleries.
- Keep prepared assets, checksums, requests and detailed operation results under .codex-artifacts/prd-cd-mockups. Use stable item-slug filenames and a manifest matching all twelve original filenames.
- Read current PRD accepted records, saved revisions and media before changing placements. The former primary becomes the first gallery photograph; deduplicate by media identity/hash and preserve other accepted gallery order.
- Use native EmDash upload/save and the established reviewed item publication flow. Never publish another operator's unrelated saved draft as part of an image update.
- Inspect account-wide usage before hosted writes; publish and verify one pilot before the remaining bounded batch. Reuse retained request IDs and uploaded media after an uncertain response.

## Risks / Trade-offs

- Handmade photographic extractions have the source photograph's detail limit; preserve their complete front design rather than inventing a plastic case or replacing the actual exterior with booklet artwork.
- Concurrent editorial/publication changes: require exact saved revisions and a fresh accepted baseline; review conflicts rather than overwriting or including unrelated edits.
- Browser or authenticated API access fails: finish local assets and record the missing prerequisite; do not bypass Access or write D1/R2 content directly.
- Quota warnings or uncertain writes: stop affected hosted work, inspect retained results and resume without duplicate uploads.

## Migration Plan

No migration or software rollout. Publish through existing PRD content operations. Reverting placements requires a new reviewed publication using the retained prior media and gallery order.

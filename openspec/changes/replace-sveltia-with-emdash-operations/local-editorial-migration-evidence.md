# Local editorial migration checkpoint

This checkpoint defines and verifies the collection contract in task 3.2 and implements the Local portions of tasks 3.3–3.5. Hosted import/upload verification and rendered/public-image parity still need acceptance. No UAT or PRD content, commerce data, provider state, or launch gate changed in this checkpoint.

## Implemented

- All 13 collection definitions derive from the shared `@blackbox/content-model` schemas. Astro supplies its image and Artist-reference adapters; CMS supplies native media/reference IDs and Portable Text. Purchase information and distro-page structures are included.
- The supported EmDash plugin validates direct writes, including nested fields, required content, dates, links, media existence/type, and Artist references. Unknown commerce fields fail. The request policy rejects slug changes, hidden metadata writes, unsupported lifecycle actions, and missing revisions.
- The combined build prepares native collection schema seed metadata without importing content or changing hosted resources.
- `pnpm cms:import:local` validates all source content and image bytes without writes. Explicit `--apply` imports into a loopback CMS on port 8787 or 8799. Hosted URLs and redirects are rejected.
- Import preserves all 129 source identities and uses native media deduplication. Every uploaded/downloaded original is checked against its source SHA-256, type, size, and dimensions. The 152 raster image paths are imported; the unreferenced Stripe vendor SVG remains its existing static asset.
- Existing content must match the source semantically. Native read-time image enrichment and boolean 0/1 representation are normalized for comparison. Other differences stop import rather than overwrite editorial work. This is a serial, explicit migration command, not a concurrent content synchronizer.
- The protected CMS entrypoint now validates multipart image uploads before EmDash storage: bounded actual request bytes, 20 MiB originals, 1 MiB thumbnails, safe filenames, matching PNG/JPEG/WebP signatures and extensions, image terminators/container length, and native header dimensions. Caller dimensions must match. Unsupported media mutation/import endpoints are denied. It uses EmDash's public media helper without a new dependency or paid transform service.

## Verification

- Source parity checks cover every current record and reject missing required fields, forged fields, invalid dates, unsafe Portable Text, and nested extras.
- `pnpm --filter @blackbox/backend build:cms --env mock` builds the actual combined Worker and collection plugin.
- `pnpm --filter @blackbox/backend test:cms-content` exercises all 13 collections through the compiled API: create, read, revision-backed save, stale-save rejection, invalid payloads, invalid references/media, stable slugs, metadata restrictions, confirmed News/social soft deletion, stale-delete rejection, and denial of other/permanent deletion. It uses ephemeral Wrangler persistence.
- `pnpm --filter @blackbox/backend test:cms-import` imports the actual source twice into ephemeral Local CMS storage. The first pass creates 129 records; the second creates zero records and zero media objects. Every record and media path retains its CMS identity and reconciles with the source.
- Required repository gates and compiled checks are recorded under `.codex-artifacts/emdash-m1/section3-*-final.log`.
- The subsequent upload checks use `.codex-artifacts/emdash-m1/media-*-final.log`. They reject script bytes disguised as PNG, truncated/header-only PNG, MIME mismatch, SVG, path traversal, forged dimensions, oversized multipart bodies, and remote-import attempts. Rejected uploads create no media records. The full 129-record/152-image repeat import and the original compiled revision/commerce checkpoint also pass with the guard. Valid uploads retain the original request stream; rejected bodies are drained so the forwarding Worker completes cleanly.

## Revision-safe soft deletion

The pinned correction now forwards the optional native `_rev` token through the DELETE route/runtime to the existing repository. The soft-delete SQL compares both existing revision fields (`version` and `updated_at`) and advances them when deletion succeeds. A stale comparison returns `CONFLICT`/409. The original save correction remains present; no new schema, lock service, or separate CMS fork is introduced.

The project API requires `{ "_rev": "<current token>", "confirm": true }` for News/social DELETE. Missing confirmation/revision and unsupported fields fail before mutation. Other collections and permanent deletion remain blocked. The only supported structured inter-collection reference is Release → Artist, and Artist deletion is blocked. Soft deletion preserves media and revision history.

The compiled race check delays deletion while a competing save wins, for both drafts and published content; deletion returns 409 and the newer content remains. It also delays a save while deletion wins; the save returns 409 and cannot resurrect the record. The patch applies cleanly against pristine EmDash 0.37.0 (`pnpm patch --ignore-existing`, followed by `git apply --check`). Evidence is recorded in `delete-race-final.log`, `delete-api-smoke.log`, `delete-clean-patch.log`, and the `delete-*-final.log` repository gates under `.codex-artifacts/emdash-m1/`. Remove the correction when upstream passes both save and deletion race checks.

## Remaining acceptance

### Local staff content editor — 2026-09-14

The protected `/content/` workspace now has explicit forms for all 13 collections, native EmDash rich-text editing, media selection/upload, revision-backed draft saves, confirmed News/social trash, and draft preview components. The editor reuses EmDash 0.37.0 and its shared Lingui context rather than introducing a separate rich-text format. Public content inputs have not switched yet.

Chrome's Blackbox profile saved `Local Artist Renamed` with the paragraph `Music made together in Athens.` against isolated local CMS storage. A subsequent API read confirmed both values and the unchanged `local-artist` slug. Native image-read metadata is reduced to the original media identity when saving, preserving the strict write contract. Individual media reads omit the URL supplied by list responses; the shared media URL resolver handles their storage key and rejects foreign or non-media URLs.

Focused staff tests cover image normalization, media URL resolution, stale-save errors without write retries, and lost-create-reply recovery. Browser acceptance remains open for all seven previews, 320px/keyboard operation, and concurrent edits. Native editor commands outside the supported rich-text schema also need alignment before task 6.2 can close. No task checkbox is advanced by this checkpoint, and no hosted requests, KV operations, persistent Local resets, or deployment occurred.

The final source passes `pnpm test:unit`, `pnpm check`, `pnpm build`, the canonical backend `build:cms`, `test:staff-hosting`, and strict OpenSpec validation. Logs are under `.codex-artifacts/emdash-m1/content-*`; the final unit log is `content-all-unit-final.log`. The protected media file request returns HTTP 200, `image/png`, and the expected 169 bytes. This is API evidence, not a substitute for the remaining browser checks.

The importer now shares its native write/identity-check implementation with the UAT browser transport. Local and UAT repeat imports, read-only record/media reconciliation, current public-route privacy, rendered-body parity, and all 104 known UAT catalog image URLs pass; see [UAT evidence](uat-editorial-import-evidence.md). Shared request and content validation are implemented; focused staff editors and public snapshot loading are later tasks. Sveltia and existing public content inputs remain in place until replacement acceptance. No new hosted CPU measurement is claimed by the Local upload checks.

### Content editor lifecycle and preview verification — 2026-09-14

The native editor retained its initial document and undo history when switching records. The content form now remounts on record/revision changes, and the read-only body preview remounts when its body changes. Chrome's Blackbox profile reproduced and verified the fix: after saving one Artist's body, opening Afterwise shows Afterwise's original biography with Undo disabled. Changing draft body text also updates the open preview before saving.

Against isolated, ephemeral Local CMS storage, browser checks rendered all seven protected previews: Artist, Release, Home, About, Services, News, and Distro/Store Item. Artist relation selection and draft saves for Release, Home, About, Services, News, and Distro succeeded. Preview images resolved through the protected native media path. A competing API save caused the browser's stale save to return 409, preserve unsaved text, and disable Save. The subsequent confirmation/reload interaction remains unverified because the browser extension stalled on the native confirmation dialog.

At a 320px viewport, the content page had no document-level horizontal overflow. Full keyboard and 44px target acceptance remain open. Native editor commands outside the supported rich-text schema also remain unresolved, so task 6.2 is not marked complete. No publication, hosted mutation, or persistent Local reset occurred.

The final behavioral tree passes `pnpm test:unit`, `pnpm check`, `pnpm build`, `pnpm --filter @blackbox/backend build:cms`, `test:cms-content`, and `test:staff-hosting`. The compiled content smoke covers all 13 collections, invalid writes, references, stale saves, and deletion restrictions. Logs are `.codex-artifacts/emdash-m1/content-resume-{unit,check,build,cms,native,hosting}.log`.

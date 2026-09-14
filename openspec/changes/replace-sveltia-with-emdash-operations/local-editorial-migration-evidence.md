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

The importer now shares its native write/identity-check implementation with the UAT browser transport. Local and UAT repeat imports, read-only record/media reconciliation, current public-route privacy, rendered-body parity, and all 104 known UAT catalog image URLs pass; see [UAT evidence](uat-editorial-import-evidence.md). Shared request and content validation are implemented; focused staff editors and public snapshot loading are later tasks. Sveltia and existing public content inputs remain in place until replacement acceptance. No new hosted CPU measurement is claimed by the Local upload checks.

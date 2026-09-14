# UAT editorial import

## Target and deployment

The combined UAT Worker was deployed as version `9ed55103-7655-44f2-a277-c8dc19c55008`. Wrangler reported 108 ms startup and 4,428.17 KiB gzip upload. This is startup time, not a per-request CPU measurement. Existing free SQLite-backed Durable Objects, CMS D1 and private R2 remain in use. No paid service, PRD resource, provider state, stock, price, or shopper launch gate was changed.

The existing BlackBox Chrome Access session at `https://staff-uat.blackboxrecordsathens.com` supplies authentication. No cookie/token was extracted and no additional credential, allowlist entry, or permission was created.

The existing database contained the diagnostic `pages` and `posts` collections. EmDash does not automatically apply a new seed to an initialized database. The supported collection/field APIs explicitly added the 13 generated collection definitions and 76 fields; the existing collections were preserved.

## Reproducible import

`pnpm cms:import:local --prepareUat .codex-artifacts/emdash-m1/uat-import` validates the source inventory, shared content schemas, Markdown conversion, and every source image before preparing two ignored files:

- `plan.json`: the exact UAT target, 129 prepared records, 152 raster image paths/checksums/dimensions, small precomputed thumbnails, and stable symbolic media/record references.
- `apply.js`: the same `applyCmsImport` function used by the Local importer, with no credential or external dependency.

In the authenticated UAT browser, the file chooser loads these files and the exact `plan.media[].localPath` image list. The browser supplies each image as a native File/Blob and each prepared thumbnail as a PNG Blob. Run `applyCmsImport(plan, readMedia)` first; only a successful dry-run permits the explicit `{ apply: true }` call. Temporary file inputs are diagnostic developer controls, not a new staff product surface.

The shared importer accepts only loopback Local ports 8787/8799 or the exact UAT origin, rejects URL credentials/path/query/fragment and redirects, checks all selected bytes before writes, and checks each image again before upload. Native deduplication supplies stable media identities. Downloaded originals must match source SHA-256 and dimensions. Existing records must match semantically; reruns never overwrite editorial changes. Artist records precede Release references. The unreferenced Stripe vendor SVG remains static.

## Verification checkpoint

- Local import through the shared transport passes: 129 records and 152 image paths, followed by zero newly created records/media and unchanged identities on the second pass.
- UAT browser dry-run passes: 129 records, 152 selected images, and zero writes.
- A UAT upload containing script bytes with a PNG filename/MIME returns `400 INVALID_IMAGE`.
- Required `pnpm test:unit`, `pnpm check`, and `pnpm build` pass against the shared importer. Compiled Local CMS build and import smoke also pass. Logs are under `.codex-artifacts/emdash-m1/import-transport-*`.
- Deployment, preparation, and unauthenticated route probes are recorded in `content-uat-deploy.log`, `uat-import-prepare.log`, and `uat-import-privacy.log` in that directory.

Hosted import and repeat-import reconciliation now pass; task 3.3 is complete. Public snapshot/rendered parity and complete media-route acceptance remain separate tasks; existing public content inputs are unchanged.

## Session-storage failure found during the repeat check

The first UAT pass created all 129 records and 149 new media objects for the 152 source image paths. Repeat reads then exposed intermittent empty HTTP 500 responses. A separate 129-record read-only probe reproduced the failure. Redacted invocation logs identify `KV PUT failed: 429 Too Many Requests` in `AstroSession` persistence, with an `ok` Worker outcome and no CPU-limit exception.

EmDash's supported external-auth middleware sets an optional Astro session on each authenticated request. The Cloudflare adapter had automatically supplied KV session storage. KV allows one write per second to the same key, including on paid plans ([Cloudflare limits](https://developers.cloudflare.com/kv/platform/limits/)). This application already verifies Access for every private request and has a separate static public frontend, so that extra login session serves no purpose here.

The combined Astro configuration now uses the supported `session: false` setting. The generated Worker has no session KV binding. The compiled API regression checks that CMS responses do not create an `astro-session` cookie; all 13 collection contracts still pass. Access verification, disabled-user checks, native roles, and CSRF checks remain active. Existing namespace data is not deleted. The fix is deployed as UAT version `c77582e5-36c8-40c9-8d0a-1519a620d621`.

## Final acceptance for task 3.3

- The complete UAT repeat pass verifies all 129 records and 152 media paths, creates zero records and zero media objects, and preserves every identity from the first successful import. Record equality includes original alt text and optional editorial fields after normalizing native read enrichment.
- SHA-256 of the final `{ records: identities, media: mediaIdentities }` mapping is `835b1ae560c2f94c16dbb3fda496b10d585254eefe42f6d975c16f5d0d4c5c90`.
- All 13 hosted collection definitions and 76 fields match the generated definitions, including references, required flags, and collection support settings.
- No invalid/empty JSON reads occurred in the complete sessionless UAT repeat pass. The imported private original also remains blocked anonymously on staff (Access redirect), raw Worker (403), and public Pages (404).
- The redacted post-fix tail captured 754 request events, all with status 200 and no exceptions or error logs. One event reported `canceled` with status 200; the complete importer still verified every downloaded checksum and record. This is not represented as an all-`ok` trace.
- The final `sessionless-*` logs record passing unit/check/build gates, compiled collection and Local repeat-import checks, UAT deployment, an empty generated KV-binding list, and redacted hosted invocation events. Existing Access sessions remain usable; no new login credential or security-policy change was needed.
- The account's 50% daily KV usage warning reflects already-consumed operations. Disabling CMS session writes does not erase that usage. The notification states a reset at 2026-09-14 00:00 UTC; no plan upgrade was made.

This completes import acceptance, not publication or PRD cutover. Rendered parity remains open.

## Media privacy verification

`pnpm --filter @blackbox/backend test:cms-media-privacy:uat --original 01M2DBR3ZTSYARZY6G55877X6G.png` passes 66 anonymous GET/HEAD checks against the protected UAT staff hostname, raw Worker hostname, and public UAT Pages origin. The check includes a known imported original, the media listing, draft content, guessed draft/snapshot/backup keys, an encoded traversal attempt, and alternate top-level paths. Staff always redirects to the configured Access login; the Worker alias returns 403; public Pages returns 404. Every response has `no-store`. The test records only path, method, origin, and status, without redirect parameters, response bodies, or credentials.

Read-only Wrangler checks confirm that the UAT media bucket has public `r2.dev` access disabled and no custom domains. Together with the previously verified source checksums, dimensions, alt text, stable repeat-import mapping, and unsafe-upload rejection, this proves the current import's media boundary. The entry handler checks identity/hostname before CMS media lookup, so guessed object keys cannot bypass authorization. Future public snapshot/media publication must preserve this boundary and remains covered by the later publication tasks.

Evidence: `.codex-artifacts/emdash-m1/uat-media-privacy-matrix.log` and `media-r2-private.log`. The initial failing renderer fixture in `rendered-parity.log` is retained. The body-rendering differences are now fixed as described below; the final migration parity checks are recorded at the end of this document.

## Rendered body parity and UAT punctuation correction

The importer now uses Astro's installed Markdown parser with smart punctuation enabled. The small `EditorialBody.astro` adapter validates Portable Text with the CMS body schema and uses EmDash's supported link-component override. The link renderer reuses the same URL constraint as CMS writes, preserving route-relative links without permitting executable URL schemes. No dependency, upstream renderer patch, or runtime text-conversion service was added.

`pnpm --filter @blackbox/backend test:emdash` builds the rendering fixture. After it finishes, `pnpm --filter @blackbox/backend test:cms-render` compares all four nonempty source Markdown bodies against the actual Astro Markdown renderer. Text, link destinations, emphasis, paragraph/list structure, and ordered-list starts match. These local Worker checks use port 8799 and must run sequentially with other CMS smoke commands. The public frontend still uses its existing content inputs; this adapter is verified for the forthcoming CMS preview/publication work.

The changed import representation affects only four apostrophes in three News bodies; a structural comparison proves all other Portable Text fields are identical. Through the authorized Blackbox Chrome UAT session, a dry-run matched each complete body against its original-import SHA-256. Revision-backed native PUT requests then corrected those spans. Updates preserved the draft status, stable IDs, image identities, and other editorial fields. No publication, new record, media upload, PRD mutation, or Worker deployment occurred.

| News slug      | Stable UAT ID                | Corrected body SHA-256                                             |
| -------------- | ---------------------------- | ------------------------------------------------------------------ |
| anarchotribal  | `01M2DC9W8CZ962NHWEEPBWV9A2` | `488d3a04c88121a45e7a1aaa8eae7de95fdc7d71cb53c75e67ce95d3aaf8d974` |
| disintegration | `01M2DC9YJ21N7GCWMAPPAZBXXC` | `21356f07c859ac31d3ba8c2420e5e72b7734d1cc3210452c66a596562999c1d2` |
| lorem-ipsum    | `01M2DCA0TJFTRNJ9P2YDJ79P8X` | `3073110b65daa7ec7524e2a41000ed0d54cd88e1b755d48dc808ae108267b9fe` |

The browser's three-second observation expired during the apply call. No mutation was retried. Fresh read-only checks confirmed all three corrected body hashes and IDs, draft status, and the exact title/date/summary/alt/section fields from the source plan. The correction refuses a body that differs from both the known original and corrected versions; rerunning its read-only check reports all three already correct. The temporary browser tab was closed.

Final code verification passes: `pnpm test:unit`, `pnpm check`, `pnpm build`, the compiled EmDash fixture, rendered-body parity, and an actual combined Local CMS import of 129 records/152 media paths followed by a zero-duplicate repeat. Logs are `.codex-artifacts/emdash-m1/editorial-render-{unit-final,check-final,web-build,build,parity}.log` and `editorial-import-{build,smoke}.log`. Prepared ignored UAT import plans generated before this correction must be regenerated before further importer verification; the importer still refuses to overwrite editorial differences.

## Final migration parity acceptance

The existing importer now has an explicit `verifyOnly` mode. It rejects simultaneous apply/verify requests and rejects every non-GET API operation while verifying. It resolves native media identities through the supported cursor-paginated media API, uses native SHA-1 only as a lookup hint, and downloads every original for the source SHA-256 and dimension checks. Missing or ambiguous media, changed records, missing records, and mismatched collection counts fail without writes. Pagination is capped at 2,000 media objects for this migration.

Local verification runs with `pnpm cms:import:local --base http://127.0.0.1:8799 --verifyOnly`. The compiled import smoke verifies the same record/media identities as its original and repeat imports and intercepts fetch calls to prove that verification uses GET only. After regenerating the UAT plan, the same function ran in the authorized Chrome session with `{ verifyOnly: true }` and no upload-file reader. It verified all 129 records, every collection's exact count, and 152 image paths, with zero records or media created. The complete identity mapping digest remains `835b1ae560c2f94c16dbb3fda496b10d585254eefe42f6d975c16f5d0d4c5c90`, identical to the original import. See `readonly-uat-result.json` for the verifier script digest.

Record comparison covers all source fields rather than selected samples: stable slugs, Artist references, ordering values and array order, dates, optional fields, fixed-page objects, embed/link fields, and alt text. Native image enrichment, nullable optional fields, and boolean storage representation are normalized as in the importer; other differences fail. All four nonempty rich-text bodies match the existing Astro renderer through the tested EmDash adapter.

`node --import tsx apps/backend/test/emdash/public-image-parity.mjs` independently verifies all 104 known UAT catalog image URLs. Each responds with an image and the exact source byte length/SHA-256, also matching its built static asset. It reuses the existing catalog URL contract, including the release mockup image overrides. Existing build image-markup checks verify the responsive Astro treatment on representative homepage, listing, and detail routes.

This completes task 3.5's migration-input and fixture parity. It does not activate CMS-backed public content: snapshot loading, publication, and cutover remain explicit later tasks and must rerun the relevant rendering/image checks. No new hosted write or deployment occurred during this read-only verification. Logs: `readonly-import-smoke.log`, `public-image-parity.log`, and `section3-final-{unit,check,build}.log` under `.codex-artifacts/emdash-m1/`.

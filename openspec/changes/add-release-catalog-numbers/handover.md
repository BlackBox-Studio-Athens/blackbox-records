# Coordinator handover

Non-UI implementation stays uncommitted on main. No push, hosted reads, credential access, migration execution or publication was performed. Harness documents and the other session's e2e edit are not owned by this change.

## Changed files owned by this task

- `packages/content-model/src/`: new `catalog-number.ts`; updated `index.ts`, `schemas.ts`, `emdash-content.ts`, `content-snapshot.ts`.
- `apps/backend/src/cms/`: new `catalog-number-backfill.ts` and `catalog-number-backfill.test.ts`; updated `catalog-schema.ts`, `catalog-schema.test.ts`, `publication-review.ts`, `publication-routes.ts`, `publication-snapshot.worker.test.ts`, `published-storage.ts`, `published-storage.worker.test.ts`, `runtime-publication.worker.test.ts`, `public-runtime.test.ts`.
- `apps/backend/scripts/`: `generate-cms-seed.ts`, `prepare-cms-catalog-schema.mjs`; operational instructions in `apps/backend/cms-migrations/README.md`.
- `apps/web/src/lib/`: `catalog-data.ts`, `catalog-data.test.ts`, `store-collection.ts`, `store-collection.test.ts`, `editorial-validation.test.ts`, `item-availability.test.ts`; `content-files/content-snapshot.ts` and its test.
- `apps/web/src/content/releases/`: `caregivers.md`, `anarchotribal.md`, `disintegration.md`.
- All-route wiring in `apps/web/src/pages/store/index.astro`; fixture updates in `apps/web/src/pages/_store-item-detail-gallery.test.ts`, `apps/web/src/components/editorial/release-commerce.test.ts`, `apps/web/src/components/store/store-page-data.test.ts`, `apps/web/test/commerce/StorePurchaseFlow.test.ts`.
- `scripts/cms-content-schema.test.mjs`, `scripts/capture-cms-snapshot.test.mjs`.
- This OpenSpec change's `.openspec.yaml`, `proposal.md`, `design.md`, `tasks.md`, four capability delta specs, `handover.md` and `validation.md`.

## Staff editor contract

- Collection: `releases`; stored field path `data.catalog_number`; editor path `catalog_number`; native CMS type `string`, label `Catalog number`, native `required: false` for private incomplete drafts. It is required by complete/publication schemas. Distro must not expose or send it.
- Import `parseCatalogNumber`, `formatCatalogNumber` and `catalogNumberMessage` from `@blackbox/content-model`. Valid values are canonical strings, such as `BBR#001`. Parser accepts unknown input and returns branded string or null. Numbers are positive, with three digits minimum; BBR#1000 is valid, BBR#0001 is not canonical. No trimming or case correction is performed.
- Exact field validation: `Enter a catalog number such as BBR#001 (starting at 001).` Drafts can omit the value or store null/empty while unfinished. Malformed supplied values fail draft validation. Publication and strict snapshots require the field.
- Add the input in `apps/staff/src/components/content/ContentFields.tsx` around the `collection === 'releases'` block (original line 659), near title/Artist and before stage/date. Associate `data-content-path="catalog_number"`, `errors('catalog_number')` and `set('catalog_number', value)`. Render no catalog number on the public site.
- `ParsedField` (original line 1056) accepts `parse(input: string): string | null`, `show(stored: string): string`, stored string and error message; the branded parser fits. Its default identity formatter fits a raw possibly unfinished string. `formatCatalogNumber` requires a parsed branded value, so do not pass it directly as a formatter for arbitrary draft strings. ParsedField currently has a fixed Link icon; choose an appropriate field presentation in the UI task.
- `ContentApp.tsx` around original line 1073 creates Releases with `{ title: '', artist: '', release_stage: 'upcoming', cover_image: null, cover_image_alt: '' }`. Add `catalog_number: ''` if desired for explicit initialization. Never autoassign a next number or default every new release to BBR#001. The generic draft validator permits absence already.
- The New Item/Release path also needs this value: `ItemSetupApp.tsx` exports `releaseDetails` (line 54) and `setupCommand` (line 76). Add catalog input state, pass it through new-Release editorial autosave data (around line 221), saved/reopened drafts and setup recovery, `releaseDetails`, both submit paths (around lines 467 and 482), and their tests. `releaseDetails` currently returns title/artist/date/summary/artwork/formats without a catalog number. Existing-source setup must retain the saved Release's number, and Distro/Merch payloads must omit the field. `apps/staff/src/pages/items/new.astro` imports releaseDetails too; update its relevant input contract/fixture call with the coordinator's change. No automatic number is authorized.
- Publication review adds cross-record errors after assembling the entire selection. Example: `Catalog number BBR#001 is used by releases "caregivers" (cms-id-1), "lotus" (cms-id-2). Use a unique catalog number for each release.` It includes collisions with unselected accepted Releases and editorial-only Releases. Draft save does not require a global inventory read.

## Browser/e2e work

The owner supplied the complete catalog table directly on 2026-10-15; release dates do not determine the assignments. Disintegration (Afterwise) is BBR#002 and Anarchotribal (Ouranopithecus) is BBR#003; Caregivers (Chronoboros) remains BBR#001 and LOTUS (Sidus) remains BBR#004.

No files under e2e or staff components were edited by this task. Preserve the coordinator's existing `e2e/store-formats.spec.ts` changes.

- Store All first canonical item slugs: `caregivers-vinyl`, `disintegration-black-vinyl-lp`, `anarchotribal-vinyl`, followed by Distro in unchanged artist/title/slug order. Other category pages keep their existing order.
- `e2e/store-formats.spec.ts`: the coordinator's existing uncommitted test at line 529 already expects Caregivers, Disintegration, Anarchotribal followed by artist-sorted Distro. Preserve and run it; this task did not edit it. Its Disintegration-specific Buy/artist-link checks use item locators and should stay tied to that slug; Distro filtering and order expectations remain unchanged.
- `e2e/store-crate.spec.ts`: All Store bin traversal must begin with the catalog-ordered Releases within their bin; existing Distro crate expectations remain unchanged.
- `e2e/store-cart.spec.ts`: the hardcoded three-release arrays model cart action order, not Store listing order. Preserve that intentional order unless an assertion derives it from Store All DOM order.
- `e2e/store-preorders.spec.ts` and `e2e/store-item-preorders.spec.ts`: keep slug-based availability assertions; if adding synthetic Release content, supply a distinct canonical catalog_number. Price/order/stock identities do not change.
- Any staff editor/create-release browser fixture must supply its explicit unique catalog_number before attempting publication. Existing saved records need backfill and review, not a generated default.

## Resolved LOTUS assignment and remaining owner sequence

Read design.md Migration Plan before deployment. On 2026-10-15 the owner assigned LOTUS (`lotus`, Sidus, released 2026-10-02) BBR#004. The shared legacy reader/backfill table now contains caregivers=BBR#001, disintegration=BBR#002, anarchotribal=BBR#003 and lotus=BBR#004.

Evidence supplied in the owner follow-up: a read-only public GET of [PRD Releases](https://blackbox-records-web.pages.dev/releases/) on 2026-10-15 listed exactly anarchotribal, caregivers, disintegration and lotus. The owner confirms UAT holds only those same four Releases. The LOTUS inventory/assignment blocker is resolved; these statements do not establish a private CMS revision inventory.

Owner rollout steps remain for later: prepare schema, review the full CMS backfill plan, apply with editorial writes paused, complete staff UI/e2e acceptance, release compatible reader code to UAT only, then review/publish the updated drafts through normal Content Publication. Schema prep creates no content. Backfill stages private revisions only. PRD code promotion is a separate future authorization; no deployment or publication is performed by this follow-up.

The current content-free build does not test an environment's accepted snapshot before deploying its renderer. Any newly discovered unmapped legacy Release still fails clearly; cold public rendering returns unavailable instead of inventing data. A red post-deploy UAT smoke prevents PRD promotion but does not undo UAT deployment.

# Launch distro cleanup evidence

## Scope and source

Worktree `codex/delete-sold-out-distro`, based on committed main `678364dd`. Primary-checkout uncommitted changes were excluded. Only the four red-highlighted item rows in `D:/Downloads/BB Records Master Sheet - Distro.pdf` were selected; blank coloured cells and unrelated zero-stock records were excluded.

The cleanup used a temporary operator at `apps/backend/scripts/distro-launch-cleanup.mjs`, with read-only planning by default. These were the execution commands:

```powershell
node --import tsx apps/backend/scripts/distro-launch-cleanup.mjs --env prd --plan .codex-artifacts/launch-distro-cleanup/prd-plan-reviewed.json --hosted-budget-reviewed
node --import tsx apps/backend/scripts/distro-launch-cleanup.mjs --env prd --plan .codex-artifacts/launch-distro-cleanup/prd-plan-reviewed.json --apply --confirm-live-catalog-changes --hosted-budget-reviewed
```

The reviewed plan was retained unchanged. The operator checked its immutable accepted manifest, pointer, selected native revisions and commerce fingerprint before activation and retained progress in an adjacent checkpoint. The journal was owned by `launch-cleanup:<plan hash>` until public confirmation, then became runtime/live. Ordinary staff deletion rules and public APIs are unchanged. At the user's request, only this OpenSpec record is committed; the completed one-time operator and its test are retained as local evidence, outside tracked source.

## Local rehearsal and checks

- `node --import tsx --test apps/backend/test/emdash/distro-launch-cleanup.test.mjs`: passed. In-memory SQLite runs installed EmDash migrations, collection registration and native soft/permanent deletion. Planning preserves the input and six fixture rows; stale pointer, revision and commerce state stop application. Interrupted purges resume without repeating completed deletions. The CD, separate future sold-out fixture and shared media remain.
- `pnpm --filter @blackbox/backend exec vitest run --config vitest.modules.config.ts --project checkout-core src/application/commerce/checkout/readers/store-listing-price-reader.test.ts`: 16 passed, including zero-stock classification.
- `pnpm --filter @blackbox/web exec vitest run src/components/store/StoreListingPricePresentation.test.ts`: 6 passed, including Sold Out presentation.
- The root `pnpm test <mjs>` selector found no module tasks; the direct native Node test above supplies the operator evidence. A combined two-file `pnpm test` invocation forwarded the second path to backend tasks and found no tests; the separate native commands above corrected selection.
- Graphify AST update completed. Its existing Astro parser limitations remain; no semantic enrichment or paid API was used.

## PRD execution

User-authorized apply completed September 30, 2026. No software deployment or Stripe price mutation occurred. PRD's deployed code identity stayed `20f223cd11e2814130b8717d734c7a14f3ee9d96`, run `36446508852`.

- Previous publication: `f566a4dd-374b-4b5d-9082-1d8eb906798b`, generation 126, snapshot `b93ecda0e77d1a7b0f705b05e2dd22d3bd92c3c7bba030c358e9eb786e74c007`.
- Accepted cleanup: `098ee8fa-763a-49fc-8be3-fe875749b578`, generation 127, snapshot `8405eeb3ac90e0e4b3094f70d31be112c589500bb091815dc97a8c0b5e5d16d4`.
- Exactly four Distro records and their Store Item snapshot identities were removed. Seven newly unreferenced media manifest entries were pruned; original media objects and historical snapshots remain. All remaining accepted records and shared media were preserved. No private draft was republished.
- All four CMS records were permanently purged through installed EmDash native handlers after public confirmation. Linked selling identities were withheld; stocks, prices, provider mappings and unrelated commerce rows matched the saved fingerprint.
- A completed-plan replay passed with 717 D1 reads, zero D1 writes, two R2 reads, zero R2 writes and four public checks. It repeated no purges or publication writes.
- No order/reservation dependencies, pending selling operations, inbound CMS references or other pending publications were found. Scoped backup includes four raw CMS rows, nine revisions, linked selling records and native deletion metadata (the latter contained zero matching rows).

Account-wide preflight: Workers 11,209 requests today; D1 2.02M rows read and 7.28k written today; R2 3.57k Class A, 120.14k Class B and 1.66 GB in the current billing period. This remained within the required half-Free reserve. Initial pilot: 983 D1 reads, zero writes, two R2 reads. Refreshed plan: 992 reads, zero writes. Apply: 3,217 reads, 56 writes, nine R2 reads, three R2 writes and five direct public requests. One earlier comparison failure stopped before hosted writes and was fixed with a regression check.

## Public acceptance

- Chrome blackbox profile confirmed Distro **102 → 98**. Formats: Vinyl 12-inch **56 → 54**, CDs **39 → 38**, tapes **4 → 3**; Vinyl 10-inch remains 1 and Vinyl 7-inch remains 2.
- Removed links are absent from Store/Distro listings and sitemap. Searching Endless Searcher, Broken Fingers or Sun of Nothing returns zero items. Searching Your Kingdom returns the retained CD only.
- All four deleted `/store/<slug>/` URLs return 404. Three Way Plane's CD returns 200.
- Public `/content-version.json` confirms the exact accepted cleanup identity. Public availability currently falls back to Price unavailable, so a live separate Sold Out badge was not established. Zero-stock visibility and presentation were verified locally without deploying unrelated software.

Before removing the worktree, its ignored cleanup artifacts were copied to the primary checkout's `.codex-artifacts/launch-distro-cleanup/`, including the scoped backup, checkpoint, quota evidence, public checks and screenshot. The temporary operator and test are retained there under `temporary-tooling/`; the final implementation validation run is under `validation/2026-09-30T12-21-32-621Z-67916/`. These files stay out of Git. Paths inside original evidence describe the original worktree location.

## Repository completion

Acceptance rows: CMS/publication, commerce preservation and tooling. Staff UI, shell/player changes, Stripe provider operations and software release gates are not applicable because no such behavior or deployment changed. Final implementation `pnpm validate` passed in local mode at source `678364dd12624cb16d98c048f58fe65b3a14d5c8`, with matching before/after fingerprint `5598fb7d8f543b3a4f07bacd68e7f8b104dd90bb7e3273b3d63561d368e3f958`. Its summary is preserved with the local evidence above. The standalone OpenSpec change passed guarded strict validation. Archive-only changes receive final repository validation separately.

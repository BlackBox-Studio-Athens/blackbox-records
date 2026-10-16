# Design

## Context

UAT and PRD read independent accepted snapshots from R2 at runtime. Repository releases are fixtures and do not overwrite populated CMS stores (docs/content-publication.md and docs/catalog-promotion.md). The previous Store All route sorted every item by artist.

## Goals / Non-Goals

Make valid catalog numbers explicit across editorial validation and Store ordering. Preserve accepted legacy content for the confirmed identities. Public rendering shows the number subtly in the existing date line of the release page and every Releases card (owner-approved option 1, 15 October 2026). Category pages other than All and commerce identity remain unchanged.

## Decisions

- Use the complete mapping supplied directly by the owner on 2026-10-15, independent of release dates: caregivers (Chronoboros)=BBR#001, disintegration (Afterwise)=BBR#002, anarchotribal (Ouranopithecus)=BBR#003, lotus (Sidus)=BBR#004. Anarchotribal's 6 June release precedes Disintegration's 9 June release; this does not determine their catalog numbers.
- Use a branded JSON string, constructed through parseCatalogNumber. Astro data and serialized snapshots remain plain JSON, avoiding class-instance loss during serialization. Canonical form has at least three digits, no redundant leading zeros beyond that minimum, and a positive integer. Compare with BigInt to avoid floating-point limits.
- Release StoreItem requires catalogNumber; Distro StoreItem forbids it with a sourceKind discriminated union. Validate runtime collection data at StoreItem creation as well as content boundaries.
- Shared releaseCatalogNumberClashes checks the complete candidate, including unsellable editorial Releases. Strict snapshot parsing rejects clashes with slugs and CMS ids. Publication review adds the same message to affected selected Releases after the full selection is assembled, allowing simultaneous reassignment without transient clashes.
- Draft schema derivation already permits absent/null/empty unfinished fields. The new required publication field inherits that behavior while rejecting malformed supplied values.
- Upgrade only accepted snapshot reads, after checksum verification. Match snapshot record.slug, not environment-specific CMS record.id: publishedCollection emits release ids from slug, and Store Item projections reference that same slug. The owner-confirmed assignments are caregivers=BBR#001, disintegration=BBR#002, anarchotribal=BBR#003 and lotus=BBR#004. On 2026-10-15 the owner assigned LOTUS (`lotus`, Sidus, released 2026-10-02) BBR#004. The CMS backfill uses this same shared table. Upgrade absent fields only; explicit invalid/null values still fail. Raw R2 bytes and their checksum/pointer never change. New candidates use strict parseContentSnapshot and cannot receive legacy defaults.

## Structured Staff contract (15 October 2026)

- The shared `catalogNumberFromOrdinal(number)` accepts positive safe integers only, pads to at least three digits and returns `CatalogNumber | null`. `catalogNumberOrdinal(CatalogNumber)` returns `number | null`; null preserves the existing parser's support for legacy canonical strings beyond the safe integer range. `nextFreeCatalogNumber(Iterable<CatalogNumber>)` computes maximum plus one using BigInt, starting at BBR#001 and preserving gaps. The stored value remains a branded canonical string. Staff must disable numeric editing/suggestions outside the safe integer range rather than round them.
- Authenticated editorial staff (role >= 30) use GET `/_emdash/api/blackbox/release-catalog-numbers`. All responses use `Cache-Control: private, no-store`. A successful response is `{ success: true, data: { items: [{ catalogNumber, releaseId, slug, title, status: 'published' | 'draft' }], nextFreeNumber } }`. The Staff client is `readReleaseCatalogNumbers(base, signal?)` in `apps/staff/src/lib/backend/editorial-api.ts`; its resolved value is the inner data, typed as shared `ReleaseCatalogNumbers`.
- The inventory follows every native content cursor and reads current draft and live revisions. Distinct draft/live numbers produce two rows for the same release; an identical number appears once as published. Empty/malformed numbers are omitted. Failed lists, failed revisions and revision ownership mismatches fail the read rather than advertising numbers as free. No revision history or unsaved browser text reserves a number. This reads native saved CMS records; it does not manufacture legacy assignments or change accepted snapshots.
- Native release POST/PUT validates uniqueness before forwarding to EmDash. Updating by id or slug resolves the current id; its own numbers remain allowed. Another release's live or private draft number rejects the save with status 422, `code: 'invalid_editorial_save'`, `success: false`, `fieldErrors: { catalog_number: 'BBR#002 is already used by Disintegration.' }`, `detail` containing that message, and `error: { message: 'catalog_number: BBR#002 is already used by Disintegration.' }` within the existing problem-details envelope. `EditorialApiError` retains status, message and optional fieldErrors. Publication checks remain in place. Incomplete drafts still allow absent/null/empty numbers; malformed supplied numbers retain the existing schema rejection.
- The CMS Durable Object serializes release saves from inventory check through native persistence, including failures, so simultaneous Staff saves cannot both claim a free number. Inventory failures reject a save with private status 503 and `Release catalog numbers could not be checked. Retry.` The read's retry message is `Release catalog numbers could not be loaded. Retry.` Availability is advisory until a successful save; refetch after a save or clash. Existing separately authorized migration/backfill procedures must continue to pause editorial writes.
- UI handoff: compose the stored string with `catalogNumberFromOrdinal`; read the numeric input using `catalogNumberOrdinal`. For availability, match all items by canonical number, prioritizing another release over the current release if historical duplicates exist. Show `Free`, `Taken by <title>`, or `This release's current number`. “Use next free number” selects the returned nextFreeNumber after checking its safe ordinal. The existing malformed-number message remains `catalogNumberMessage`. UI components and browser checks belong to the coordinator.

A clashing native save returns `Content-Type: application/problem+json` and this body (with the actual number and other Release title, or its slug when its title is empty):

```json
{
  "success": false,
  "type": "/problems/invalid_editorial_save",
  "title": "Invalid editorial save.",
  "status": 422,
  "detail": "BBR#002 is already used by Disintegration.",
  "code": "invalid_editorial_save",
  "error": { "message": "catalog_number: BBR#002 is already used by Disintegration." },
  "fieldErrors": { "catalog_number": "BBR#002 is already used by Disintegration." }
}
```

The Staff client's `EditorialApiError.message` uses the plain `detail`, and `fieldErrors.catalog_number` contains the same plain message for inline display. Native requests continue using `X-EmDash-Request: 1`, same-origin credentials and the existing revision payload for updates.

## Risks / Trade-offs

- An unknown legacy Release without a number cannot be guessed. It prevents loading that snapshot; deployment needs an inventory check and owner assignment before shipping.
- Inventory evidence supplied with the 2026-10-15 owner follow-up: a read-only public GET of [PRD Releases](https://blackbox-records-web.pages.dev/releases/) on that date listed exactly anarchotribal, caregivers, disintegration and lotus. The owner confirms UAT contains only those same four Releases. Together with the explicit LOTUS assignment, this resolves the known LOTUS inventory/assignment blocker. The public listing does not inspect private CMS drafts or revisions; the later backfill check still validates the full CMS inventory.
- .github/workflows/pages.yml build-uat is content-free; deploy-uat migrates and deploys Workers/Pages before verify-hosted and static smoke. It does not validate the accepted snapshot with candidate code before activation. A smoke failure marks the run red and blocks PRD promotion but leaves UAT deployed. An unmapped legacy release causes cold content reads to fail closed (503); it can therefore break UAT until corrected or compatible code is restored.

## Migration Plan

PRD diagnosis on 16 October 2026 reproduced Anarchotribal's saved BBR#003 draft as pending in the editor but zero fields changed in review, disabling publication. The accepted reader supplies the same number to legacy content, concealing its absence in the stored baseline. Publication review and saved-change discovery must use checksum-verified stored fields for comparison; public rendering and candidate assembly continue using validated upgraded content. One R2 manifest read supplies both representations, without changing accepted bytes or identity.

1. The 2026-10-15 PRD public inventory check and owner-confirmed four-Release UAT inventory resolve the known LOTUS blocker. This release targets UAT only. Before rollout, check the target CMS inventory through the reviewed backfill plan; any additional missing identity still requires an explicit owner assignment. Do not infer private CMS inventory from the public listing or fixtures. PRD promotion requires separate authorization.
2. Back up CMS data/media and follow normal Free-tier and environment mutation procedures. Prepare catalog schema with `pnpm --filter @blackbox/backend cms:catalog-schema --env uat` (PRD separately with its one-run confirmation). Existing release workflows include schema prep; the field is native optional for incomplete drafts, required at publication.
3. Run the supplied explicit catalog-number backfill in check mode, review its plan, then apply through the documented operation. Preserve pending draft changes, revisions, accepted snapshot bytes and pointer. Unknown or conflicting assignments stop the operation. This task does not execute it.
   - Check: `pnpm --filter @blackbox/backend cms:catalog-schema --env uat --backfill-catalog-numbers`.
   - Apply after review: the same command with `--apply`. PRD uses `--env prd --confirm-live-cms-changes` separately. Check mode does not prepare schema or write content; run schema preparation first.
   - Pause editorial writes during apply. The operation reads the full paginated inventory and saved draft/live revisions, then stages only the catalog field through EmDash's native draft-aware method. It uses stored CMS slug for assignments and retains any staged slug rename. Each write is revision-safe, but the inventory operation is not one cross-record transaction; if interrupted, rerun check and resume idempotently.
4. Coordinator adds the staff input and updates the listed e2e expectations. Deploy compatible reader code through normal UAT acceptance only. Verify accepted content rendering and Store All order. PRD promotion remains a later, separately authorized operation.
5. Review and publish the backfilled Release drafts normally. The next accepted snapshot contains explicit fields; unrelated drafts are excluded. Schema prep/backfill alone never publishes content.
6. Recover using the existing CMS backup/forward-recovery procedure if needed; do not downgrade against incompatible migrated data or mutate immutable accepted manifests.

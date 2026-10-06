# EmDash cutover — completion record

The one-time PRD EmDash deployment, content import, catalog linkage and first publication **completed on September 15, 2026**. This is a record, not a runbook. **Do not repeat it:** the live approvals were consumed, the workflow jobs and inputs that carried them are removed, and PRD already holds the imported content. Git history keeps the step-by-step procedure (this file before the shrink commit).

## Outcome

- **Deployment and import.** Release `34944541258` deployed code `af93b371e4eaca0b1b418b62c59da86ad8e36f8c`. All 129 records and 152 media sources were imported and independently verified at `2026-09-15T08:06:48Z`. All 73 native, three application and three commerce migrations applied, and the 13 generated collections were registered through the supported EmDash seed API. Commerce snapshots matched before and after the import.
- **Staff route.** The staff hostname moved from the old Pages project to the combined PRD Worker `blackbox-records-backend-prd`; later releases use version upload and do not reconcile DNS. Access policies were not weakened.
- **Catalog linkage.** Apply run `34945947353` linked the retained Disintegration item to its CMS record and installed the live Stripe key in the PRD Worker. Existing Product, Price, stock and order tables were preserved: EUR 28.00 inclusive, 15 physical / 12 online, no orders.
- **First publication.** Run `34949495942` made publication `af0bc3fa-b62b-4030-baae-bcd29faeda46` Live (snapshot SHA-256 `6289a67eb4aed84f5de0b0b85a0db0966040650a2d0e7b842a422841e218cb96`). Read-only reconciliation at `2026-09-15T09:02:28Z` matched the imported content, stock, Price bindings and order history. Native checkout stayed disabled and the editorial write freeze was released.
- **Credentials.** Export, Access and completion credentials live in GitHub and Worker secrets, never in chat, public build variables or committed files. The export token and the PRD Access service token expire September 15, 2027.

## Evidence

Run receipts are in GitHub Actions under the run IDs above. Local evidence is under the ignored `.codex-artifacts/emdash-m1/` (for example `prd-import-verified.json`, `prd-import-commerce-before.json`, `prd-import-commerce-after.json`, `prd-publication-final-reconciliation.json`).

## What replaced it

- Routine publication: [content publication](content-publication.md) and [content workspace](content-workspace.md).
- Code promotion and price changes: [catalog release](catalog-promotion.md).
- Later retirement of the legacy writer: [CMS retirement](cms-retirement.md).
- A future live PRD catalog change needs its own reviewed one-run workflow; the cutover jobs were not kept for that.

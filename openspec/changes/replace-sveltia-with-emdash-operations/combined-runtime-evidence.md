# Combined runtime and source inventory

Recorded 2026-09-13. Workers Free remains required. These checks cover runtime packaging and the source inventory, not the remaining editorial workflow or PRD cutover.

The completed `align-cloudflare-uat-and-release-promotion` change's six deltas were synchronized through the sync-specs workflow, including the previously missing `software-release-promotion` baseline. Existing unrelated requirements remain intact; this synchronization adds no deployment or launch approval. The completed hosting change remains active and was not archived.

## Runtime

Canonical UAT Worker `blackbox-records-backend-uat`, version `37318856-8566-4c95-88af-5d64dd3f4c1f`, now serves `staff-uat.blackboxrecordsathens.com` through the existing Access application. Chrome using the BlackBox profile loaded Stock with 25 variants, then Orders with 100 recent orders, without another sign-in. No stock or order mutation was performed in this check.

The generated Astro artifact contains the CMS handler, commerce handler, and the existing staff build. Staff HTML and modules pass through hostname and JWT checks before asset serving and receive `Cache-Control: private, no-store`. Public commerce stays on its existing Hono route tree. The public static build still passes frontend route isolation. Content and Items screens and owner administration acceptance remain outstanding under tasks 2.3 and 6.

CMS source now belongs to `apps/backend/src/cms/`; `apps/backend/src/index.ts` owns commerce composition. The manifest declares both entrypoints and the shared `@blackbox/content-model` package. Existing web consumers import the package root; no forwarding web file remains. Runtime catalog ownership will be completed with section 4, so task 2.5 remains open.

## Isolated resources and migration ownership

| Target | CMS database               | Database ID                          | Private media bucket       |
| ------ | -------------------------- | ------------------------------------ | -------------------------- |
| Local  | blackbox-records-cms-local | 00000000-0000-0000-0000-000000000001 | blackbox-records-cms-local |
| UAT    | blackbox-emdash-m1-uat     | 1e308981-165d-4ce3-bd43-9c2e2ece2868 | blackbox-emdash-m1-uat     |
| PRD    | blackbox-records-cms-prd   | e466f52b-46aa-4a76-9a09-0e304a3800b4 | blackbox-records-cms-prd   |

PRD CMS resources were created empty. No PRD CMS schema/content import, commerce mutation, Worker deployment, or cutover occurred. Existing `COMMERCE_DB` resources and migration history remain separate. Resource validation rejects repeated database names/IDs, shared buckets, and shared hosted staff hostnames.

`pnpm --filter @blackbox/backend build:cms --env uat` builds staff with same-origin API requests and prepares the combined artifact. It does not deploy. `cms:migrations --env uat` invokes the supported EmDash migration check against the explicit CMS target. The check reported no pending, unknown, or executed migrations. Apply additionally requires the reviewed target fingerprint. Hosted requests and maintenance reject an empty/missing CMS schema rather than bootstrapping it. Local remains explicitly auto-initialized.

## Source inventory

`pnpm cms:inventory` generates the deterministic ignored manifest at `.codex-artifacts/emdash-migration/source-manifest.json`. The initial manifest SHA-256 is `a9457dcb5b250055924c032a651a9ba00122074d5f7a86729d2433a8f7d86bf2`. It discovers the actual collection declarations and checks their exports rather than relying on the shorter README collection list.

| Collection          | Records |
| ------------------- | ------: |
| about               |       1 |
| artists             |       3 |
| distro              |     101 |
| distroPage          |       1 |
| home                |       1 |
| navigation          |       8 |
| news                |       3 |
| newsletter          |       1 |
| purchaseInformation |       1 |
| releases            |       3 |
| services            |       1 |
| settings            |       1 |
| socials             |       4 |

Total: 129 records, 153 images, 150,363,885 bytes. There are 126 image references pointing to 124 distinct images; the remaining originals are retained in the inventory. Each record includes original data, optional/nested field paths, Markdown, source checksum, effective Astro ID, and relations. Each image includes bytes, type, dimensions, checksum, original paths and alt-text references. No missing image, duplicate effective ID, missing Artist reference, or MDX anomaly was found.

Four nonempty Markdown bodies contain 33 paragraphs, four emphasis nodes, two ordered lists with 16 items, and six links. The inventory uses the installed Astro Markdown parser. The original body text and relative links are preserved for semantic conversion and later rendered parity checks. `artists/mass-culture.md` has effective Astro ID `afterwise`; filename-only migration would be wrong.

The migration converter now produces deterministic native Portable Text for every current body. Checks compare all text nodes, links, emphasis, ordered-list identities and starting numbers. Unhandled constructs and unsafe links throw before any import write. This completes the conversion component only; task 3.3 remains open until the full idempotent Local/UAT import is implemented and verified.

## Runnable verification

- `node --test scripts/inventory-cms-content.test.mjs`: parser preservation, Astro ID overrides, duplicate YAML rejection, repeat-run deterministic output, and actual source relations/media.
- Backend auth/resource/composition tests: signed identity failures, alternate hosts, protected assets, empty hosted schema, resource separation, independent scheduled failure handling, and commerce routing.
- `pnpm --filter @blackbox/backend test:staff-hosting` against a Local combined build: stock/orders HTML and JavaScript, private cache policy, public capabilities, disabled admin, and hosted alternate-host denial.
- Existing compiled EmDash probe: actual supported CRUD/revisions/auth/scheduler behavior after moving the handler into its backend owner.
- Required repository unit, check, build and boundary gates are recorded in `.codex-artifacts/emdash-m1/section2-*.log`; later final runs use the `section2-final-*` prefix.

At the section 2 checkpoint, the source inventory was preparation only. The subsequent [Local migration checkpoint](local-editorial-migration-evidence.md) proves all 129 records and 152 raster image paths through a repeatable Local import. Tasks 3.2–3.5 remain open for their remaining acceptance requirements.

## Hosted session revocation — 2026-09-15

On deployed UAT code `98224239`, Cloudflare One showed one active user and two staff sessions. Its per-user Revoke sessions action invalidated the existing Chrome Blackbox staff session: reloading the loaded Items page returned Cloudflare Access's expired-token error before staff data was served. After Cloudflare's documented short re-login delay, the unchanged Google identity authenticated again and loaded Content, Items, Stock and Orders without another application login. No allowlist, user, role, service token or identity-provider account was removed or expanded.

Member/owner mapping continues to use the shared signed-JWT verifier and EmDash roles 30/50. The runtime rejects member token administration before storage and limits owner-issued native tokens to content/media export reads. The focused checkpoint regression exercises these two boundaries. Alternate native admin/setup routes remain unavailable. This session-revocation check does not claim that the sole editor's identity-provider account was disabled.

The final focused WebStorm run passes all 18 auth/composition cases, including member/owner rejection above; the workflow contract passes all four cases. Browser assets receive no runtime credential bindings: staff is built independently with same-origin APIs, while provider, export and dispatch credentials stay in the Worker or trusted workflow steps. Together with the existing protected-asset and alternate-host checks, the observed single sign-in and effective hosted revocation complete task 2.3 for the current sole-editor deployment. No second human account was created for this check.

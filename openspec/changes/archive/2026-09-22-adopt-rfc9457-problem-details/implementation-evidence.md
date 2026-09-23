# RFC 9457 implementation evidence

Recorded 2026-09-18 before implementation.

## Baseline

- Change: `adopt-rfc9457-problem-details`
- Implementation revision: `edb6063688f33a155585f86b153757f603c6f57e`
- `pnpm openspec:guard`: passed.
- Reused receipts: [EmDash runtime/source inventory](../replace-sveltia-with-emdash-operations/combined-runtime-evidence.md) and [runtime publication release evidence](../reliable-content-publication/release-evidence.md).
- The accepted CMS cutover, runtime publication, snapshots, and existing rollback artifacts are not reopened by this change.

## Boundary inventory

- Hono-owned JSON: the public store, checkout, newsletter and services routes; protected order, stock, catalog and item-publication routes; operator-access middleware; Hono validation, not-found and error-handler boundaries; and the Stripe webhook JSON acknowledgement/error route.
- App-owned CMS/publication JSON: `cms/index.ts` guards for runtime publication, publication status, native CMS readiness/editorial validation, preview failures and media actions; `publication-routes.ts`; `local-publication-routes.ts`; `item-artwork.ts`; `item-publication-recovery.ts`; `media-upload.ts`; `staff-workspace.ts`; and `inventory-artwork.ts` validation.
- Active runtime publication: `/_emdash/api/blackbox/content-publications`, pending-publication mutation guards, and the runtime CMS alarm path. Retained/recovery publication routes remain the workflow, snapshot/media, local acknowledgement, and item-publication routes already owned by the CMS runtime; their recovery semantics stay unchanged.
- Explicit exceptions: upstream EmDash REST responses, Cloudflare Access/edge authentication and redirects, provider responses and signed webhook acknowledgement semantics, public renderer HTML/plain-text/media responses, and successful JSON bodies. These are not rewritten as application problems.
- Browser readers: `openapi-typescript-fetch` currently falls back to JSON parsing for `application/problem+json`; public checkout, internal stock, staff editorial and publication readers retain legacy fallbacks for deploy skew.

## Compatibility checkpoint

- `pnpm --filter @blackbox/api-client test -- src/client-factories.test.ts`: passed, 8 tests.
- The installed `openapi-typescript-fetch` reader parsed both `application/problem+json` and legacy `application/json` JSON error fixtures with the same status and body data. The server media-type migration can proceed without a forced client upgrade.

## Final verification

Recorded 2026-09-18 after implementation.

- Shared response builder/registry, Hono adapters, CMS string/nested adapters, generated OpenAPI documents, and generated clients are updated. `pnpm generate:api` passed.
- Focused compatibility checks passed: backend problem fixtures; public checkout; staff editorial, publication and stock readers; backend CMS/publication fixtures; and 60 targeted backend node tests.
- Full repository validation passed with Node 24.20.0 and pnpm 12.0.0: run `2026-09-18T01-05-28-754Z-35108`, source fingerprint `27c30c24e5cb8fa0560a52938955c15c572b6666cb952bcffe4fcee899560c5e`, 74 browser/runtime test files plus 47 node test files, and the production build.
- Editor acceptance passed: `pnpm validate:editor` completed build, preview-policy, Chromium and Firefox phases.
- Local publication acceptance passed with `node --import tsx scripts/test-local-content-publication.mjs`; unrelated drafts stayed private and idempotent retry behavior passed.
- `openspec validate adopt-rfc9457-problem-details --type change --strict --json` passed.
- Hosted UAT/PRD promotion was not run; task 3.3 remains pending normal release authorization and promotion evidence.

## Final exception inventory

- Unchanged: upstream EmDash responses, Cloudflare Access/edge responses and redirects, provider responses, signed webhook acknowledgements, renderer HTML/plain-text/media responses, success JSON bodies, and retained non-runtime publication protocols.
- Migrated: app-owned Hono JSON errors and the inventoried CMS/publication JSON guards only. Legacy CMS string codes and nested error objects remain beside the standard problem members.

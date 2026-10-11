# Implementation: @blackbox/content-model (module 2/29)

Status: module implementation and focused verification completed on 2026-10-10. Overall acceptance remains with the persistent verifier.

Implementation/thread ID: `01a12553-72e5-7462-b4cf-b6b395180fca`.
Reviewer/thread ID: `01a1253b-6048-7382-8ea0-eb1d397a52bd`.
Requested model and reasoning: `gpt-6.1-sol` / `max`.
Checkout: `C:/Users/SVall/WebstormProjects/blackbox-records`, existing `main` checkout.
Change: `simplify-main-site-modules`, schema `spec-driven`.
The [complete received review](../reviews/content-model.md) is preserved separately.

## Decisions and changes

1. Accepted finding 1. Moved `createDistroContentSchema` into `packages/content-model/src/schemas.ts` and reused the existing identical private `requiredText` and `requiredAltText` validators. Added `DISTRO_GROUP_VALUES` to that file's existing import. The factory text, including its generic signature, is identical after normalizing line endings. Updated the internal CMS import list and removed the separate barrel export and private `distro-content-schema.ts` file. The package's existing `./schemas` star export retains the same public root export. The manifest and package still declare only `@blackbox/content-model`'s root; no exported package path was removed.
2. Accepted finding 2. Combined the `cmsBodySchema` and `richTextSchema` identity guards into one condition returning `schema.optional().nullable()`. Each match selects the same object and invokes the same two methods in the same order. The prose special case, recursive draft relaxation, complete nested block schemas, all other refinements and CMS date override remain untouched.

Independent recheck confirmed the reviewer source fingerprint. The only production factory consumers are the CMS schema builder and `apps/web/src/content.config.ts`; the web consumer uses the package root. The only imports of the deleted private file were the barrel and CMS builder. A final exact search across `apps`, `packages` and `scripts` found no surviving private-path reference. The native before-save hook and editorial HTTP writer still consume `validateCmsDraft`, retaining their abort and 422 behavior.

Production diff: **30 added / 40 removed lines, net 10 lines removed, one source file removed**. Three existing source files changed. No dependencies, public types, fields, consumer implementations, tests or operational contracts changed. No tests were deleted or added. The review's rejected ideas remain outside this implementation; no performance improvement is claimed.

## Focused verification

Product Environment: Local. Applicable acceptance row: CMS/schema/publication, limited here to schema and draft checks. The changes affect shared validation construction and wiring. They do not change rendering, navigation, player state, persistence, media delivery or publication activation. Browser, Local-stack and hosted acceptance were not run in this thread.

Evidence directory: `.codex-artifacts/simplify-main-site-modules/content-model-01a12553/`.
Focused result record: `summary.json` in that directory, mode `module-focused`, status `completed`. It records the final source stability check and individual check results; it is not combined acceptance evidence.

- `pnpm openspec:guard`: passed before editing. Guarded OpenSpec status/apply instructions reported `ready`, with 2/60 shared tasks completed at inspection. Shared tasks were left to the parent/verifier as assigned.
- `pnpm test storefront-catalog`: **fresh execution, 30 files / 169 tests passed**, 0/1 Nx cache hits; run duration 31.1 seconds. Log: `storefront-tests.log`. Retains gallery omission/order/description and provider-error regressions.
- `node --import tsx --test --test-concurrency=1 scripts/cms-content-schema.test.mjs scripts/cms-draft.test.mjs`: **fresh execution, 20 passed / 0 failed**, 3.575 seconds. Log: `cms-tests.log`. Includes the imported draft-creation regression, full source inventory validation, unsupported fields, nested issue paths, deliberate rich-content clearing, unsafe-content rejection and draft/publication separation.
- `pnpm exec eslint packages/content-model/src/schemas.ts packages/content-model/src/emdash-content.ts packages/content-model/src/index.ts --max-warnings=0 --no-warn-ignored`: passed, exit 0. Log: `lint.log`. The existing boundary configuration emitted deprecation notices; no file lint error or counted warning occurred.
- `node --import tsx .codex-artifacts/simplify-main-site-modules/content-model-01a12553/parity.mjs before`, then `... after`: **145 comparisons passed** (53 portable parses, 53 CMS parses/issue results, 39 draft cases). Captures: `before.json`, `after.json`; final log: `parity.log`. Compared serialized parsed output and its ordering, schema/parsed field order, complete issue arrays/messages/paths, root runtime export names and two image-factory calls. Cases include omitted/null/empty fields, trimming, ordered galleries, missing descriptions, provider URLs, portable date coercion versus CMS ISO validation, order bounds, unsupported fields, unsafe links, unknown marks, unsupported blocks and malformed media.
- Exact source comparison against `HEAD:packages/content-model/src/distro-content-schema.ts`: passed. `source-parity.json` records the unchanged factory and generic signature, normalized factory SHA-256 `e9d1f9919fa2640ff33f8ef495d4db7ab057375545686d07963ce1872e1aa560`.
- Scoped `git diff --check`: passed for the module diff.
- `pnpm exec prettier openspec/changes/simplify-main-site-modules/reviews/content-model.md openspec/changes/simplify-main-site-modules/implementations/content-model.md --check`: passed. Log: `report-format.log`. Only the two assigned reports were checked; the received review table received whitespace alignment. No shared formatting command was run.

The first parity attempt compared live Date/undefined values with a JSON-read baseline and failed on serialization representation. The harness now compares the same serialized representation, while recording parsed key lists to distinguish omission from an explicit undefined key. This required no production correction. The retained factory text separately establishes unchanged date construction and generic typing. Full downstream compiler acceptance is reserved for combined validation.

## Source identity

HEAD before and after implementation: `3355c335226838f996efb5536f55271f819a3e14`.
Baseline capture: `2026-10-10T10:27:23.951Z`.
Post-edit capture: `2026-10-10T10:30:30.606Z`.
Final identity check: `2026-10-10T10:35:17.206Z`; module and focused caller/test digests still matched the post-edit capture, and all untouched owned files matched the baseline.

Owned module SHA-256 before: `b7dc5ab4b9ac05caa07677a4e640b2c296e69041bfb9e436a4a73a489db4f1d1` (matches the received review).
Owned module SHA-256 after: `e156adfbc75ab104056b45127570790859a79119c67c86dc662bc2a410531aec`.

Both use SHA-256 over repeated `relativePath + NUL + rawFileBytes + NUL`, with `packages/content-model/package.json` first, followed by all `src/*.ts` paths in lexical filename order. There were eighteen source files before and seventeen after. Full per-file hashes are in the captures.

```text
schemas.ts        731255416b735ca332c8e65505fda735ef67926967989241e551a7c2e53667da
emdash-content.ts a90a7f32cd9d1eeeda55d0f0789209c0cd6a0f25cdf0bf79489a1e0969281fc2
index.ts          cabea7872a431a97eed8b5236d1cf4a9c5ae98dac2f27d69214bd95f337a1a70
```

The implementation's focused caller/test digest was identical before/after: `2d0d6705ea1739c3e69ec69cfb74fcc75d67f5f4fb9243ee68ad61603655190f`. It uses the same algorithm over these lexically sorted paths; it is a different scope from the review's larger evidence digest:

```text
apps/backend/src/cms-worker.ts
apps/backend/src/cms/editorial-plugin.ts
apps/web/src/content.config.ts
apps/web/src/lib/distro-content-schema.test.ts
scripts/cms-content-schema.test.mjs
scripts/cms-draft.test.mjs
scripts/editorial-draft-creation.test.mjs
scripts/fixtures/prose.ts
```

## Graph evidence and remaining acceptance

Used both existing graphs before substantive source work. Graphify query `createDistroContentSchema` with budget 2500 found 69 nodes and showed 68, explicitly truncated. Targeted explains of `packages_content_model_src_distro_content_schema_createdistrocontentschema` (six relationships) and `packages_content_model_src_emdash_content_draftschema` (four relationships) closed the relevant factory/caller and draft-construction gaps without truncation. No absence claim relies on the truncated query.

CodeGraph supplied current factory, schema, draft-validation and Astro caller source. Its exact-name query also returned an unrelated commerce draft schema, which was excluded. Anonymous test bodies, the barrel and native plugin were not fully returned, so exact bounded reads filled those gaps; scoped reference search established private import wiring. No graph initialization, rebuild, enrichment or paid API was invoked.

The persistent verifier must refresh Graphify once for the combined batch, run combined affected validation/type checks with `pnpm validate`, assess any shared browser/publication acceptance needed, run strict OpenSpec validation and update shared tasks. Those operations were deliberately not run concurrently here. The module work is complete; overall final acceptance is not claimed.

Only the owned package, these two unique reports and ignored evidence artifacts were edited. No shared tasks/proposal/design, staff/CMS implementation, generated contracts, content, migrations, external services or global configuration were changed. No branch, worktree, commit, push, deployment, publication or provider mutation was performed.

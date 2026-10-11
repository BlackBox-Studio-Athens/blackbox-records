# Received review: @blackbox/content-model (module 2/29)

Reviewer/thread ID: `01a1253b-6048-7382-8ea0-eb1d397a52bd`.
Implementation receiver/thread ID: `01a12553-72e5-7462-b4cf-b6b395180fca`.
Requested review/implementation model and reasoning: `gpt-6.1-sol` / `max`.
Received from the parent assignment on 2026-10-10. The complete review below is preserved as received; its no-edit statements and acceptance limits describe the review stage.

What this change does: This is a read-only Ponytail simplification review of module 2/29, `@blackbox/content-model`, for `openspec/changes/simplify-main-site-modules`. All 18 owned source files were reviewed, with connected callers and regression coverage traced. Two small cleanup candidates are supported; no implementation or repository report was written.

**Should fix**

1. **Consolidate the Distro schema with the existing collection schemas.**

   **What this is:** `packages/content-model/src/distro-content-schema.ts:1–36` contains one portable collection-schema factory. Its required-text and image-description validators at lines 8–9 duplicate `packages/content-model/src/schemas.ts:19–20` exactly, including trimming and error messages. It already imports its Bandcamp and Tidal validators from `schemas.ts:27–33`.

   **Problem and proof:** This separate file repeats validation definitions and import/export wiring without providing an independent dependency boundary. Both factories use the same Zod import and the same shared tracklist, rich-text and provider validators. The repository reference search found only two production consumers of `createDistroContentSchema`: `packages/content-model/src/emdash-content.ts:16,149` and `apps/web/src/content.config.ts:9,60–63`. The web consumer imports the public package root. The only imports of the private Distro file are its package barrel and the internal CMS schema builder.

   **Smaller change:** Move `createDistroContentSchema` unchanged into `schemas.ts`, alongside the other collection factories. Add `DISTRO_GROUP_VALUES` to that file’s existing validation import. Move the internal CMS import into its existing `./schemas` import list, remove `index.ts:5`, and delete the former Distro file. The existing `index.ts:4` star export keeps `createDistroContentSchema` available through the same public package interface. Do not introduce exported validator helpers or a forwarding file.

   **Behavior to preserve:** Keep every field, field order, generic image-factory type, image-factory invocation, trim operation, optional/null distinction and validation message. In particular, retain ordered galleries with required descriptions; optional listening sources and their current errors; optional tracklists and rich summaries; nonnegative integer ordering; and `z.coerce.date()` in the portable factory. The CMS extension must continue replacing that date field with its existing optional ISO date validator. Do not change stripping or strictness behavior.

   **Focused validation:** Retain `apps/web/src/lib/distro-content-schema.test.ts:20–84`, which distinguishes gallery omission, gallery order, missing/blank descriptions and provider errors. Retain the complete-source-shape and unsupported-field checks in `scripts/cms-content-schema.test.mjs:377–431`, and the Distro error-path assertion at lines 485–501. Run `pnpm test storefront-catalog` and the focused CMS schema/draft tests listed below, followed by normal affected validation in the implementation thread. Check parsed outputs and issue paths/messages for blank required strings and invalid provider URLs; do not replace these regressions with tests of the file move.

   **Expected net reduction:** Approximately **9 production lines and one source file**, accounting for the factory being moved rather than deleted. No consumer implementation or test deletion is needed. If skipped, the current behavior remains correct, but the duplicate validator definitions and wiring remain.

**Nice to have**

2. **Merge the identical draft guards for full bodies and rich prose.**

   **What this is:** `packages/content-model/src/emdash-content.ts:241–242` separately recognizes `cmsBodySchema` and `richTextSchema`, then applies exactly the same optional/nullable wrapper to whichever schema matched.

   **Problem and proof:** These adjacent branches duplicate the same exceptional handling. The actual distinction is between these two complete block schemas and the recursive draft relaxation below them—not between the wrappers returned by the two branches. Both branches must retain their complete nested block validation.

   **Smaller change:** Replace only those two lines with:

   ```ts
   if (schema === cmsBodySchema || schema === richTextSchema) return schema.optional().nullable();
   ```

   Leave the prose-string special case, recursive object/array/union handling and remaining refinements untouched. Short-circuit evaluation selects the same schema and calls the same methods in the same order.

   **Caller evidence and behavior to preserve:** `cmsDraftSchemas` is built at lines 272–274 and used by `validateCmsDraft` at lines 276–286. `apps/backend/src/cms/editorial-plugin.ts:9–14` aborts native saves when this validator reports issues. `apps/backend/src/cms-worker.ts:792–819` uses it for editorial writes and returns the existing 422 response with those messages. Preserve absent/null fields and deliberately empty rich arrays, while continuing to reject unsupported blocks, unsafe links, unknown marks, malformed media and invalid nested types.

   **Focused validation:** Retain `scripts/cms-content-schema.test.mjs:298–319`, including deliberate clearing and unsafe rich-content rejection, and `scripts/cms-draft.test.mjs:56–70`, covering incomplete drafts and trust-boundary rejection. Run the same focused CMS test command below. No new implementation-mirroring test is warranted for this branch merge.

   **Expected net reduction:** **1 production line**, with no interface or test changes. If skipped, two identical wrapper branches remain; there is no current behavior defect.

**Ideas rejected after checking behavior**

- **Remove full snapshot validation after replacement or withdrawal.** `published-content.ts:22–31,40–50` calls `parseContentSnapshot` on the final candidate. That parse protects cross-record Artist references, Store Item identities, media completeness, duplicate identities and size limits. Earlier record validation cannot replace it.
- **Treat draft and publication schemas as interchangeable.** Drafts intentionally permit unfinished fields, while publication retains complete validation. The fresh draft tests demonstrate that an incomplete Artist can save privately and still fail publication validation.
- **Delete the recursive unsupported-field check.** `emdash-content.ts:221–229` detects fields stripped by ordinary object schemas. Removing it would weaken editorial validation and lose existing structured error paths.
- **Remove projection precedence, null handling or preview support.** `published-content.ts:60–91` supports enriched image references and private image overrides. Its reversed maps preserve first-match selection. `apps/web/src/lib/content-files/content-snapshot.test.ts:195–222` explicitly distinguishes missing versus empty Store Item identities and tests duplicate-binding precedence. `apps/backend/src/cms/published-reader.test.ts:69–107` separately protects mutable preview overrides and first-match singleton reads.
- **Replace rich prose with its plain-text projection or remove grouping.** Empty rich arrays deliberately clear legacy content. Formatting-only changes remain publication differences. Astro and React renderers consume grouping for quotations and independent numbered lists; plain text serves metadata and completeness checks, not those presentation contracts.
- **Unify the URL validators.** Their accepted inputs differ intentionally. Prose links accept HTTP, mail links and relative links; constrained editorial fields use HTTPS/internal-path rules; music and video parsers enforce provider-specific shapes. The tests exercise these different policies.
- **Delete retired or apparently unused public fields/exports.** `schemas.ts:198–199` explicitly retains stored `scroll_indicator_text` for compatibility. Public pattern strings, closed values, headings and types remain package contracts. Absence of a runtime call is insufficient deletion evidence.
- **Add country lookup caches or rewrite service uniqueness checks for speed.** The current code has identifiable linear country lookups and a quadratic service duplicate scan, but this review established no material slowdown at the intended editorial workload. Additional lookup state or algorithm changes are not justified by a measured problem here.
- **Delete overlapping tests.** The reviewed suites protect different boundaries: portable schemas, CMS drafts, native revisions, snapshot/media integrity, publication projection, rendering and player data. No test was shown to lack distinct regression value.

**Inspected scope and flows**

The working directory was `C:/Users/SVall/WebstormProjects/blackbox-records`, on `main` in the existing checkout. The package has **no `project.json`**. Its Nx configuration is in `packages/content-model/package.json`; its public root is declared in `openspec/specs/module-boundaries/module-boundaries.manifest.json:71–78`. No nested module roots or generated code were included.

Owned files read in full under `packages/content-model/src/`:

```text
artist-fields.ts
cms-link.ts
content-snapshot.ts
distro-content-schema.ts
emdash-content.ts
index.ts
music.ts
prose-rendering.ts
prose.ts
publication-review.ts
publication-values.ts
published-content.ts
purchase-headings.ts
purchase-information-schema.ts
release-status.ts
schemas.ts
tracklist.ts
validation.ts
```

There are no colocated tests in this package. Connected coverage inspected included `scripts/cms-content-schema.test.mjs`, `scripts/cms-draft.test.mjs`, the web Distro schema, editorial validation, tracklist, music, purchase-information and content-snapshot tests, and staff validation and backend published-reader tests.

Caller tracing covered these flows:

- Portable schemas → Astro collection configuration and CMS collection schemas.
- Draft validation → native before-save hook and editorial HTTP writes; structured issues → staff field errors.
- Native revision validation → accepted snapshots and publication review; replacement/withdrawal → final candidate validation.
- Published projections → snapshot-scoped readers and private previews, including identity, media and ordering semantics.
- Prose fallback/projection/grouping → Astro and React rendering and staff publication comparisons.
- Music URL parsing → player-provider data; country parsing/formatting → CountryPicker; tracklist validation/grouping → editing, Release details and Store presentation.
- Shared purchase headings and publication constraints → policy rendering; shared release badge types → presentation consumers.

The load model used was ordinary public rendering and editorial requests under the existing bounds: 1,000 snapshot records/media entries, a 4 MiB snapshot manifest, 256 KiB drafts and twenty-entry publication reviews. No performance improvement is claimed for either recommendation.

**Graph evidence**

Both existing graphs were consulted before substantive source investigation. Graphify used the repository’s **2,500-token budget**. The initial broad query returned 62 of 285 nodes and was explicitly truncated. Targeted `explain` calls then established the public root, CMS content schemas, shared publication review and package snapshot relationships. The ambiguous directed snapshot path lookup did not resolve a path; the exact package snapshot node did resolve. Broad omissions were not used as evidence that a caller was absent.

CodeGraph supplied current source and caller relationships for the owned factories, validation, projections and connected flows. Exact reads filled omitted sections and test bodies. The exhaustive scoped reference search confirmed the private Distro-file imports relevant to finding 1. No graph initialization, rebuild, enrichment or paid API was invoked.

**Validation observed**

| Check                                                                                                          | Result                                                                         | Limit                                                                              |
| -------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------- |
| `pnpm test storefront-catalog`                                                                                 | Passed; Nx replay reported **30 files / 169 tests**                            | **1/1 cache hit**. This was not a fresh execution.                                 |
| `node --import tsx --test --test-concurrency=1 scripts/cms-content-schema.test.mjs scripts/cms-draft.test.mjs` | **Fresh execution: 20 passed, 0 failed**, about 2.53 seconds                   | Includes the imported draft-creation regression. Local schema/draft evidence only. |
| Git/module identity check                                                                                      | `main`; HEAD unchanged; no working-tree changes under `packages/content-model` | Other module work was active in the same checkout.                                 |

The fresh tests exercised current content inventory shapes, structured validation errors, draft/publication separation, rich-content safety, image/video normalization and native editorial write compatibility. Tests were retained. No `pnpm validate` run was performed during this read-only review because it formats the working tree; the implementation thread must run it on its final tree. Browser, hosted publication, provider and release acceptance were not run.

**Source fingerprint**

- HEAD: `3355c335226838f996efb5536f55271f819a3e14`.
- Final identity check: `2026-10-10T10:10:22.385Z`.
- Owned module SHA-256: `b7dc5ab4b9ac05caa07677a4e640b2c296e69041bfb9e436a4a73a489db4f1d1`. **Matched at the beginning and end of review.**
- Candidate file SHA-256 values:

```text
distro-content-schema.ts c6dfa972e647f698cf9d158441d97273a5fde43bd205d905ac37dbe436f83936
schemas.ts               f67bfc9ac8b6ff3298c14369057ea0ea25d5ea681d05ade96635976e804f53ba
emdash-content.ts        d65520f4b1dc849151c054118c0d183e5fe3679909281679f06c1167384a37a7
index.ts                 e0e970c7c311e41c8b940cbe2f4f35ec52cb9818de3837489f10922a99170f41
```

The module digest is SHA-256 over repeated `relativePath + NUL + rawFileBytes + NUL`, with `packages/content-model/package.json` first, followed by all eighteen `src/*.ts` paths in lexical filename order.

A separate caller/test evidence digest is `913800c6fca3d5ca6eb15a1d069b9c98d7aef1e8ac8ea74a4846318a7e786bb5`, using the same algorithm with these paths sorted lexically:

```text
apps/backend/src/cms-worker.ts
apps/backend/src/cms/editorial-plugin.ts
apps/backend/src/cms/preview-selection.ts
apps/backend/src/cms/published-reader.test.ts
apps/backend/src/cms/published-reader.ts
apps/staff/src/components/publication/content-validation.test.ts
apps/staff/src/components/publication/content-validation.ts
apps/web/src/content.config.ts
apps/web/src/lib/content-files/content-snapshot.test.ts
apps/web/src/lib/distro-content-schema.test.ts
apps/web/src/lib/editorial-validation.test.ts
apps/web/src/lib/tracklist.test.ts
apps/web/src/platform/lib/purchase-information.test.tsx
scripts/cms-content-schema.test.mjs
scripts/cms-draft.test.mjs
scripts/editorial-draft-creation.test.mjs
```

Concurrent changes were observed in `web-content-files` and the existing OpenSpec change directory. Those were left untouched. The fresh implementation thread must recapture source identity and recheck current callers before applying this report.

**Verdict:** Review complete. Finding 1 removes demonstrated duplication; finding 2 is a small optional follow-up. Neither requires behavior changes, external consumer edits or test deletion.

**Lean:** Approximately **10 production lines and one source file** can be removed.

**Not checked:** Post-refactor output/type parity, final affected validation and browser/publication/provider acceptance remain implementation-stage work. The remaining graph limitation is the summarized broad relationship output; both actionable findings have exact source, import and caller evidence.

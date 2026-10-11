# Received review: web-content-files

Reviewer thread ID: `01a12524-49fa-7883-950a-71af3550af22`.

The complete review received by the separate implementation thread follows.

What this change does: `web-content-files` verifies content snapshots and their local media, projects records into Astro collections, and supplies stable slug generation and collision checks. This complete read-only review found **two optional simplifications**; no test deletion or removal of validation was justified.

Reviewed the existing `main` checkout at `C:/Users/SVall/WebstormProjects/blackbox-records`, HEAD `3355c335226838f996efb5536f55271f819a3e14`. No project files, task records, or external services were changed.

**Nice to have**

1. **Index Store Item bindings once per collection projection** — [apps/web/src/lib/content-files/content-snapshot.ts](/C:/Users/SVall/WebstormProjects/blackbox-records/apps/web/src/lib/content-files/content-snapshot.ts:47), **L47–76**.

   - **What this is:** `snapshotCollection` attaches a persisted Store Item identity to each Release or Distro record.
   - **Problem:** L71–75 searches the binding array again for every record. With 1,000 matching bindings in the same order, those searches perform 500,500 comparisons.
   - **Fix:** Build one local `Map` keyed by `sourceKind/sourceId`, then replace the repeated `.find()` with `.get()`. Copy the existing `.map(...).reverse()` indexing pattern from the shared projection to retain first-match behavior.
   - **If we skip it:** Output remains correct, but projection continues doing repeated work. This review establishes the operation-count improvement, not a measurable delay at the current catalog size.

   **Concrete evidence:** The current `.find()` matches `sourceKind` and the record’s **slug**, not its internal ID. [published-content.ts](/C:/Users/SVall/WebstormProjects/blackbox-records/packages/content-model/src/published-content.ts:67), L67–69 and L115–117, already indexes these same bindings and reverses the mapped array so the earliest duplicate wins. [content-loader.ts](/C:/Users/SVall/WebstormProjects/blackbox-records/apps/web/src/lib/content-loader.ts:49), L49–61, consumes the projected entries without exposing the proposed index.

   **Exact behavior to preserve:**

   - Retain the existing `loaded.snapshot.storeItems` guard. An omitted binding array leaves `store_item` absent; an empty array assigns `store_item: null` to Release and Distro entries.
   - Include the source kind in the key. A Release and Distro may have the same source slug.
   - Retain the earliest matching binding. A straightforward `new Map(entries)` would make the last duplicate win.
   - Build the index afresh on each call. Do not reverse the input array, cache projected entries, change record order, or change returned data.

   These distinctions matter downstream: [catalog-data.ts](/C:/Users/SVall/WebstormProjects/blackbox-records/apps/web/src/lib/catalog-data.ts:239), L239–247, treats `store_item: null` as exclusion from Store browsing, while an omitted value retains the legacy path.

   **Focused validation:** Run `pnpm test web-content-files`, then the focused `content-loader.test.ts` and `catalog-data.test.ts` checks. Keep the existing persisted-identity and null-binding assertions in [content-snapshot.test.ts](/C:/Users/SVall/WebstormProjects/blackbox-records/apps/web/src/lib/content-files/content-snapshot.test.ts:178), L178–196. Extend the owned test only for the uncovered distinctions: omitted versus empty bindings, identical slugs across source kinds, and first-match duplicates.

   **Estimated net reduction:** Approximately **0 production lines**: the index replaces the longer search. Focused regression assertions may add roughly 12–25 test lines. The benefit is less repeated work; no abstraction or dependency is needed.

2. **Remove the slug option that repeats the library default** — [apps/web/src/lib/content-files/slugs.ts](/C:/Users/SVall/WebstormProjects/blackbox-records/apps/web/src/lib/content-files/slugs.ts:22), **L22–26**.

   - **What this is:** `createSlugSuggestion` calls the installed slug library with `{ lowercase: true }`.
   - **Problem:** Version 3.0.1 already supplies that default. The wrapper creates an unnecessary options object on every call.
   - **Fix:** Replace L23–25 with `return slugify(value);`. Keep the exported wrapper and its signature.
   - **If we skip it:** Behavior remains correct; the redundant option and allocation remain.

   **Concrete evidence:** The lockfile and installed package both identify `@sindresorhus/slugify` **3.0.1**. Its installed `index.js`, L62–70, supplies the defaults, and the official versioned source confirms `lowercase: true` before applying caller options. [Official slugify 3.0.1 source](https://github.com/sindresorhus/slugify/blob/v3.0.1/index.js#L55-L65).

   Connected callers depend on the resulting strings:

   - [catalog-data.ts](/C:/Users/SVall/WebstormProjects/blackbox-records/apps/web/src/lib/catalog-data.ts:174), L174–176, generates fallback Release Store slugs.
   - [seed-local-mock-commerce-state.ts](/C:/Users/SVall/WebstormProjects/blackbox-records/apps/backend/scripts/seed-local-mock-commerce-state.ts:74), L74–92 and L195–197, retains explicit Distro slugs and generates Release fallback identities.
   - [stripe-catalog-contract.ts](/C:/Users/SVall/WebstormProjects/blackbox-records/scripts/stripe-catalog-contract.ts:607), L607–609 and L642–656, generates catalog slugs and price-revision strings.

   **Exact behavior to preserve:** Keep lowercase output, transliteration, punctuation and whitespace handling, empty results, and invalid-input errors. Keep explicit-slug validation, fallback selection, and collision handling unchanged.

   **Focused validation:** Run `pnpm test web-content-files` and the focused `catalog-data.test.ts`, `local-mock-commerce-seed.test.ts`, and `stripe-catalog-contract.test.ts` checks. Existing tests cover accented labels, fallback identities, canonical Store paths, and the persisted revision `caregivers-vinyl-2000-eur`; no new test is needed solely for removing this option.

   **Estimated net reduction:** **2 production lines**, with no test deletion.

**Rejected simplifications**

- **Remove checks from `readContentSnapshot`: rejected.** [content-snapshot.ts](/C:/Users/SVall/WebstormProjects/blackbox-records/apps/web/src/lib/content-files/content-snapshot.ts:17), L17–39, checks checksum syntax, file size before reading, manifest checksum, media directory containment, media size/checksum, and decoded image metadata. Shared schema validation does not replace these filesystem checks. The earlier size rejection and its error message also differ from the parser’s size check.
- **Replace `snapshotCollection` with `publishedCollection`: rejected.** The shared runtime projection returns image metadata objects and Artist reference objects, normalizes dates and editorial bodies, and changes some singleton IDs. The file projection returns relative image paths and an Artist slug string for Astro parsing. Their similar structure does not establish interchangeable behavior.
- **Remove the recursive field conversion or null filtering: rejected.** [content-snapshot.test.ts](/C:/Users/SVall/WebstormProjects/blackbox-records/apps/web/src/lib/content-files/content-snapshot.test.ts:97), L97–105, L136–144 and L197–205, protects nested galleries, absent optional dates, and service objects whose own `id` must not turn the whole object into an image reference.
- **Cache projections across calls: rejected.** The owned test changes dates, tracklists, records, and Store bindings on the loaded snapshot between calls. A cached result could stop reflecting those changes.
- **Delete schema-only assertions from the owned snapshot test: rejected.** L218–257 protects exact environment errors, strict manifest paths, required revision failure, and enriched native-image validation. The inspected shared-contract tests do not replace those exact checks. Related partner-link tests exercise different validation entry points.
- **Remove slug exports or simplify collision collection by changing its representation: rejected.** The exports have connected callers or direct contract tests. Collision output preserves first-seen slug order, owner order, and error formatting; numeric slug strings make a switch to object-key grouping observably different.
- **Parallelize media verification: rejected.** That would change validation sequencing and potentially which failure is reported first. No measured performance need justified it.

No owned test was identified as implementation-only or safely redundant.

**Inspected scope**

The entire module was read:

| Owned file                                                | Inspected range |
| --------------------------------------------------------- | --------------: |
| `apps/web/src/lib/content-files/content-snapshot.ts`      |           L1–88 |
| `apps/web/src/lib/content-files/slugs.ts`                 |           L1–78 |
| `apps/web/src/lib/content-files/content-snapshot.test.ts` |          L1–257 |
| `apps/web/src/lib/content-files/slugs.test.ts`            |           L1–69 |
| `apps/web/src/lib/content-files/project.json`             |           L1–27 |

This covers **166 production lines and all six owned test cases**. The module remains closed, with its two declared entry points and its existing `@blackbox/content-model` workspace dependency.

Connected source inspection covered the web content loader and collection configuration, catalog and ownership consumers, Local runtime bootstrap, backend content smoke consumption, mock seed generation, and catalog contract generation. Related tests were read for loader retries, persisted identities, slug/collision behavior, seed fallbacks, catalog revisions, and shared content validation. Shared snapshot parsing, prose/media helpers, and runtime projection were inspected as compatibility evidence.

Both Graphify and CodeGraph were used. Graphify queries used budget **2500**; truncated broad results were narrowed to file/function explanations. CodeGraph supplied source and relationships; scoped exact reads filled omitted test bodies. No graph was initialized, rebuilt, or enriched.

**Validation evidence and limits**

A read-only in-memory check under **Node v24.21.0** passed:

- 14 slug inputs produced identical results with and without the default option.
- Five invalid-input cases produced identical error types and messages.
- 24 lookup comparisons matched `.find()` against the proposed reverse-built index, including missing, empty, cross-kind, and duplicate cases.
- The synthetic 1,000-item lookup performed **500,500 predicate evaluations**, compared with 1,000 index insertions and 1,000 lookups.

These checks wrote no files and do not substitute for running the owned suite after implementation.

The five owned files have combined fingerprint:

`e71d82b0d427ee008bc645fc810cc254d920fbafbb11d0c9f211238938bb3d6f`

This is SHA-256 over the table’s ordered `path + space + file SHA-256` rows, joined with LF and no trailing LF. Final Git inspection showed no module diff; the pre-existing untracked OpenSpec change remained untouched.

The implementation thread should run its focused checks and `pnpm validate`, then record acceptance against its resulting source fingerprint.

**Verdict: Ship.** Both findings are optional refactors.

**Lean: -2 production lines possible.** Finding 1 reduces repeated work and may add meaningful regression assertions.

**Not checked:** Vitest execution, `pnpm validate`, browser/Local stack/provider acceptance, or elapsed-time performance. All owned source and tests were inspected; runtime acceptance remains for the implementation thread.

# web-layouts implementation

Assigned implementation and scoped checks are complete. Module acceptance remains pending; tasks 14.1/14.2 were not changed. Parent released this same fresh role while deferring preceding checkpoint acceptance.

- Implementer: `01a1269a-3f35-75f1-853b-2f967b056e08`.
- Reviewer: `01a125aa-c07f-75e2-b40c-1d73544ca9dc`; review turn `01a1260f-455d-7451-b091-f89423b39cec`.
- Full review: [web-layouts.md](../reviews/web-layouts.md), copied completely from `.codex-artifacts/simplification/14-web-layouts-review-refresh-01.result.json`, raw SHA-256 `9efd0a3e5b38d0590f81dcf98b12dde6ba244d59fa09acb56d163e6d6f3fc447`. Exact report-string inclusion passed after saving.
- Completed prep turn: `01a1269a-63e5-71e0-ac38-c6aa36387fa3`; raw prep SHA-256 `1c2545a2b3e4cba9712e237b7557e49c8fe2556d3edbf5db66c49a3c62c734a9`. Both immutable source identities were checked before edits.
- Machine evidence: [.codex-artifacts source-evidence.json](../../../../.codex-artifacts/simplification/web-layouts-implementation/source-evidence.json), including exact per-file hashes, covered input membership and check outcomes.

## Decisions and proof

F1 accepted: remove seven assertions across nine test lines. Original locations and retained counterparts:

| Removed                                                   | Retained proof                                                                                                                                        |
| --------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| catalog-containment.test.ts:14                            | Original line 22 forbids every contain-intrinsic declaration in the same grid selector body.                                                          |
| catalog-containment.test.ts:35–37                         | Original line 23 requires the identical selector and font value immediately after the opening brace, subsuming the weaker declaration-anywhere regex. |
| catalog-containment.test.ts:39                            | StoreCollectionPage.test.ts original line 62 asserts the identical price hook against the same card file.                                             |
| StoreCollectionPage.test.ts:63–64                         | Original lines 75–83 extract the availability span using its hook and require its class, pending state and the same text within that span.            |
| StoreCollectionPage.test.ts:47 and store-crate.test.ts:19 | store-crate.test.ts original line 25 requires the actual Collection StoreCrate tag followed by its binRow prop.                                       |

Retained the separate Distro-wrapper assertion and all test cases. No replacement abstraction or tests were added. The five old findings in the previously deleted Coverflow test are obsolete; that earlier deletion is not credited here.

F2 accepted: move the category condition outside groupStoreDistroCollectionEntries. Current non-All renders formerly grouped an empty array. Its entry map invokes no validation or format derivation; groupDistroEntries allocates seven empty groups and filters all of them out. Both old and new paths yield a fresh empty array without side effects. All retains the same selection/grouping calls, validation, ordering, counts and base-aware format URLs. Distro retains its named slot and real grouping in StoreDistroCatalog. No measured latency claim.

F3 accepted: remove only window.location truthiness from the native inline redirect condition. Native Window.location supplies the Location object; keep the nullable redirect target check, fragment opt-in, replace history semantics, canonical, meta refresh and visible link. Only legacy Distro opts into fragment preservation; Shop and empty Merch retain ordinary base-aware targets.

Rejected/retained: keep separate settings read points (preview tests require fresh projection), exported layout props/aliases and metadata/image/URL fallbacks, listing-price document/adoption/cancellation/generation/rejection safeguards, the separate redirect document, meaningful Crate/card/native-link/image/accessibility tests, current Distro membership and all current Crate/player/security behavior. The existing Distro source/spec discrepancy remains outside this cleanup. No cross-root finding was implemented.

## Source and concurrency

Existing main checkout. Before and after HEAD: `f7b019ca043e5f082c5b7aca67c4f0dbb3685ed0`. All 11 owned files matched the completed full-module review before editing; no nested root or pre-existing owned delta. Reused hash-matched complete inspection and rechecked finding callers/tests. Current boundary metadata was unchanged.

| Fingerprint                                | Before                                                             | After                                                              |
| ------------------------------------------ | ------------------------------------------------------------------ | ------------------------------------------------------------------ |
| Owned, 11 files                            | `980f04fd2d1fbf468c49a0fb3054b371dd90cf41d7b53c9177663b5a6e4efc23` | `5760f13a53bcee12d3771c664b977d074ad90c8cfc2410784b171e12e562273b` |
| Direct page callers, 24 files              | `59c27a22710a09e6194d97b137b5373c7a9dac5aecde2009bc5be3d5d7160390` | `59c27a22710a09e6194d97b137b5373c7a9dac5aecde2009bc5be3d5d7160390` |
| Selected dependencies, 39 files            | `2a85aea67162d2f11cfa269317701358b2264bef724a95271e6e25426cd00763` | `2a85aea67162d2f11cfa269317701358b2264bef724a95271e6e25426cd00763` |
| Combined connected, 63 files               | `ad478cb3e9ef51cb1504336d7000f1c3cc04b1d45b4f406739695192c03bc1d7` | `ad478cb3e9ef51cb1504336d7000f1c3cc04b1d45b4f406739695192c03bc1d7` |
| Layout test source-read coverage, 29 files | `e28fd0a1e49f6142bc26540c5a73fcea50e1b507fca26d9b08bdd7854da7ebbd` | `fd61aa254881226c8c11254b4e71990dc55189cc875cd37ae4291d1ea59ea19f` |

Fingerprints hash raw file bytes, then locale-sorted LF-joined normalized-relative-path + SHA-256 rows, without trailing newline. Exact rows are retained in machine evidence. Before: 2026-10-10T17:52:26.690Z; after: 2026-10-10T17:55:34.510Z.

Connected preparation deltas were inspected where relevant: storefront removed duplicate list validation and simplified the seven Distro group records; shell removed the unused idle scheduler while retaining Crate sanitation; pages simplified demo intermediates without changing layout props. Current card, Crate, canonical Store route and redirect wiring remained compatible. These active-owner changes do not overlap this private cleanup. All selected connected rows remained byte-identical throughout this execution; covered test sources changed only in the five owned paths. Final stable combined acceptance is still required.

Both graphs were used in preparation. Existing Graphify RedirectLayout relationships were reconfirmed; CodeGraph supplied current changed collection and shell-sanitation source. No graph rebuild, enrichment or shared graph write occurred. Guarded OpenSpec guard/status/apply succeeded; all current returned context files were read (ready, spec-driven, 10/60 accepted task markers).

## Changes and reductions

| Changed owned file          | Production net removed | Test net removed |
| --------------------------- | ---------------------: | ---------------: |
| StoreCollectionPage.astro   |                      1 |                0 |
| RedirectLayout.astro        |                      0 |                0 |
| catalog-containment.test.ts |                      0 |                5 |
| StoreCollectionPage.test.ts |                      0 |                3 |
| store-crate.test.ts         |                      0 |                1 |
| Total                       |                      1 |                9 |

Deleted files: 0. Deleted functions: 0. Formatting-only reduction: 0. Required audit Markdown is excluded. Production also avoids empty grouping calls/allocations and one Location property read/operand. No dependencies or interfaces changed.

## Scoped checks

- `pnpm test web-layouts` through RTK: exit 0. Filtered output exposed only existing colour-environment warnings, not a test count; no passing rerun was started solely to recover counts.
- Narrow supporting Vitest command: `pnpm --filter @blackbox/web exec vitest run --config vitest.modules.config.ts --project storefront-catalog --project web-pages src/lib/store-collection.test.ts src/pages/_distro-redirect.test.ts`: 17 tests, 2 files passed, exit 0. This avoided a broad affected-consumer selection.
- Changed-file `pnpm exec eslint`, five owned files, `--max-warnings=0 --no-warn-ignored`: exit 0. Existing boundary-plugin deprecation notices only.
- Changed-file `pnpm exec prettier --check`, the same five files: exit 0; no formatter writes needed.
- Scoped `git diff --check`: exit 0. Diff matches exactly the three accepted findings.

Audit Markdown initially needed formatting. Prettier normalization was limited to this role's two reports; both then passed the scoped format check. The formatted complete review matched Prettier's formatting of the exact received review plus its identity header. Closing hashes found no source changes after passing checks. Immutable raw reports and source bytes remain unchanged.

The initial unprefixed lint/format command was blocked by the RTK hook before execution; it was corrected to an explicit RTK proxy and passed. Attempts to locate a native Nx count report found no matching history in this checkout's existing database and no .nx/cache directory; no count was invented. No module-specific typecheck target exists; mandatory web/package types remain verifier-owned.

## Acceptance and resource handoff

| Acceptance row           | Status/gap                                                                                                                                                                                      |
| ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Shell/player/routing     | Deferred: rendered All/non-All output, format links, legacy fragment replacement, Shop/empty-Merch targets, JavaScript-disabled fallback, focus/accessibility and persistent-player continuity. |
| Store presentation       | Deferred: stable combined Grid/Crate order, filtering/restoration, enhancement failure and complete native catalogue. Meaningful existing tests retained.                                       |
| Commerce/checkout/stock  | No authority or checkout implementation changed; existing listing-price lifecycle safeguards retained. No provider scenario selected.                                                           |
| Staff/CMS/publication    | No implementation changed; preview freshness constraint retained. No publication scenario selected.                                                                                             |
| Boundaries/shared checks | Verifier owns both-graph freshness, affected/package checks, strict OpenSpec/task gates and mandatory final-current-tree pnpm validate.                                                         |
| Release/environment      | Not applicable; no hosted or release action.                                                                                                                                                    |

No browser, normal Local stack, provider, global validation, package types or graph refresh ran here. No tasks, shared config/tooling/generated files, other reports, commits, branches or worktrees were changed. This role owns no running check process, browser or server resource at handoff. Implementation completion does not approve module acceptance.

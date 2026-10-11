# Implementation evidence

Baseline: `be3c6b5c78ab04d8506616334f38b2de102af504`, with existing unrelated OpenSpec archival changes preserved. The independent pagination/Back proposal is still unimplemented. This change adds no dependency, migration, binding, persistent private-data cache or hosted mutation.

## Local

- Overview requests the validated `view=overview` mode. The supported native repository reads five recent candidates per collection while the accepted pointer/manifest loads. Pending lookup starts after candidate identities are known. General list, artist and commerce enrichment are skipped. Existing adapter modes and publication-state derivation remain available.
- Worker tests cover incomplete drafts, accepted/changed revisions, pending revisions and identity-based pending requests, ordering, the twenty-entry cap, bounded repository calls, fresh pointers, immutable-manifest reuse, invalid mode combinations, independent I/O and failure propagation. The compiled native CMS smoke compares summary fields with the retained general reader and passes all thirteen collection contracts.
- The built Chromium/Firefox suite verifies three requests in the initial/focus/visibility/reconnect Overview race, independent panels, retained successful empty results and retry after a failed refresh. Generation and per-resource request guards remain in place.
- Stock resolves URL/recovery state before reading, and only typing schedules 300 ms. The built checks hold typing timers to prove immediate initial/search/cursor/filter reads, then release rapid typing once. Hidden/offline checks, obsolete-response checks and existing count/recovery/input protections remain covered. Inventory artwork stays nonblocking, with existing thumbnail limits and missing-image placeholders.
- Pages, Releases and Distro network captures exclude unopened editor, picker, selling, preview and review chunks. Response-body checks reject eager rich-editor and media-grid CSS. Direct editors and browse-to-editor navigation load processed inline styles with the existing `emdash` layer. React deduplicates feature style elements. Tests retain heading focus, picker styling, load failure feedback, autosave/conflict/recovery and preview checks.
- Built initial HTML contains neutral workspace loading. Delayed destination tests reject an Artists heading, zero badge and no-results text before settlement; successful empty and failed first reads remain distinct.
- Native Codex browser: `bootstrap_ok`. Inspected the built Distro list, editor loading, focused heading and styled controls on disposable loopback fixtures.
- Combined hosting smoke passed private HTML, authenticated module 200/304 responses, authorization/alias denial, public API isolation and absent session cookies. The CMS build's source/generated no-KV checks passed.
- Real shared-template preview smoke passed all thirteen collections, Chromium/Firefox comparisons and interactions, newsletter edits and formatting-only autosave, unchanged publication history and restoration of the original draft. It used copied local persistence with isolated Worker names/registry on 8799/4339. The first comparison selected an unpublished historical fixture and correctly received 404; the rerun selected accepted entries from the copied snapshot without weakening assertions. Logs: `.codex-artifacts/staff-navigation-wait-local/preview-smoke.log` and `preview-aligned.log`. Other tasks' 8787/4321 stack was untouched.

### Query diagnostic

The retained synthetic native-reader probe was rerun against the implementation. These are installed-reader observations, not permanent exact-count assertions or hosted billing/latency measurements.

| Fixture                           | General native SQL | Pending SQL | Commerce SQL | Overview native SQL | Overview pending SQL |
| --------------------------------- | -----------------: | ----------: | -----------: | ------------------: | -------------------: |
| Empty database                    |                 42 |           1 |            0 |                  26 |                    1 |
| One accepted entry per collection |                 56 |           1 |            1 |                  26 |                    1 |

Thus the accepted fixture falls from 58 to 27 SQL statements. Native `executeQuery` invocations are 56 versus 26; the separate stubbed pending binding is called once, and commerce once versus zero. Actual D1 transport/batch calls and billed rows read are **not measured** by this synthetic connection. Count queries still read matching entries. Each activation reads the current R2 pointer; verified manifests are reused only for the matching bucket, environment and digest. Evidence: `.codex-artifacts/staff-latency-round-two/implementation-operation-counts.json`.

### Repository gates

`pnpm validate` passed all phases in run `2026-09-22T18-32-18-734Z-89408`. Both browser engines and preview policy passed `pnpm validate:editor` in run `2026-09-22T18-28-12-206Z-92276`. These establish the implementation checks at those recorded fingerprints. Final reruns after the test/checklist/evidence edits are retained in `.codex-artifacts/staff-navigation-wait-local/validation.json`, linking the full and editor summaries with their source fingerprints. Read those summaries for exact final-tree acceptance.

`openspec validate reduce-staff-navigation-wait --strict` passed. Staff guidance is updated in `docs/content-workspace.md`.

## UAT

The reviewed source `020204e284a4f655ed2ea1f19c4e73143f59db0f` was accepted by candidate run [35790151397](https://github.com/BlackBox-Studio-Athens/blackbox-records/actions/runs/35790151397). Its full validation, unused-code audit, Chromium/Firefox preview checks, UAT Worker and Pages deployments, provider smoke, and release-identity verification passed. UAT Worker version: `971fa7c0-4711-4936-aa19-16c7e371f8b8`; Pages: `https://f02dbe46.blackbox-records-web-uat.pages.dev/` (`https://blackbox-records-web-uat.pages.dev/` is canonical).

The authenticated Chrome `blackbox` profile showed populated Overview, Website, Stock and Distro pages. Stock showed 25 items; no editorial or inventory mutations were made. Built resource-boundary checks passed in the candidate workflow. Task 5.3 is complete; the budget snapshot and route evidence are in [measurements.md](measurements.md).

## PRD

Promotion run [35793764756](https://github.com/BlackBox-Studio-Athens/blackbox-records/actions/runs/35793764756) passed for candidate `35790151397` and the same full SHA. The PRD Worker version `94b887c5-b0cf-4202-ac52-c34fa6b4c846` received 100% traffic under tag `35793764756-1`; Pages deployment `https://3c05c001.blackbox-records-web.pages.dev/` and hosted release verification passed. The dispatch used `confirm_code_promotion=true`, `confirm_live_catalog_changes=false`, and `confirm_cms_cutover=false`; it did not authorize a live catalog change or shopper launch.

The existing authenticated Chrome `blackbox` profile completed 16 route activations: one initial-resource visit and three normal-cache visits for Overview, Website, Stock and Distro. No cache was cleared or throttling enabled. The performance sample is diagnostic rather than final acceptance: the Overview warm data milestones were 2.10 s and 3.28 s, with one visit still loading at 1.78 s; one Distro visit took 6.52 s to start its list request. The narrowed Overview workspace request itself had a 416.8 ms median duration versus 920.3 ms in the prior sample, but the full Overview startup still misses the 1.5 s target. See [measurements.md](measurements.md) for visit-level data and capture limits. Keep the Overview latency follow-up and archival open.

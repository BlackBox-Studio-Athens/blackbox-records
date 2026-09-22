# Design

## Context

See [proposal.md](proposal.md) for scope and [measurements.md](measurements.md) for the second PRD baseline. The measured PRD Worker was version `935204d4-cb5f-4208-8dee-56f65cecb01c`, source `53abbbbc81c80f3385693e1c30752928e172dfa4`. The repository also contains newer work and an independent pagination/Back proposal; pin the implementation baseline rather than treating the local tree as the measured PRD artifact.

[investigation.md](investigation.md) adds controlled local timer, stylesheet, refresh and native-reader experiments, plus read-only local index plans. These establish several application causes. They do not establish a complete explanation for variable hosted HTML/asset response time or guarantee the final hosted result.

The archived static bypass and compact-image work remains useful. Authenticated staff HTML/modules go through the entry Worker's ASSETS binding; APIs retain CMS/commerce routing. Warm HTML can arrive in roughly 100 ms, yet page islands start their API reads hundreds of milliseconds later. Some visits have much longer document/dependency waits. Small Overview responses also take substantially longer than other reads.

`StaffOverview` has independent panels already. `readStaffWorkspace` still prepares a general enriched projection before filtering recent drafts. `ContentApp` starts with `artists` and corrects its location in an effect. Its import graph includes editor and selling controls; editor CSS is present in browse-only documents despite the existing lazy rich-text component. `staff-query.ts` owns a document-local QueryClient: explicit page reads use `staleTime: 0`, while focus/reconnect refresh is coordinated separately. A full document navigation destroys that cache by design.

## Goals / Non-Goals

**Goals:** remove Stock's artificial startup delay, closed-feature startup work and Overview read dependencies; preserve settled Overview panels during refresh; replace false empty states with truthful loading; verify the result on PRD with slow samples retained.

**Non-Goals:** a staff redesign, new router, cross-document private-data cache, longer freshness TTLs, relaxed Access or cache validation, direct queries against EmDash-owned content tables, provider relocation, new infrastructure, bulk thumbnail repair, or commerce/publication mutations. Save duration and publish duration were not measured and receive no performance claim.

## Decisions

### 1. Fix demonstrated causes before adding diagnostics

The archive records deployed work and its historical acceptance decisions. Reopening it would mix a new baseline into completed history. Keep this follow-up separate. The user has now removed the country-specific acceptance gate from the main spec and active proposal.

Implement decisions 2–5 using the recorded reproductions. New request tracing, index parity checks and database benchmarks are not prerequisites. The measured local catalog has roughly 100 records; existing readers, query coordination and loading primitives are sufficient for the selected changes.

If the candidate remains slow, correlate a slow and normal request using existing Rays, browser timings and Worker observations. Distinguish entry/auth/ASSETS time, object dispatch, D1 calls/SQL duration/rows read and R2 time. Add temporary authenticated stage timings only if existing evidence cannot locate a repeatable delay; record durations and counts without credentials, identities or content. Any extra hosted collection needs the normal Free-tier budget. No tracing framework is planned.

The scoped index review already found recent-content and pending-publication indexes and an indexed Stock join. If SQL time or rows read remain material, verify deployed parity and benchmark Catalog title indexing through SchemaRegistry or an exact-expression Stock sort index. A temporary sort over this small catalog alone does not justify a migration; a plain B-tree does not remove the current substring-search scan. Keep these as performance notes, not mandatory implementation tasks.

The native browser can pause document processing, the DevTools profile was unsigned-in, and the ingress colo changed during this pilot. Therefore this baseline does not select an object migration, Smart Placement change, or an entry-Worker rewrite. If attribution points outside the bounded application changes below, record it and propose that separate change instead of expanding implementation.

### 2. Give Overview an explicit lightweight projection

Extend the existing workspace query with `view=overview`, and update only Overview to request it. Preserve unscoped and `view=changes` behavior for existing callers. Validate the new mode and reject incompatible selection/paging/filter parameters rather than ambiguously combining modes. Keep the existing authentication, role, environment and private/no-store response boundary.

Use the publicly exported EmDash `ContentRepository` with the existing `runtime.db`, as `inventory-artwork.ts` already does. For Overview only, call `findMany` with limit 5 and `updatedAt DESC`; bypass the general list handler's unused SEO/byline enrichment. Preserve the existing accepted-manifest logic and recent-work semantics: take the same recent candidates, determine draft/changed/pending/published state, sort by update time, and return at most 20 unpublished entries. `/review/` remains complete paginated discovery. Do not replace this with a global top-20 query or load all content records.

For this projection:

- Start independent native collection reads and accepted-pointer/manifest retrieval together. Start pending lookup when selected identities are known; derive the result after both publication inputs complete. Retain the existing collection/page bounds.
- Do not run the extra artist-name enrichment query or read COMMERCE_DB. Overview uses entry identity, title/label, collection, update time and publication state, not selling/stock fields.
- Retain pending-publication and accepted-revision checks before returning current state. Do not infer publication from the latest global job or a cache TTL.
- Keep the existing single verified immutable snapshot cache. Read the current accepted pointer per activation; no new durable or browser-persisted cache.

Regression fixtures compare the visible summary across incomplete drafts, accepted entries, newer drafts, pending publications and empty results. Assert one bounded recent-page call per collection, no unused enrichment, one current-pointer R2 read and at most one verified manifest read on a cache miss. Preserve failure propagation; a commerce failure must not make editorial recent work unavailable.

The local accepted-record fixture makes 58 SQL statements. The installed repository issues page and count queries for each of 13 collections, so the selected approach is expected to issue 26 plus one pending lookup: 27. This excludes auth/runtime initialization and other Overview panels. Record SQL statements, binding calls and rows read separately; do not turn 27 into a permanent exact-count assertion, a minimum or a latency guarantee. The unused counts still read matching index entries.

The query review in [investigation.md](investigation.md#31-can-the-27-statements-be-reduced-further) found these alternatives:

| Approach                                   |             Statements including pending lookup | Decision                                                                                                    |
| ------------------------------------------ | ----------------------------------------------: | ----------------------------------------------------------------------------------------------------------- |
| Existing ContentRepository                 |                                              27 | Selected: already exported and used in this project                                                         |
| Count-free recent-page reader              |                                              14 | Sensible native API improvement, but not offered by installed EmDash 0.38.0                                 |
| Three grouped `UNION ALL` reads            |                                               4 | Same summary fields/order on local data; requires direct EmDash table/schema coupling                       |
| Existing repository with EmDash coalescing | 27 in 2 binding calls in the local driver probe | Revisit first if database round trips remain a bottleneck; experimental opt-in requires D1 session behavior |

Use concatenation to combine these independent collections. Grouped reads must keep each collection's five-row indexed limit; the installed D1 adapter declares a five-branch compound-SELECT limit, hence groups of 5/5/3. The four-statement experiment excluded 13 diagnostic schema-discovery queries and did not validate hosted latency or all publication states. It establishes feasibility; production integration and a latency gain remain unproven. Accepted-state comparison also depends on R2 and cannot be eliminated by a D1 join.

EmDash's native coalescer kept 26 repository statements in one batch and the dependent pending lookup in one further call, with identical local results. It is disabled in the current config and enabling it changes the CMS database session path; it is not a free Overview-only switch or an auth-session change. If remaining latency is dominated by D1 round trips, benchmark this supported option before considering a custom reader. Do not add a custom batching driver, vendor fork or content projection table for this slice. A smaller SQL count alone does not justify those costs.

### 3. Make browse startup load browse features

Place the smallest editor boundary behind the existing selected-document/feature intent in `ContentApp`/`ContentFields` and their editing controls. Keep rich-text, picker and edit-only selling/stock code and CSS off Pages and catalog-list startup; retain shared UI primitives and summary price/stock text already returned with catalog rows. Reuse React lazy/Suspense and existing loading/error primitives. Verify the boundary in built assets, not just source imports.

Astro currently includes lazy-editor CSS in the document head, and controlled stylesheet delay blocked island module discovery. A JavaScript-only dynamic import is not acceptance. Use Vite's processed `?inline` CSS imports inside the lazy feature, rendering the styles once with that feature instead of a side-effect stylesheet import. Preserve the existing `emdash` cascade layer. Verify no equivalent CSS is hidden in the browse bundle or eagerly emitted in its HTML. Opening an editor must obtain and apply its styles before usable controls, with no unstyled flash; preserve private preview and direct editor links. Use the existing build, not a CSS loader package or patched Astro plugin.

No preload, shell-flattening, router or font-delivery work is selected: module fetches already overlap and the local Stock parent/child hydration gap was 0.4 ms. Static identity checks and private revalidation remain unchanged.

### 4. Remove the Stock delay at its actual source

The existing 300 ms search effect runs on mount and on area, format and cursor changes. Resolve initial URL state before issuing one immediate inventory read, then issue filter/page reads immediately. Debounce only text-input changes; keep the current typing interval. Use the existing inventory query identity and stale-result guards rather than another timer/cache layer. Avoid an immediate default query followed by a corrected URL-state query. Maintain selected-variant detail loading, hidden/offline handling, recovery and input protection.

Verify delayed initial URL setup, nonempty initial search, filter/cursor changes and rapid typing in the existing Stock checks. The implementation must remove the artificial interval, not claim that all network requests complete within 300 ms. Artwork enrichment remains nonblocking after inventory.

### 5. Make initial and refresh states truthful

Keep static `/content/` routing. Render neutral workspace loading before the browser resolves the query destination, then the requested section's loading state. Do not render `Artists`, `0`, or `No matching content` as real results for Website/Releases/Distro before the selected read finishes. Use existing layout/loading primitives and retain controls/focus behavior; this is not a shell redesign or a zero-layout-shift requirement.

For Overview, keep empty results distinct from loading and keep successful empty results settled during background refresh. A first load can block unavailable controls; later refresh retains each panel and shows unobtrusive checking/error feedback. Other staff tasks retain their existing input and recovery protections.

Overview's initial call bypasses the refresh wrapper, while each panel uses an uncoordinated API call. The controlled race produced six calls instead of three. Add existing `readStaffQuery` coordination at each panel resource boundary, sharing that identity across initial, retry and refresh paths. Keep wrapper keys distinct from any resource query they await: do not create recursive same-key fetches. Retain generation/request guards and independent panel completion. Separate `hasLoaded` from `items.length`; preserve explicit freshness checks, polling and hidden/offline behavior. Mutations still obtain authoritative baselines. No second cache or browser persistence is needed.

The caller audit found existing resource coordination in Content and Stock lists. Fix the Overview callers; no shared-helper rewrite is needed. Coordinate overlapping ContentApp state with `fix-staff-catalog-pagination-and-back-navigation` without taking over its behavior.

### 6. Acceptance measures usable content and variability

Extend existing backend and built workspace checks with focused regressions for the selected changes. Keep projection equality, the initial/focus race and settled-empty refresh, immediate Stock navigation reads with typing debounce, truthful destination loading, and built editor resource/style boundaries. Retain existing thumbnails, private 200/304, no auth-session/KV writes, save/conflict/recovery and publication checks.

After implementation, run `pnpm validate` and `pnpm validate:editor` against the final source, plus relevant `docs/content-workspace.md` / `docs/content-publication.md` checks not already covered. The editor command includes both built Chromium and Firefox workspace runs; do not require duplicate manual runs after they pass. Local success is a prerequisite, not PRD performance evidence.

For authorized UAT deployment, retain normal release gates and smoke Overview, Website, Stock and Distro once each for functionality and resource boundaries. Do not repeat the complete performance sample there. After separately authorized PRD promotion, pin source/version, dataset/page/viewport, browser and network conditions. Measure one initial resource-cache visit and three normal-cache visits per route: at most 16 PRD activations. Use an existing Access session, record login separately, and label actual cache state for shared assets rather than assuming four independently cold routes. Add at most one focus-return check and one three-GET document/workspace/publications control if needed. Each environment needs a fresh Free-tier worksheet covering assets, thumbnails, native count-query cost, auth and background overhead; stop on quota warnings or estimate overruns.

Targets on stable desktop broadband remain warm median HTML TTFB ≤500 ms and visible usable content ≤1500 ms per route. Also report document-to-first-API delay, optional resource requests, loaded/failed thumbnails and every visit above 2500 ms. Retain slow samples with their cause or uncertainty; investigate repeatable application delays and keep functional regressions open. An isolated transport/tool outlier may be qualified with supporting evidence, without requiring a new tracing system or claiming all visits are fast. Count false initial results as failures, not successful paint.

No specific country or geographic acceptance run is required. Record the actual connection and partition changed ingress/cache conditions before comparison. Use medians/ranges for small samples, not p95. Record startup and data-ready milestones separately from artwork completion. The retained 25-row Stock image contract remains ≤1 MiB and zero original requests. Claims cover the measured candidate and conditions; local deterministic success is not an absolute guarantee of hosted latency.

## Risks / Trade-offs

- **Unattributed network/entry delay remains** → obtain correlated evidence; keep hosted latency acceptance open if the application improvements do not meet the target. Do not promise a gain from relocating state.
- **A narrow Overview projection changes publication truth** → compare incomplete, pending and accepted-revision fixtures; retain current pointer reads and pending checks, and keep exhaustive discovery in Review.
- **Lazy editor boundaries break save/preview or omit CSS** → test direct editor loads and browse-to-editor transitions in the built app, including failures, focus, autosave and dirty navigation.
- **Retained display data looks current during refresh** → show checking/failure state; preserve authoritative rechecks for writes and stock conflict handling.
- **Missing catalog thumbnails distract from latency** → retain placeholders and exact failed keys; keep any derivative preparation in a separately budgeted operation. No original fallback or retry loop.

## Migration Plan

No data migration or resource change is planned. Implement and validate locally after a new user request. Once deployment is authorized, use the existing UAT candidate and reviewed full-SHA/candidate PRD promotion process, with a fresh Free-tier worksheet for each environment. UAT supplies the smoke result; the bounded PRD sample addresses the reported slowdown. If repeatable application slowness remains, preserve evidence and keep performance acceptance open.

Deploy and roll back the combined staff/CMS artifact together. Retain the old unscoped adapter mode for already-open tabs; no version handshake or mixed-deployment fallback is needed. Rollback uses the preceding canonical code artifact and requires no data rollback.

# Proposal

## Why

PRD staff navigation still has visible, variable waits after `reduce-staff-request-latency`: the second measurement round found a 1.58-second warm median for Overview, warm Website/Stock outliers near three seconds, and a 3.43-second Distro activation. The thumbnail improvement holds, but delayed startup, unnecessary editor resources, and the Overview aggregate read still need attention.

The [deep investigation](investigation.md) reproduced Stock's unconditional 300 ms delay, browse startup blocked by closed-editor CSS, duplicate Overview reads, and empty-panel refresh spinners. A reader fixture issued 58 SQL statements for an empty Overview; the existing supported repository needs 27 including its publication lookup. This is the selected simple reduction, not a minimum: local experiments also verified four statements using grouped collection reads, and 27 statements in two binding calls using EmDash's batching driver. Those alternatives have integration costs and no measured PRD latency benefit yet. Index candidates are recorded on the same basis.

## What Changes

- Remove Stock's initial/filter/pagination debounce while retaining text-typing debounce, resolved URL state and recovery.
- Keep Website and Catalog browse startup independent of unopened editor, picker, selling, and stock-editor features. Preserve the existing lazy rich-text editor and remove its stylesheet from browse-only startup.
- Render a truthful loading state for the requested staff destination instead of briefly showing an empty Artists collection.
- Reduce Overview's recent-drafts projection with EmDash's already-used exported content repository, skipping unused SEO/byline, artist and commerce enrichment while retaining publication truth and recent-work semantics.
- Reuse existing request coordination for Overview's initial/retry/focus/reconnect reads and retain settled panels, including successful empty results, during refresh. Preserve authoritative mutation checks and existing full-document navigation.
- Extend performance acceptance to cover startup-to-request delay, visible readiness, slow individual visits, and settled refresh. Remove the country-specific acceptance gate; retain recorded network conditions and tooling limitations.
- Keep tracing, query consolidation/batching and index benchmarks as conditional follow-up if the candidate remains slow. They are not prerequisites for the reproduced fixes; any selected additional change needs evidence from the affected path.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `staff-workspace`: strengthen immediate Stock reads, browse startup, truthful loading, background refresh, bounded Overview reads, and repeatable hosted performance acceptance.

## Impact

- Primary seams: `apps/staff/src/components/StaffOverview.tsx`, `components/stock/StockOperationsApp.tsx`, `components/content/ContentApp.tsx`, `components/content/ContentFields.tsx`, feature styles, and `apps/backend/src/cms/staff-workspace.ts`. Reuse `lib/staff-query.ts`; no shared-query-helper, shell, or entry/auth/asset rewrite is selected.
- Reuse the existing Astro/React build, TanStack Query, supported EmDash APIs, and existing local hosting/workspace checks. No dependency, router, persistent private-data cache, database migration, binding, paid plan, or object relocation is proposed.
- Coordinate shared navigation and list-state changes with `fix-staff-catalog-pagination-and-back-navigation`; this change does not take over that change's pagination or Back behavior.
- This is a new follow-up. Keep the archive as history. [measurements.md](measurements.md) records the PRD baseline; [investigation.md](investigation.md) records causal tests and index findings; [design.md](design.md) and [tasks.md](tasks.md) define future implementation. The main spec's geographic gate is retired now at the user's request.

Planning only. No application implementation, deployment, content publication, thumbnail preparation, or commerce mutation is authorized by this proposal.

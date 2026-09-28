# Upgrade acceptance

Source: working tree on `main`, based on `757680fdf75b2544322b0b6d7e53112da97da558`. Pre-existing changes to AGENTS.md and docs/agent-reference.md remain outside this upgrade's scope.

## Local evidence

Logs are retained under `.codex-artifacts/emdash-1.0.1-*.log`. The final `pnpm validate` log identifies the source-bound summary, mode, status and before/after fingerprints; do not reuse an invalidated run.

The final summary pointer is `.codex-artifacts/emdash-1.0.1-final.json`. Repository completion requires its status to be `passed` with matching fingerprints; the tracked checklist alone does not establish that gate.

- `frozen`: frozen lockfile installation, all three direct packages at 1.0.1.
- `build`: canonical CMS build, including the no-KV guard and regenerated migration manifest. `local-stack` records the subsequent rebuild with the relation projection fix.
- `rest`: compiled REST races, stale/malformed revision rejection and deletion without resurrection.
- `upgrade`: copied pre-upgrade D1/R2, migrations 088/089, two starts, scheduling instants, seed completion, dates, revisions, media, references, stock/prices and accepted pointer preservation. The stopped source backup remains in `.codex-artifacts/emdash-1.0.1-pre-upgrade-state`.
- `content`: fresh initialization, all 13 collections, native Artist references, unsafe URL rejection without partial saves and private drafts.
- `import`: 129 records and 152 media paths; repeated import retains identities without duplicates.
- `render`: Portable Text matches all four nonempty source Markdown bodies.
- `staff`: authenticated staff hosting, private caching, public alias denial and no session cookies.
- `editor`: Chromium and Firefox editor suites passed. Source and screenshots are in `.codex-artifacts/validation/2026-09-28T14-54-20-713Z-104980/`.
- `reference`: all 18 publication unit tests passed, including new merge-baseline metadata exclusion and selected-revision Artist resolution.
- `publication`: actual Local snapshot publication, combined preview, idempotent retry and unrelated-draft privacy passed after rebuilding the projection fix.
- `preview`: Chromium and Firefox passed every preview route, actual newsletter typing and formatting-only autosaves, shell history/search, cart isolation and persistent player integration. All mobile/desktop public-preview screenshot pairs had zero differing pixels. Intentional checkout requests remained forbidden.
- `shell`: 42 files / 192 shell and player tests passed. No shell or routing source changed.

Chrome's blackbox profile also rendered the Local Website and Catalog screens, including native Artist names, prices, stock and draft/publication status. Browser preview parity results and screenshots are retained by the existing preview suite under `apps/backend/.codex-artifacts/preview-parity/`.

## Findings and test setup

EmDash 1.0.1 adds `_referencesBaseline` inside revision data. The real publication smoke exposed its leakage into strict content validation. The existing shared projection now strips that internal field; it continues resolving the Artist from the selected revision, never from the merge baseline or a newer draft. A focused regression covers the differing baseline Artist.

The REST fixture needed commerce migrations for the current discard policy. The content fixture needed application migrations before workspace reads, while retaining its pre-migration fail-closed assertion. Existing draft-only Artist/Release deletion behavior is reflected in the fixture. No product permissions were relaxed.

Earlier staff/editor runs overlapped shared ports/build output and were discarded. Serial reruns passed. A preview setup timeout was retried separately. The first full local validation passed both lanes but was invalidated when the projection fix changed the source; only the final unchanged-tree run establishes repository acceptance.

The next validation run also passed both lanes but was invalidated by the concurrent creation of `openspec/changes/allow-cms-backups-during-edits/.openspec.yaml`. That separate change is preserved. Its source changes must not be attributed to this upgrade.

## Hosted gates

No UAT or PRD mutation has been performed. The current UAT release observed during preparation is run 36436534684 at the baseline SHA above; it is not an upgrade candidate.

UAT still requires its editorial pause, current account-wide Free-tier budget, target migration history, stored-URL preflight, verified database/media backup and accepted-pointer capture before rollout. PRD requires separate explicit approval of the accepted immutable upgrade candidate. Catalog mutation and shopper launch remain separate gates. Local results establish none of these hosted prerequisites.

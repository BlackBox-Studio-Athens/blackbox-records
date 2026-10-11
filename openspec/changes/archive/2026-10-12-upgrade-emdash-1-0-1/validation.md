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

The backup change was released separately as 20f223cd11e2814130b8717d734c7a14f3ee9d96. Its UAT candidate 36446508852 and PRD promotion 36449141162 still contain EmDash 0.41.0. The upgrade implementation is committed locally as a0eecccca619070db7f33d2cef55206de5787d29; PRD upgrade approval has not been given.

The later successful `mode: local` run `.codex-artifacts/validation/2026-09-28T15-45-27-359Z-60012/summary.json` has matching before/after fingerprint `7fb68c2d1f05b0bab80e70ea941fbe6964f1441f8a9c86113b91ebce16ef2b01`. On September 28 at 17:18 UTC, `sourceIdentity` confirmed that the upgrade implementation tree exactly matched it. The commit changes Git identity, not the tested file contents; code tests are reused. Subsequent rollout-note edits receive a documentation-only local checkpoint against that implementation commit.

UAT preflight on September 28 around 17:20 UTC:

- Core history ends at 087; there are no cron tasks and no seed-complete marker. Expected pending core migrations are exactly 088 and 089. Neither rewrites editorial content; the timestamp update compares its original value and marker insertion ignores an existing marker. No editorial pause is needed for this confirmed path.
- Backup workflow 36447631911 succeeded. Its UAT capture completed at 16:05:55 UTC with point `2026-09-28-pre-upgrade`, 579 objects and 434,192,751 bytes, within the documented 24-hour recovery objective. Reuse this verified capture instead of repeating it. The backup implementation supports edits during capture.
- The UAT accepted pointer is publication `137fa676-688f-491d-a873-cce7f98dfce9`, generation 116, snapshot SHA-256 `20338ace8a5d2c2a7ccb7b091fae423905fcf3262d851936a792bba7e665c1e2`. The full pointer is retained in `.codex-artifacts/emdash-1.0.1-uat-pointer-before.json`.
- The two native URL fields are Distro Bandcamp/Tidal URLs. All 278 nonempty values across 103 content rows and 206 revisions passed the installed 1.0.1 URL validator. Only IDs/field names would be reported for rejection; no content was rewritten. Results are in `.codex-artifacts/emdash-1.0.1-uat-url-report.json`.
- Account-wide dashboard usage: Worker requests 21,968/100,000 today; D1 reads 412.56k/5M and writes 14.18k/100k today; R2 Class A 2.65k/1M, Class B 96.81k/10M and storage 1.5/10 GB. Reserve at most 2,000 Worker requests, 50,000 D1 reads, 5,000 D1 writes, 100 R2 Class A and 2,500 Class B operations for this single release/preflight/acceptance, including preparation reads and provider smoke. This leaves over half of every operation allowance for normal service. Do not automatically retry a quota failure or start bulk imports. No new resources, KV, sessions or paid capacity are introduced.

## UAT release accepted

[Release 36458345173](https://github.com/BlackBox-Studio-Athens/blackbox-records/actions/runs/36458345173) completed successfully on September 28 at 17:39 UTC for source `a8b78851de3ea0c44a967498d731131a5daffea7`. Candidate validation, both target artifact builds, UAT Worker/Pages deployments, quick checks, provider smoke, release-identity checks and immutable bundle assembly passed. All PRD deployment/catalog jobs were skipped. The implementation commit is `a0eecccca619070db7f33d2cef55206de5787d29`; the candidate additionally includes the rollout notes.

The rollout documentation checkpoint `.codex-artifacts/validation/2026-09-28T17-24-34-174Z-102496/summary.json` passed with matching before/after fingerprint `df8f575f77af067381fbb13f89e1c2cb43a6729a1ac7127c10fbe3756e52aaa9`. Full implementation checks were reused as described above; CI independently validated the pushed candidate. Structured release evidence is `.codex-artifacts/emdash-1.0.1-release.json`.

After deployment, a bounded D1 read confirmed 088/089 applied, `emdash:seed_complete=true`, and zero cron tasks. The accepted publication pointer exactly matches the preflight pointer, including its snapshot hash and generation. Chrome's blackbox profile loaded the deployed UAT Catalog and Disintegration editor with Artist Afterwise, existing stock/prices, rich text and a rendered `Preview up to date` panel. This browser check did not edit or publish content. Before/after D1 and pointer evidence is retained in `.codex-artifacts/emdash-1.0.1-uat-{before,after}.json` and `.codex-artifacts/emdash-1.0.1-uat-pointer-{before,after}.json`.

Post-release account-wide usage remains within Free limits and the planned headroom: Workers 22,921/100,000 today; D1 reads 427.08k/5M and writes 14.27k/100k; R2 Class A 2.65k/1M, Class B 97.37k/10M and storage 1.5/10 GB. Dashboard deltas include other account traffic and can lag; they are not exact per-release metering.

PRD remains on its separately released 0.41.0 candidate. Promoting this accepted 1.0.1 candidate requires separate explicit approval. Catalog mutation and shopper launch remain separate gates.

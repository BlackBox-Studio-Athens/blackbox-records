# Local validation

## Source and scope

Implemented on primary `main`, based on `5e20af38a672fc2b9fae9b3c3460fbb6b59879f5`. The change is uncommitted. Product Environment: Local. The script, its existing Node test file and the backup runbook are the only changed implementation/operational files.

Backup R2 actions allow three attempts and share twenty additional attempts per capture. Backoff is one then two seconds. A media-body retry obtains a fresh response and preserves the original inventory ETag check. Captured bytes and completed objects count once. D1 snapshot execution, restore imports, manifest version, retention and all previous integrity/budget guards remain in force. The existing thirty-minute workflow timeout is unchanged.

## Checks and evidence

- The first request/body recovery tests failed before implementation. The sustained-failure test observed one request instead of its required three. Evidence: `.codex-artifacts/cms-backup-retries-20261021/red-before-retry.log`.
- `node --test apps/backend/test/emdash/cms-backup.test.mjs`: 42 tests passed, zero failures or skips on the formatted source. Evidence: `.codex-artifacts/cms-backup-retries-20261021/node-tests.log`.
- Faults cover source/retained-point requests and bodies, all list stages, failed-page cursor reuse, blob heads, lost blob/point write acknowledgements, and lost expired-point/unused-blob delete acknowledgements. Assertions verify exact restored SQL/media/metadata, identical replayed writes, retained blob checksums, no completed-object redownload and no duplicate byte accounting.
- Failure checks cover per-action and shared retry exhaustion; authentication/quota/unknown errors; changed or missing referenced media; row/object/byte ceilings; malformed retained manifests; and unchanged single-attempt D1/restore execution. The existing corrupt-blob rejection and seven-point retention tests also pass.
- `pnpm openspec -- validate fix-cms-backup-retries --strict`: passed.
- `pnpm agent:check`: passed for eleven guidance documents. `git diff --check`: passed.
- `pnpm validate`: passed all fifteen selected Nx tasks in `mode: local`. Summary: `.codex-artifacts/validation/2026-10-21T09-15-30-648Z-50032-625e54/summary.json`. Before and after fingerprints match: `f2803faf6bc49380955d5a1df6b6a3e199063af253521fb61eb31eebb3ea7d33`; no source changes during validation. The final run after this evidence-only update is recorded in `.codex-artifacts/cms-backup-retries-20261021/final-validation.json`, including its summary path and matching final fingerprints.
- Post-format implementation, test, runbook and unchanged workflow SHA-256 values: `.codex-artifacts/cms-backup-retries-20261021/source-hashes.json`.
- `graphify update .`: completed with 29,984 nodes, 47,400 edges and 2,245 communities. Local AST extraction only. The existing missing SQL parser and partial extraction of `scripts/pages-workflow-contract.test.ts` remain graph limitations; no semantic labeling or paid API ran.

## Acceptance boundary

The acceptance matrix's tooling row applies. Local content tests, architecture checks, backend lint/type checks and deterministic backup/restore fixtures passed. Browser, shell/player, staff editing, commerce, publication, asset and release rows do not apply: their runtime behavior and data are unchanged.

No hosted request, quota-consuming backup, provider configuration change, commit, push or deployment occurred. Hosted recovery and operation allowance remain unverified. Before any hosted pilot, inspect fresh account-wide headroom and budget up to twenty replayed storage actions, repeated body transfers and proxy overhead. Persistent provider/proxy failures still fail within the retry limits or outer workflow timeout. This work does not add persistent checkpoints or guarantee availability during an outage.

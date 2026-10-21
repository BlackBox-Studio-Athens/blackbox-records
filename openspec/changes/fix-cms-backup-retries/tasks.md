# Tasks

## 1. Bounded backup recovery

- [x] 1.1 Add bounded transient R2 retries, fresh body reads and safe progress diagnostics; verify successful fault recovery without duplicate captured bytes or completed-object downloads.
- [x] 1.2 Add fault tests for list pagination, reads, heads, lost write/delete acknowledgements and retained-manifest reads; verify exact restored SQL, media, metadata and retained blobs.
- [x] 1.3 Cover sustained failures, shared retry exhaustion, changed/missing media and existing row/object/byte/checksum guards; verify invalid captures remain fatal and restore/D1 execution is not replayed.
- [x] 1.4 Update the backup runbook with retry bounds, operation/transfer overhead and the remaining manual-failure procedure; verify documentation matches the tested constants and unchanged workflow.

## 2. Local acceptance

- [x] 2.1 Refresh Graphify, run strict OpenSpec validation and final `pnpm validate`; record source-bound evidence and explicit hosted-acceptance exclusions in `validation.md`.

# Tasks

## 1. Capture and derive

- [x] 1.1 Preserve launch-state, exact aggregate queries, responses and UTC capture times before processing; verify the cutover timestamp and first apex RUM minute.
- [x] 1.2 Derive the aggregate with exclusion counts and an assert-based reconciliation against the frozen source; record the source hash and unsupported dimensions.

## 2. Merge and verify

- [x] 2.1 Merge the committed aggregate once for the matching site and overlapping dates, advance the cache version, and pass Worker tests for ranges, boundaries, cache hits and unchanged response contract.
- [x] 2.2 Document Stats sources and limitations and pass strict OpenSpec validation and final `pnpm validate` without formatting unrelated dirty files.

## 3. Deliver

- [ ] 3.1 Commit only task files, fetch and verify ancestry before push, follow the push run to green and verify the UAT SHA; record concrete evidence.
- [ ] 3.2 Evaluate all production conditions and either verify authorized PRD promotion/launch acceptance identity or record the blocking condition with PRD and launch acceptance unchanged.

# Tasks

## 1. Operator access

- [x] 1.1 Add the local entry point, validated inputs, interactive write gates and allowlisted Access transport. Check with mocked identity and safety tests.

## 2. Staff operations

- [x] 2.1 Implement Distro create, existing setup, publication and stock count. Check API bodies, retry identity and results with mocked requests.
- [x] 2.2 Add the operator usage and recovery instructions. Run the focused CLI tests and `pnpm agent:check`.

## 3. Distro create recovery and CLI confirmation

- [x] 3.1 Accept the omitted empty legacy Distro `group` during create and keep the content comparison strict for other values. Check source reuse and same-operation replay.
- [x] 3.2 Migrate CLI parsing and help to pinned Commander. Add and document `--yes` for writes. Check both environments, dry runs, usage errors and the PRD live gate.
- [x] 3.3 Run the focused checks, strict OpenSpec validation and local completion checks. Record evidence in [validation.md](validation.md).

## Workflow follow-up

- The coordinator runs the first hosted UAT check. See [local verification](validation.md).

# Tasks

## 1. Durable dispatch choice

- [x] 1.1 Add the suppression migration and atomic persistence choice; verify migration preservation, opt-out, concurrency, undo/re-mark and rollback tests.
- [x] 1.2 Extend the protected API/service and regenerate contracts; verify default/true/false validation, access controls and scheduled no-send integration tests.
- [x] 1.3 Document the silent-mark procedure and release/rollback constraints in the commerce runbook.

## 2. Staff controls

- [x] 2.1 Implement the checkbox and saved skip state across Staff callers; verify focused rendering/API tests and fixtures.
- [x] 2.2 Extend the Local browser fixture journey for checked/unchecked marks, refresh/failure, order switching, undo/re-mark, keyboard and phone/desktop layout; run the focused journey.

## 3. Integration acceptance

- [x] 3.1 Update Graphify after the code batch, pass strict OpenSpec validation and final pnpm validate, and record source-bound evidence.

## Workflow follow-up

- Release through normal UAT/PRD gates: migration before updated Worker, API proof of explicit false before Staff exposure. Keep suppression-aware code on rollback.
- After production acceptance, the user records the real order's shipment with Send shipping email unchecked. Do not mutate that order during implementation or testing.

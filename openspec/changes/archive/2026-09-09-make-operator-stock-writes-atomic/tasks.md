## 1. Stock Transaction and Revision

- [x] 1.1 Run `pnpm openspec:guard`, map every repository/direct-SQL stock writer and protected stock caller, and add a real local D1 operator/paid-settlement race regression reproducing the lost-sale balance; verify the expected final quantity fails on current behavior.
- [x] 1.2 Add the non-negative Stock revision through an additive migration and regenerate Prisma; verify existing rows initialize safely and prior migration history is unchanged.
- [x] 1.3 Replace separate stock/ledger saves with guarded D1 delta/count transactions; verify current-quantity arithmetic, zero-row conditions write no orphan audit entry, and injected ledger failure rolls back stock writes.
- [x] 1.4 Advance revision in every stock writer, including paid finalization and existing-row preparation updates; verify a paid decrement invalidates a previously read recount token and stock-only/online-only changes cannot bypass revision.

## 2. Protected Recount Conflict Contract

- [x] 2.1 Expose revision in protected reads and require `expectedRevision` for recount writes: integer for an existing row, explicit null for absence. Regenerate internal OpenAPI/client; verify omitted/malformed values are validation failures and stale/absent-versus-zero conflicts return 409 without mutation.
- [x] 2.2 Retain the recount's original precondition while editing; handle 409 by refreshing stock, preserving count/notes, and requiring reassessment. Verify background refresh cannot silently bless a stale count, uncertain writes are not automatically resubmitted, and accessible feedback/verified actor attribution remain intact.

## 3. Concurrency and Acceptance

- [x] 3.1 Prove real local D1 delta/delta, delta/paid, recount/paid, first-row creation races, non-negative constraints, and stock/audit rollback; verify one matching audit entry per successful operation and that a sale followed by an equal restock still invalidates an old recount revision.
- [x] 3.2 Run `pnpm test:unit`, `pnpm check`, `pnpm build`, and `pnpm audit:commerce-boundaries`; verify the canonical mock launcher/seed readiness and generated artifacts, and update module-boundary spec/manifest only if owned entrypoints or dependencies changed.
- [x] 3.3 Use native Codex Browser Use for local adjustment/recount/conflict flows and retained input; attach actual D1 race evidence rather than inferring concurrency from browser success. Record the approved PRD-only hosted acceptance handoff to `production-go-live-readiness`, including Access allow/deny proof before launch sign-off.
- [x] 3.4 Strict-validate, sync, and archive this correction with accepted local evidence; leave protected PRD proof, migration, and deployment to the launch change and retain stock/audit history on rollback.

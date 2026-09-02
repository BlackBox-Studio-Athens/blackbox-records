## 1. Catalog preparation confirmation

- [ ] 1.1 Add the false-by-default `confirm_live_catalog_changes` workflow input and require both `target=prd` and explicit confirmation for every mutating PRD catalog step; keep PRD planning read-only without confirmation.
- [ ] 1.2 Add `--confirm-live-catalog-changes` to direct catalog apply, reject unconfirmed PRD apply before provider construction, and preserve unconfirmed plan and verification commands.

## 2. Shopper launch controls

- [ ] 2.1 Replace the Worker binding and checkout policy name with `PRD_LAUNCH_APPROVED`, accept only normalized `true`, and remove every active-code compatibility read of `PRD_OPEN_GATE`.
- [ ] 2.2 Keep `native_checkout_enabled` independent and add focused truth-table coverage proving catalog confirmation cannot enable checkout and either checkout control can fail closed before provider work.

## 3. Validation and documentation

- [ ] 3.1 Update runtime validators, environment-model checks, workflow assertions, current documentation, and active OpenSpec references for the separated controls.
- [ ] 3.2 Record the external hard-migration handoff: obsolete GitHub and Worker values are removed during authorized rollout, no persistent catalog-preparation variable is created, and launch approval remains absent until go-live approval.

## 4. Verification and closure

- [ ] 4.1 Run focused catalog, environment-policy, capability, checkout, workflow-contract, and runtime-configuration tests.
- [ ] 4.2 Run `pnpm test:unit`, `pnpm check`, `pnpm build`, strict OpenSpec validation, and a scoped active-tree search proving the retired name remains only in archived history before syncing and archiving the change.

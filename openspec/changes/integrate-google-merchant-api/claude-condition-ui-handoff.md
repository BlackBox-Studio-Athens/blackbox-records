# Claude handoff: physical product condition

Implement the missing Staff condition controls so a physical product can be saved and published with an explicit New or Used condition. Reuse the existing controls and layout. The owner explicitly kept UI implementation and UI tests with Claude; Codex owns the shared condition contract and backend publication guards.

Work in `C:/Users/SVall/WebstormProjects/blackbox-records`, branch `main`, base `80f71d041efe2e3d264dbcf36c09f940ba43e827`. Read the root AGENTS.md and its imports, the Staff content module guide/project metadata, `docs/content-workspace.md`, `docs/content-publication.md`, and this change's tasks/design. Check drift before edits. Preserve unrelated DESIGN.md, docs/backoffice-design.md, other OpenSpec changes and private content. Codex is editing this change's documents, shared content-model condition helper, and backend selected-publication validation/tests; do not duplicate those edits.

## Owned UI slice

- In `apps/staff/src/components/content/ContentFields.tsx`, add **Physical condition** to the existing Release Formats & credits group and beside Distro Physical format. Use the existing `choice()`/NativeSelect and Field/FieldLabel/FieldError pattern. Options: blank **Choose condition**, **New** (`new`), **Used** (`used`). Never infer or default New. The current choice helper always sets required; add the smallest optional requiredness argument while preserving other calls. Unbound digital-only/editorial Releases must remain optional.
- In `apps/staff/src/components/content/ItemSetupApp.tsx`, cover the actual **Add to catalog** flow, not only existing-record editors. Preserve condition through source creation, state, autosave, recovery and submission. Require it for physical sell setup; the editorial-only `sell=false` draft route must remain usable without condition. Preserve existing-record values and all unrelated draft data. Use the same house select pattern, without a redesign.
- Add focused UI regressions in the existing ContentFields and ItemSetupApp test files. Cover blank state, existing New/Used values, explicit selection, field errors, no inferred default, autosave/recovery, physical creation and editorial/digital exceptions. Use the existing accessible label/error conventions.

## Shared contract and boundaries

Codex supplies `requiresProductCondition(collection, data, hasPhysicalStoreBinding = false)` and `getPublicationProductConditionIssues(collection, data, hasPhysicalStoreBinding = false)` from `@blackbox/content-model`. The pure predicate treats Distro as physical and Release as physical when formats include a nonblank value other than case-insensitive `digital`, or an existing StoreItem identity binds it to the physical catalog. Backend callers reuse catalog identity context, without stock/price reads. Keep the Release control visible even for editorial/digital records (blank is allowed when unbound); physical ItemSetup requires a choice independently of transient format state. Publication requires an explicit `product_condition` of `new` or `used` for selected physical records. Draft storage and historical accepted schemas stay optional. Reuse the predicate; do not add a default condition or a second rule. Coordinate any interface mismatch through the return file rather than editing Codex-owned backend files.

The current published catalog has 97 explicit conditions, including three Used tapes. Two private raw-preorder Release drafts have New staged, but their unrelated catalog-number edits must remain private. Do not publish/reset those drafts, clear preorder state, or modify stock. Normal publication must accept condition before a record becomes Merchant eligible.

## Verification and return

Run `pnpm openspec:guard` before edits. Use `pnpm test staff-content` while editing, then the repository's required `pnpm validate` on your final tree; honor feedback-policy.json and do not request a full-project grant by default. Record exact source fingerprint, commands/results and any checks not run. Do the applicable focused local browser check for controls/errors if available; local tests do not prove release or Google acceptance.

Existing evidence belongs to base80f: the fetch receiver regression passed42 focused tests and UAT run40887281236 succeeded. PRD promotion40888838980 failed before writes because the CMS D1 read returned500; a fresh14:56UTC check still failed. The official Cloudflare incident is linked in validation.md. These results do not validate your UI edits. No live changes are part of this handoff.

Authorized: this small UI slice and its tests, locally on main. Reserved for the coordinator: commit/push, deployment, publication, credentials, flags, account/provider calls and production activation. Do not invoke another agent or broaden layout/copy changes. Save a concise return with changed files, contract usage, tests, source fingerprint, remaining limitations and any conflicts to `C:/Users/SVall/WebstormProjects/blackbox-records/openspec/changes/integrate-google-merchant-api/claude-condition-ui-return.md`.

User-passed instruction:

Read and carry out C:/Users/SVall/WebstormProjects/blackbox-records/openspec/changes/integrate-google-merchant-api/claude-condition-ui-handoff.md; save results to C:/Users/SVall/WebstormProjects/blackbox-records/openspec/changes/integrate-google-merchant-api/claude-condition-ui-return.md.

## Review finding: persist an explicit blank selection

The in-progress UI changes omit `product_condition` when the operator selects blank (`choice` with `omitBlank`, and `productConditionData('')` returning `{}`). Native content updates merge present keys. Omission therefore preserves a previously saved New/Used value after autosave and reopen. Fix this before returning completion: send explicit `product_condition: null`, and carry that clear through both existing editors and ItemSetup/autosave/recovery. Codex's native persistence regression below proves null is supported. Do not infer New or silently retain the old value.

Add a regression through the real native partial-update/read contract: save New or Used, explicitly select blank, save/reopen, and verify the condition is absent in the normalized draft and physical publication is blocked until a choice is supplied. A helper assertion that the property is omitted does not prove persistence. Coordinate any required non-UI native persistence fixture with Codex; preserve unrelated draft fields throughout.

Codex added `apps/backend/src/cms/native-condition-clear.worker.test.ts` for this native transport contract; it passed 1/1 on 2026-10-29. Actual installed ContentRepository on local D1 retains Used for omission, persists explicit null as SQL NULL, and a new native reader omits the cleared condition while preserving the private title. Physical publication then fails the condition guard. Claude should test that UI clear events and autosave payloads send null, without duplicating native database infrastructure.

The combined in-progress validation also found two Staff test type errors to fix within this UI slice: `ContentFields.test.tsx:20` stores NativeSelect props in a DOM select props array, but the house control's `size` is `'default' | 'sm'`, not numeric; type the captured props from the actual house control. `ItemSetupApp.test.tsx:120` explicitly supplies `productCondition: undefined` to an optional property under exactOptionalPropertyTypes; model omission separately or use the intended explicit clear type. Do not weaken project type settings. The same run passed 188 cms-runtime and 42 Google-merchant tests; it is not final combined-tree validation because UI and handoff edits occurred during the run.

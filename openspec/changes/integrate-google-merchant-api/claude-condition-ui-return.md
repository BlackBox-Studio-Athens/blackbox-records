# Claude return: physical product condition UI

Status: the UI slice is implemented and has focused tests. Nothing is committed, deployed or published.

## Changed files

Base `80f71d041efe2e3d264dbcf36c09f940ba43e827`. Blob hashes (`git hash-object`) after the explicit-clear correction:

| File                                                          | Blob                                       |
| ------------------------------------------------------------- | ------------------------------------------ |
| `apps/staff/src/components/content/ContentFields.tsx`         | `c50af113cb14d930a9c2500a0ea14d2ed8d065a6` |
| `apps/staff/src/components/content/ContentFields.test.tsx`    | `097d22ef1b52000af1736aae6df092fd243dff62` |
| `apps/staff/src/components/content/ItemSetupApp.tsx`          | `7acea009d832d7add78898890aaaf5d8d79333a3` |
| `apps/staff/src/components/content/ItemSetupApp.test.tsx`     | `104b521ad73ebc798d44fbcba420d3fd80306ace` |
| `apps/staff/src/components/publication/content-validation.ts` | `be8bcdaeaeabb3412b3a8b52eb90a5a7448377d3` |

No Codex-owned file was edited. DESIGN.md, docs/backoffice-design.md, other OpenSpec changes and private content are unchanged.

## Behavior

- **Existing-record editors (`ContentFields`).** `choice()` takes an optional `{ required, clearToNull }` argument. The defaults (`required: true`, blank stores `''`) keep all other calls unchanged. **Physical condition** uses the house Field/FieldLabel/NativeSelect/FieldError pattern. It sits in Release **Formats & credits** after Formats, and in Distro after **Physical format**. The options are blank **Choose condition**, **New** (`new`) and **Used** (`used`). An explicit clear sends `product_condition: null`, so saving clears the stored value. It never stores `''` and never defaults to New. Requiredness comes from `requiresProductCondition(collection, data)`. Digital-only and format-less Releases show the control as **Optional**.
- **Field errors.** Staff `getContentValidation` appends `getPublicationProductConditionIssues(collection, data)`. It parses the shared `"path: message"` string into a `product_condition` issue. Staff uses this validation only to gate publication (ContentApp `intent === 'publish'`, plus the Website changes "Needs details before publishing" label), so draft autosave stays optional. The error shows on the condition control after a publish attempt or after the control is touched.
- **Add to catalog (`ItemSetupApp`).** In new mode, a **Physical condition** select appears after Format. It is required when the item is sold and `requiresProductCondition` is true (Release with a physical format, Distro, Merch). The details step will not continue without it and shows an accessible field error. The editorial-only route (`sell=false`) keeps the control optional and creates the draft without a condition. The state separates a condition that was never chosen (`''`, field omitted) from an explicit clear (`null`, sent as `product_condition: null`). The condition is part of the autosaved draft data and is restored on recovery; only `new`, `used` or `null` are restored. It is also included in the created Release/Distro source data. `setupCommand` rejects source creation without a condition. Existing-record setup (`mode: existing`) neither requires nor copies a condition, so the record's stored value is kept.

## Contract usage

The UI uses `requiresProductCondition` and `getPublicationProductConditionIssues` from `@blackbox/content-model` without changes. It adds no second rule, no default value and no D1 stock/price queries. One assumption is worth recording: Staff parses the issue string format `"product_condition: <message>"`. If Codex changes that format, `content-validation.ts` must follow.

## Explicit-clear correction

The follow-up changed explicit clears from an omitted field to `product_condition: null` in the Release/Distro editors and in Add to catalog. Codex verified the native persistence contract (`native-condition-clear.worker.test.ts`). Staff validation is safe with `null`: `getCmsContentIssues` drops `null` values on known fields, and the shared rule treats `null` as missing.

After the correction:

- `pnpm test staff-content`: passed.
- `pnpm exec nx run @blackbox/staff:typecheck --exclude-task-dependencies`: passed. With task dependencies, the run stops at `workspace:format` because of the untracked `.archify/` files.
- `pnpm validate`: not rerun after the correction. The combined validation and release belong to Codex.

## Tests and checks (first pass)

- `pnpm openspec:guard`: passed before edits.
- `pnpm test staff-content`: passed after the final test edit, including the new condition tests:
  - ContentFields: blank, required state with no New default (Release + Distro); error only after a publish attempt, with `aria-invalid`/`aria-describedby`; existing New/Used values stay selected and the record is unchanged; an explicit choice changes only `product_condition`, and an explicit clear keeps `product_condition: null` in the saved JSON; digital-only and editorial Releases stay optional with no error.
  - ItemSetupApp: physical creation requires an explicit condition for Release/Distro/Merch; Used is carried into the source data; an existing source is neither required nor copied; the draft-data helper sends `null` for an explicit clear and omits a choice that was never made; recovery accepts only `new`, `used` or `null`; `null` cannot create a source; the editorial-only `releaseDetails` has no condition; the SSR render shows a blank required select.
- `pnpm test staff-publication`: passed (it covers the shared `getContentValidation`).
- `pnpm validate`: run `2026-10-29T15-46-14-694Z-43996-efd49d`, `mode: local`, status **failed**. Source fingerprint before and after: `5c49fc663b1562dea06f4c52e68df14c323b57342767a33c7786f1d93ce183a6` (55 files, same SHA). The failures are outside this slice:
  - The first pass ran 55 of 56 tasks, including all Staff test, lint and typecheck tasks. `@blackbox/backend:typecheck` failed at `apps/backend/src/cms/runtime-publication.ts(287,44)` (`string | null` given where `string` is required). That file is Codex-owned and was being edited during the run.
  - The second pass failed on `workspace:format` for two untracked files: `.archify/architecture-merchant-sync-20261029-163925/merchant-sync.html` and `.archify/.../review-4/merchant-sync.finalize.json`. Another process was writing them during the run. They were left untouched.
  - An earlier run of mine found two Staff type errors in my new tests. Both were fixed before this run.

## Not run or not established

- Browser check of the controls and errors: not run. The Local stack was not running, and another validation held all three slots in this shared checkout. Starting the stack there during Codex's work was judged unsafe.
- No publication, release, Merchant or provider acceptance. The two private raw-preorder Release drafts, preorder state and stock were not touched.
- A clean `pnpm validate` must be rerun after Codex's backend edits settle and the `.archify/` output is formatted or excluded.

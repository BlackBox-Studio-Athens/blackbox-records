# Claude return: condition-aware browser fixtures

Status: the test-only corrections are in place. Local `pnpm validate` passed. The focused buy-bar test passed on chromium-mobile. The Chromium and Firefox Staff-preview runs were **not** run locally: they need a maintainer grant, and none exists. Nothing is committed, pushed or deployed.

## Changed files

Base `f5ecffac7352501de6007e2e867752e0c533284b`. Blob hashes (`git hash-object`):

| File                                 | Blob                                       |
| ------------------------------------ | ------------------------------------------ |
| `scripts/test-content-workspace.mjs` | `819c31890fbe1a26af57f87290787097ef0cd90e` |
| `e2e/store-buy-bar.spec.ts`          | `9a4b628d76545c4c06a4acd7514d6b543c7d8f1b` |

No UI, backend, contract or validation code changed. DESIGN.md, docs/backoffice-design.md, tasks.md, validation.md and the other working changes are untouched.

## Staff fixtures (`scripts/test-content-workspace.mjs`)

- `assertCreationPublication` chooses **Physical condition** = `used` by its accessible label before the first Details **Continue**. Used was chosen so a New default could not pass unnoticed. After the reload, the test asserts that the select still reads `used`. After **Create and publish**, it asserts that the created distro source (`New draft for sale`) has `product_condition: 'used'` and that its `_rev` matches the publication command.
- The synthetic happy-path fixtures `data.releases` (Vinyl) and `data.distro` (Vinyl group) now carry `product_condition: 'new'`. The Release fixture has a comment saying the condition is stated, not inferred. This also covers the copies made from them: the `--selling` retained Release and the `--catalog-navigation` browse distro rows. No production default or global normalizer was added.
- Scan: `items/new/?kind=` appears at 1842 (the fixed flow), at 2814 and 3024–3026 (navigation-only checks of the back link) and at 3355 (the deliberately unfinished editorial Release). Those blank draft and navigation scenarios are unchanged. No other test confirms a physical creation. No fixture contains an invalid or missing condition, so there were none to preserve. The whole-data `deepEqual` checks (lines 2039 and 2115) compare only image references, so the new field does not affect them.

## Signed-zero assertion (`e2e/store-buy-bar.spec.ts`)

`Math.round` returns `-0` for an edge in [-0.5, 0), and `toBe` uses `Object.is`, so `-0` fails against `0`. The assertion is now `expect(Math.abs(edge)).toBe(0)`, with a comment. The edge is still rounded to whole pixels, so any whole-pixel gap of 1px or more still fails. The tolerance is not wider and the layout is unchanged.

## Commands and results

- `pnpm openspec:guard`: passed before edits.
- `pnpm test:e2e e2e/store-buy-bar.spec.ts --project=chromium-mobile -g "keeps PRE-ORDER reachable"`: 1 passed. Local layout gives `+0`, so the CI `-0` case was not reproduced. The fix is checked by reasoning about `Object.is` and by this regression run.
- `pnpm exec prettier --check e2e/store-buy-bar.spec.ts`: passed.
- `pnpm validate`: **passed**, `mode: local`, run `2026-10-29T18-57-23-322Z-53352-0a29e6`, 14/14 tasks. Fingerprint `857e6275451e734b6d2c114e55c6e2718acf62f656b158ff3478f1cd94f9e6be` (47 files), the same before and after, at SHA `f5ecffac`. This includes `workspace:format` and lint over the changed script.

## Not run or unresolved

- `pnpm validate:editor --browser=chromium` and `--browser=firefox` (the CI `staff-previews` entry point): not run. `feedback-policy.json` lists `validate:editor`, and direct runs of `scripts/test-content-workspace.mjs`, as release-tier commands. `pnpm local:status` reported `Maintainer grant: none`. The command guard also denied a plain `node --check` of the script because it names the guarded path; that check was not attempted any other way. The Staff fixture change is therefore checked only by format, lint and review, not by a browser run. The coordinator's CI run (or a maintainer-granted local run) must confirm it.
- No live data, stock, private drafts, credentials or flags changed.

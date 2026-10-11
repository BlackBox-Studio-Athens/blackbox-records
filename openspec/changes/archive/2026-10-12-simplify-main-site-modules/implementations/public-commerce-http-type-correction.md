# Public-commerce-http type correction

Correction and scoped checks are complete. Backend package types, final validation and module acceptance remain pending with the verifier. This is an addendum: the original implementation/review, immutable raw reports, both precursor histories, failed final validation and shared tasks remain unchanged.

Same original fresh implementer: `01a126b3-3cda-7830-a165-1c382f231fc2`. Existing `main` checkout, before/after HEAD `f7b019ca043e5f082c5b7aca67c4f0dbb3685ed0`. Only `apps/backend/src/interfaces/http/internal-stock-routes.test.ts` was edited, using native apply_patch, after `pnpm openspec:guard` passed.

## Diagnostic and minimal correction

Read the current test and the exact preserved diagnostics in `.codex-artifacts/validation/2026-10-10T18-15-44-832Z-33872-3ad973/0-affected.log`:

```text
src/interfaces/http/internal-stock-routes.test.ts(393,26): error TS2345: Argument of type 'unknown' is not assignable to parameter of type 'object'.
src/interfaces/http/internal-stock-routes.test.ts(394,26): error TS2345: Argument of type 'unknown' is not assignable to parameter of type 'object'.
```

Removed exactly the two `Object.hasOwn` assertions for `availableOnlineQuantity` and `heldQuantity`. The byte comparison against the captured canonical-main test proves that deleting those two lines produces the entire corrected file; every other line remains identical. No cast, narrowing, new scaffolding, changed fixture, weakened equality or removed test case was introduced. Production and configuration are unchanged by this correction.

## Why wire coverage remains exact

The retained `body` is decoded by the actual HTTP Response's `json()` method. The complete `toEqual` expectation contains fixed fixtures and the matrix quantity `[undefined, 0]`.

Installed `@vitest/expect` 4.1.11 equality uses `hasDefinedKey` for non-strict equality: it ignores undefined-valued keys, compares defined key counts and recursively compares their values. The source at `node_modules/.pnpm/@vitest+expect@4.1.11/node_modules/@vitest/expect/dist/index.js:211–214,360–370,407–411` was inspected and its byte hash retained in `before.json`.

- For undefined quantity, the expectation's two undefined-valued keys are ignored. Parsed JSON cannot contain an own property whose value is undefined. Any represented quantity value, including null or zero, is a defined key and fails the retained complete equality. Therefore the quantities must be omitted from the wire response.
- For zero quantity, both expected keys are defined with numeric value 0. Missing keys, null, strings or another value fail the same equality. Therefore both fields must be present with value 0.

The earlier precursor/main wording overstated the independent value of the presence assertions for this parsed JSON response. This addendum corrects that reasoning without rewriting historical evidence. The removal preserves the wire contract and eliminates the two calls that caused TS2345; package compilation itself was not rerun here.

## Retained cases and accounting

All five precursor cases remain: empty history, mixed history in reader order, successful count projection, low-stock readback with omitted quantities, and low-stock readback with zero quantities. Retained assertions cover 200/no-store, exact reader/mutation calls, complete response projections, ISO timestamps, null notes, returned current revision, ordered links/actions and service-only field omission. All other security, revision, idempotency and error coverage remains byte-identical.

Relative to the canonical main handoff: **0 additions, 2 physical lines deleted, 2 nonblank lines deleted**. Production delta 0; source files added/deleted 0/0; formatting-only credit 0. Audit Markdown and ignored evidence are excluded.

Historical precursor accounting remains 145 physical/138 nonblank additions, counted once. With this separate two-line correction, the combined slice against the original review baseline is now 39 physical production lines removed, 111 physical test lines added net and **72 physical code lines added net**. The conservative nonblank totals are 32 production lines removed, 110 test lines added net and **78 nonblank code lines added net**. The original canonical report retains its historical 74/80 totals; this note supplies the incremental adjustment.

## Actual scoped checks and source binding

- `pnpm openspec:guard`: exit 0 before edits.
- `pnpm test public-commerce-http`: invoked exactly once on corrected source; exit 0. Native JSON confirms **224/224 passed, 0 failed, 20 files**, all 29 stock HTTP cases and all five precursor cases passed. Nx reported 0/1 cache hit.
- Changed-file `pnpm exec eslint ... --max-warnings=0 --no-warn-ignored`: exit 0; existing boundary configuration deprecation notice only.
- Changed-file `pnpm exec prettier ... --check`: exit 0; no formatter writes.
- Scoped diff check and exact two-line byte comparison: passed.

No raw compiler, broad consumer selection, global validation or repeated passing run was invoked. The verifier owns the actual backend package type gate and final acceptance.

Test SHA-256 before: `72932ee3dcd973c72ee6733cd14fd2e1bce9d3e0e34969cc44c67d2200accbd1`; after: `36d51e1f0f4c2fccc80940a5bb8aa8bac2a54f043520e93cf517ce58ee0d26e2`. Owned 43-file aggregate before: `35b70757999c7478c833ea2eb476e84f2f2f0d1222e9ebca6838e80b50235487`; after: `30c51b41ff3ea99e79a68d5292d47284c8a6e37c54e7b2414f57ec8a37dc2a65`. Selected 41-caller aggregate stayed `fb4822123ce9c78b6f00ebb9bb3cd3b3042ad447ad629e6a22881e9325b87f3d`. Aggregation uses repository-relative path/NUL/byte SHA-256/LF rows sorted with `localeCompare(en)`.

The captured 1,582-file source/configuration superset changed in one sibling file during the check: `apps/backend/src/editorial-request-rewrite.worker.test.ts`, outside this ownership and executed HTTP selection. Its start/end identities are retained. Owned corrected source and selected callers remained stable. The entire concurrent checkout is not claimed stable. All 16 protected task, canonical report, failed-validation, raw-report, precursor-history and graph identities matched before/after.

## Evidence and resources

Dedicated ignored evidence: [checks.json](../../../../.codex-artifacts/simplification/public-commerce-http-type-correction/checks.json), `before.json`, `test-start.json`, `after.json`, `internal-stock-routes.before.ts.txt`, `correction-diff.patch`, command records and full test/lint/format logs. [Native test report](../../../../.codex-artifacts/simplification/public-commerce-http-type-correction/native-reports/public-commerce-http.json) SHA-256: `c5d5996df69301a5655a878cd42ab112d6f42835e1b47a1e7bdc291843ea3537`.

All launched test/lint/format sessions exited and the managed test runner released its slot. No controller, Local runtime, browser or provider resource was started. No graph operation, commit, push, deployment, publication or hosted mutation occurred. No acceptance/task marker was changed. Completion covers this correction and scoped checks only.

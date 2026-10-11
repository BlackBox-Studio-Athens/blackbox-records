# Backend-runtime native fixture type correction

**Correction and scoped checks completed; final package/type and module acceptance remain pending.** Same implementer: `01a126b3-3ce1-7692-848a-6adb8165187a`. Existing main checkout; HEAD before/after `f7b019ca043e5f082c5b7aca67c4f0dbb3685ed0`.

Final validation reported TS2352 at `apps/backend/src/editorial-request-rewrite.worker.test.ts:51:87`: the asserted partial object lacked required Field members. The [failed diagnostic](../../../../.codex-artifacts/validation/2026-10-10T18-15-44-832Z-33872-3ad973/0-affected.log) and [failed summary](../../../../.codex-artifacts/validation/2026-10-10T18-15-44-832Z-33872-3ad973/summary.json) remain unchanged.

The installed EmDash 1.1.0 declaration defines `getField` as `Promise<Field | null>` (`dist/config-B6BDSsz2.d.mts:1459`). Field at `dist/types-CLTQ9b_r.d.mts:223` requires id, collectionId, slug, label, type, columnType, required, unique, sortOrder, searchable, indexed, translatable and createdAt. Its validation.relation is a string, not the previous nested collection object.

Only the [owned native test](../../../../apps/backend/src/editorial-request-rewrite.worker.test.ts) changed. No reusable correctly typed owned fixture was available. Its existing inline mock now supplies those 13 required members with fixed Artist reference metadata and `validation: { relation: 'release-artists' }`. The partial `as Awaited<ReturnType<...>>` cast is removed. The existing strongly typed mockResolvedValue parameter checks the complete object directly; no any, double cast, type suppression, helper, production seam or new import was introduced.

Both actual CmsRuntime.fetch cases remain: POST Artist creation omitting null artwork, and PUT Release Artist reference translation retaining saved revision. Every method/URL/header/body/original-header/private-cache/revision assertion is unchanged. Comparison confirms every byte outside the fixture block is unchanged. Native Workerd Request/Headers, production Local guards and isolated D1 setup remain intact. The production branch reads relation truthiness, so the correctly typed nonempty relation slug selects the same rewrite branch.

| Delta relative to canonical main handoff | Before | After | Delta |
| ---------------------------------------- | -----: | ----: | ----: |
| Native test physical lines               |     96 |   109 |   +13 |
| Native test nonblank lines               |     92 |   105 |   +13 |
| Production lines                         |      — |     — |     0 |

One existing test file modified; zero code files added/deleted. Audit Markdown is excluded. Add these 13 test lines once to the canonical main slice's accounting; its historical report remains unchanged.

| Identity                        | SHA-256                                                            |
| ------------------------------- | ------------------------------------------------------------------ |
| Native test before              | `1340efc62b8ecd07e5a0250f3b8bd73f5cb8f4e7b922ef59774882aa59fdd39c` |
| Native test after               | `080e4d4f3ad97733233e7344bcdf25c6481d21e69a989790f52119a823f39ac3` |
| Nine owned files before         | `58a66ca8d21710367c0b869e951b007bfd754396f9c43f6c82acefcb9b569b43` |
| Nine owned files after          | `e03d91f3e0b8a3efeaa68e26c7caff12a13d95487736d644e8ce9706474d3952` |
| 26 connected files before/after | `8fb8ae4a0b0cde9a2147085787d6e9b7d78a1502d01b17fa7303f98455644eb4` |

Full hashes, installed declaration identities and the preservation check are in [before.json](../../../../.codex-artifacts/simplification/backend-runtime-type-correction-20261010/before.json) and [results.json](../../../../.codex-artifacts/simplification/backend-runtime-type-correction-20261010/results.json). All other owned files and connected inputs remain unchanged. Nineteen recorded historical files—including canonical review/implementation, shared tasks, raw review/preparation/precursor results, precursor failures/success and failed final validation evidence—matched their before hashes.

Checks:

- `pnpm openspec:guard` passed before edits.
- Exactly one `pnpm test backend-runtime` run passed uncached: **44/44 tests, five files, both native rewrite cases**, 29.89s Vitest / 32.8s Nx, 0/1 cache hits. [Actual reporter](../../../../.codex-artifacts/simplification/backend-runtime-type-correction-20261010/backend-runtime.json).
- Changed-test ESLint and Prettier checks passed; existing boundary descriptor deprecation warning only.
- Scoped git diff whitespace check passed.

The package type gate was deliberately not run by this role; the verifier must rerun final validation on the corrected stable tree. Passing native tests do not establish package type or full module acceptance. Constructor-only Durable Object and downstream adapter/schema doubles retain their earlier limitations.

All owned commands finished. Closeout: validation slots **0/3 held**, Local stack stopped, port 4321 free, Chrome lease free, no grant. No persistent service, graph operation, provider action, commit or deployment was started. Original canonical reports and every captured historical result remain untouched.

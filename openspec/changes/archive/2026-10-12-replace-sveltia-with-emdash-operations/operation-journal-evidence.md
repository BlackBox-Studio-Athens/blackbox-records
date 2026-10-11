# Catalog operation journal

Task 5.1 adds the typed journal used by the price command and future Item Setup. Migration `0021_catalog_operation.sql` creates a separate `CatalogOperation` table; the Prisma schema and generated client describe it. Existing catalog, provider mappings, stock, reservations, and orders are not modified. The migration has only been exercised in isolated local test databases, not persistent Local, UAT, or PRD.

The journal stores operation identity and kind, the existing server-generated input fingerprint, operator email, variant identity, expected catalog revision, step, constrained result identities, status, and a conditional claim. The command layer must provide the actor from verified operator context and hash validated command input; no browser endpoint or actor-input field is introduced here. Command authorization and provider execution remain tasks 5.2–5.5.

The primary key deduplicates the same operation. A partial unique index permits only one unresolved operation per variant, including work needing review. Beginning an operation validates the input and item revision (new setup may reserve an absent variant at revision zero); replay returns the retained operation only when all original input fields match. A changed request, different actor, or competing operation conflicts.

Claims expire after sixty seconds and use random tokens. Price changes persist a validated phase and the previous Price identity before replacement creation. Step updates compare the token, original step, pending status, and unexpired lease in one SQL statement. Expired workers cannot overwrite a resumed worker. Provider/source/stock result identities cannot be replaced during progression. Completion releases the unresolved-item constraint; uncertain provider outcomes retain results and hold the item for explicit review. The journal does not claim that a lease prevents duplicate external writes: provider idempotency, scoped recovery, and final revision checks remain required in the command tasks.

## Local verification

The actual D1 test covers simultaneous duplicate submissions, changed-input/actor/revision conflicts, competing item operations, simultaneous claims, expired-worker rejection, stale-step rejection, illegal step transitions, retained immutable results, completion replay, and blocked uncertain setup recovery. No Stripe or CMS call occurs. The targeted test and TypeScript check pass; evidence is `.codex-artifacts/emdash-m1/operation-journal-targeted.log` and `operation-journal-types.log`.

The full unit suite, `pnpm check`, `pnpm build`, and strict OpenSpec validation pass. Logs are `.codex-artifacts/emdash-m1/operation-journal-{unit,check,build}.log`. The initial journal-only checkpoint did not complete task 5.1. The subsequent protected HTTP command now supplies verified Access actor identity and the server-generated validated input hash; see price-command-evidence.md for its end-to-end local proof.

## Atomic price completion

`completePriceChange` uses one native D1 batch to complete the journal, increment the expected catalog revision, replace the existing Product mapping's Price, and upsert the Store Offer snapshot. The first statement checks the persisted operation identity/results, unexpired claim, expected revision, item identity, and unchanged previous Product/Price mapping. Its claim token gates every subsequent statement and is cleared at the end. A failed condition changes nothing; any SQL failure rolls back the complete batch. Generic step advancement cannot complete a price change and bypass this transaction.

Isolated D1 tests cover expired claims, an externally changed mapping, unrecorded result substitution, stale catalog revisions, a snapshot uniqueness failure after earlier batch writes, successful Prisma-readable snapshot persistence, and completion replay without another revision increment. Verified operator orchestration and provider interruption recovery are covered by the subsequent price-command acceptance. No persistent or hosted migration or provider call is involved.

Final verification: the full unit suite, `pnpm check`, `pnpm build`, and strict OpenSpec validation pass. Logs: `.codex-artifacts/emdash-m1/price-finalization-{unit,check,build}.log`.

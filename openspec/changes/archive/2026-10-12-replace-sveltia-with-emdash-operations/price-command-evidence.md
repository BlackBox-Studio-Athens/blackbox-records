# Protected price commands

Tasks 5.1-5.5 and the local item price/stock controls in 6.4 are complete. The protected POST route is `/api/internal/variants/{variantId}/price`; it uses the existing Access verifier, catalog journal, scoped Stripe gateway, and native D1 completion. No hosted deployment or persistent database migration is claimed.

## Command and authority

The handler requires matching Origin and `X-Blackbox-Request: 1`. Strict input accepts only operation identity, expected catalog revision, a supported EUR fixed/custom price, and per-operation PRD confirmation. Actor identity comes from the verified Access JWT, never the body or forwarded email. Conflicting input/revision returns a generic 409; interrupted work returns a generic 503 instructing the caller to reuse the operation. Responses contain only operation ID, app variant ID, and pending/completed/review status, with caching disabled. The generated internal API contains `changeCatalogPrice`; the public API has no price-write route.

The gateway uses the already-bound Product, exact application identity, matching test/live mode, the approved tangible-goods tax code, and inclusive VAT. It never scans account Products or creates another Product. Replacement creation preserves historical Prices and their lookup keys. Default selection compares the expected previous Price or already-selected replacement and rereads the Product afterward. Observed external/default/identity conflicts require review; cross-system atomicity is not claimed.

## Recovery and persistence

The journal records the original default before provider mutation and retains the replacement identity. Claims expire after sixty seconds and phase/finalization writes are fenced. Active identical retries stay pending; competing operations conflict. Completed requests replay without provider calls. Unknown acknowledgement failures preserve the phase for retry; known conflicts retain the item for review.

Recovery inspects active and archived Prices only on the bound Product, capped at three pages of 100 per state. Exhausting that budget or finding archived, ambiguous, or mismatched operation identities fails closed. Recovery uses operation ID and server-generated input fingerprint, not provider idempotency-cache retention. Native D1 completion updates the journal, mapping, catalog revision, and Store Offer snapshot atomically. See [operation-journal-evidence.md](operation-journal-evidence.md) for rollback and fencing coverage.

## Local acceptance

- Nine HTTP cases exercise both fixed and custom prices through signed Access verification, the actual application/repository stack, the real Stripe SDK with intercepted local HTTP responses, and native D1. They include normal completion and acknowledgement loss after Price creation, default selection, and the D1 commit.
- Provider faults occur after the fake provider state changes, with automatic SDK retries disabled on that response. The fake has no idempotency cache. After expiring only the isolated claim, retry still yields one Price creation, one default update, and one revision increment. Separate application tests advance their injected clock two days.
- Competing commands return 409; same-input active retries remain pending. Price-list/creation requests assert Product scoping. Unexpected Product creation or Price mutation endpoints fail the test. Previous Price state and paid-order monetary totals/lines stay unchanged.
- The Store Offer application reader, runtime projection reader, and reconciler return the new authoritative fixed/custom price without a content rebuild. Public HTTP composition retains its existing projection source until task 4.3 adoption.
- Boundary tests cover missing authentication, forged forwarded identity, injected actor/provider fields, invalid money, cross-origin/missing headers, missing PRD confirmation, and safe provider-error responses. Gateway tests cover wrong environment, archived/ambiguous recovery, page limits, tax-code drift, and external default changes. Native D1 tests cover stale revisions, expired claims, rollback, and replay.

The full unit suite, `pnpm check`, `pnpm build`, and strict OpenSpec validation pass. Evidence: `.codex-artifacts/emdash-m1/price-recovery-{targeted,unit,check,build}.log`. All provider responses and databases in these tests are local; no hosted Stripe or Cloudflare request is made.

Official provider references were read through Stripe CLI: [create Price](https://docs.stripe.com/api/prices/create), [list Prices scoped to Product](https://docs.stripe.com/api/prices/list), and [update Product default](https://docs.stripe.com/api/products/update). Saved references are `.codex-artifacts/emdash-m1/stripe-*-docs.md`.

## Items workspace — 2026-09-14

`/items/` reuses the existing stock movement/count controls and staff navigation to Orders. Its price editor reads the bound current price and catalog revision through the protected GET route, without provider writes or provider identifiers in responses. Generated internal contracts cover price reads, price changes, and Item Setup; public contracts remain separate. The existing nine HTTP/SDK/D1 price cases now assert authoritative reads before and after each change and no extra writes.

Chrome with the Blackbox profile verified a comma-decimal price of `27,05`, an intentionally lost local reply, and Check again returning the confirmed `€27.05` with the same command identity. Pending input survives reload in session storage. Stock movement uses Add/Remove with a positive quantity; a local show-sale fixture decreased physical stock from 10 to 8. Keyboard focus reaches the confirmation checkbox. At 320 CSS pixels, the page width is 305 pixels and the stock reason control is 44 pixels high. Browser fixtures do not constitute hosted acceptance; real application/repository behavior is covered separately by the HTTP/D1 tests.

`pnpm check`, `pnpm test:unit`, `pnpm build`, `pnpm build:staff`, the canonical KV-rejecting `build:cms`, and `test:staff-hosting` passed. The combined native Worker probe checks Items, Stock, Orders, private JavaScript/cache headers, alternate-host denial, and public capabilities. Backend test concurrency is capped at two workers to avoid reproduced timeouts on this machine; assertions and timeouts were not relaxed. Logs: `.codex-artifacts/emdash-m1/items-{check,unit,build,staff-build,cms-build,hosting}.log`.

Content navigation/editing, complete item creation/publication, integrated UAT acceptance, and the remaining content/order browser checks stay open under their own tasks.

## Why

Core production foundations are implemented, but final launch still needs one coherent Stripe-last sequence, exact-tree evidence, public-origin cutover, and sole-owner approval. Separating completed prerequisites from remaining provider and launch work prevents UAT or preparation evidence from being mistaken for production authorization.

## What Changes

- Record completed performance, environment, Decap, holding-page, operator-access, and production-control prerequisites by archive and accepted commit.
- Keep the public apex on the verified Holding Page while non-Stripe planning and post-commerce performance checks finish.
- Make one exact commit SHA own the build, Worker, catalog, tests, evidence, launch approval, and cutover.
- Require new-account Stripe test-mode closure before live-mode preparation; never promote UAT D1 rows, test objects, synthetic stock, or UAT evidence into PRD.
- Keep live catalog preparation separate from shopper launch approval and runtime checkout enablement.
- Make `https://blackboxrecordsathens.com/` canonical only during the approved cutover; the Pages origin remains technical.
- Make the user the sole final go/no-go approver and keep the Holding Page as the immediate rollback target for at least 24 hours after launch.

## Capabilities

### New Capabilities

- `launch-readiness`: Production go-live gates and evidence boundaries for native commerce.

### Modified Capabilities

None. Existing domain capabilities remain authoritative; `launch-readiness` references their completed evidence without duplicating or changing their behavior.

## Impact

- OpenSpec planning, launch evidence, and final origin/configuration updates.
- External follow-ups in Stripe, Cloudflare, DNS/domain, email, and human approval surfaces.
- No production provider, DNS, or checkout-opening mutation without explicit execution authorization.

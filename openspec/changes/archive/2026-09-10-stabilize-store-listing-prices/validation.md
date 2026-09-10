## UAT validation evidence

Evidence is redacted to app-owned slugs, counts, test amounts, timestamps, processing outcomes, commit IDs, and public CI run IDs. It contains no Stripe IDs, account IDs, secrets, raw D1 rows, or customer data.

### 2026-07-18 final deployed tree

- Worker and static artifact commit: `2c5b82b3b4690f7036dbf31b4ad37c70af912012`
- UAT Worker deployment and provider smoke: GitHub Actions run `29629400630` succeeded.
- Hosted readiness verifier after Worker deployment: 81 canonical Store Items, 81 ready listing records, including 7 `Pay what you want` records.
- UAT static deployment started after the Worker deployment: GitHub Actions run `29629608559` succeeded.
- Browser Use on `https://blackbox-studio-athens.github.io/blackbox-records/store/`: 81 price cards, 7 `Pay what you want`, 0 `Price unavailable`, 0 missing price values, and 0 browser console errors.
- Genuine inactive, missing, malformed, ambiguous, or unsupported offer state remains fail-closed through the listing-reader and reconciler regression suite; UAT had no genuine invalid listing record to expose to shoppers during this check.
- Cloudflare's deployed Cron Triggers API returned 0 schedules for the UAT Worker after the former `06:17 UTC` window.
- Cloudflare invocation analytics for the previous `00:10–00:25 UTC` window recorded the former failure: 1 error, 50 subrequests, and `scriptThrewException`.
- Cloudflare invocation analytics for the first post-removal `06:10–06:25 UTC` window recorded 0 errors, 0 subrequests, no 50-subrequest row, and no failure status.

### 2026-09-10 controlled UAT Dashboard replacement

- The user delegated selection of the Store Item and replacement amount. Selected `adolf-plays-the-jazz-form-follows-function-cd`: EUR 10.00 to EUR 10.01.
- Confirmed the dedicated Stripe sandbox banner, Product metadata `appEnv=uat`, matching Store Item identity, and the existing Price identity against the UAT D1 mapping before mutation.
- Created a one-time EUR 10.01 Price under that existing Product through Stripe Dashboard, leaving lookup key and metadata blank. Made it the default and archived the EUR 10.00 Price; Dashboard showed the new Price as Default and the old Price as Archived.
- Captured all columns of all 104 `VariantStripeMapping` rows and all 104 `StoreOfferSnapshot` rows, ordered by variant identity, before and after the Dashboard changes. Raw comparison inputs stayed outside the repository in temporary local files.
- Executable assertions confirmed unchanged row counts, value-for-value equality of all columns in each of the 103 unrelated mappings and 103 unrelated snapshots, and replacement Price identity matching the Dashboard in both target rows. The target snapshot contains active Product/Price state and EUR 1001 minor units.
- The UAT catalog webhook ledger records successful `product.updated` and `price.updated` processing with no failure reason. The stale-Price archive event was created at 2026-09-09 22:53:25 UTC and completed at 22:53:28 UTC (2026-09-10 locally). Follow-up Price identity-repair events also succeeded. The webhook route verifies the Stripe signature before catalog acknowledgement and reconciliation.
- D1 propagation was observed before any authoritative Store Offer read or manual verifier apply. No direct D1 writes, provider API mutations, catalog promotion, or deployment were used for this proof.
- The public UAT `/api/store/listing-prices` projection returned `ready` and `€10.01` for the target. The replacement remains the UAT Price Authority; PRD was not changed.
- All six delta requirements already match their corresponding main-spec blocks. The deterministic two-item regression remains the new-item promotion proof; no live new-item promotion was repeated.

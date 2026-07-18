## UAT validation evidence

Evidence is redacted to app-owned slugs, counts, commit IDs, and public CI run IDs. It contains no Stripe IDs, account IDs, secrets, D1 row data, or customer data.

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

### Remaining operator evidence

- Task 6.5 remains open. A real Stripe Dashboard replacement needs an explicitly chosen UAT Store Item and replacement amount before provider mutation.

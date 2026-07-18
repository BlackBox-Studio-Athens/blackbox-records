## UAT validation evidence

Evidence is redacted to app-owned slugs, counts, commit IDs, and public CI run IDs. It contains no Stripe IDs, account IDs, secrets, D1 row data, or customer data.

### 2026-07-18 final deployed tree

- Worker and static artifact commit: `2c5b82b3b4690f7036dbf31b4ad37c70af912012`
- UAT Worker deployment and provider smoke: GitHub Actions run `29629400630` succeeded.
- Hosted readiness verifier after Worker deployment: 81 canonical Store Items, 81 ready listing records, including 7 `Pay what you want` records.
- UAT static deployment started after the Worker deployment: GitHub Actions run `29629608559` succeeded.
- Browser Use on `https://blackbox-studio-athens.github.io/blackbox-records/store/`: 81 price cards, 7 `Pay what you want`, 0 `Price unavailable`, 0 missing price values, and 0 browser console errors.
- Genuine inactive, missing, malformed, ambiguous, or unsupported offer state remains fail-closed through the listing-reader and reconciler regression suite; UAT had no genuine invalid listing record to expose to shoppers during this check.

### Remaining operator evidence

- Task 6.5 remains open. A real Stripe Dashboard replacement needs an explicitly chosen UAT Store Item and replacement amount before provider mutation.
- Task 6.6 remains open until the former `17 */6 * * *` schedule window passes and Cloudflare logs can prove no scheduled invocation or former 50-subrequest failure occurred. The deployed UAT config explicitly uses `crons: []`, and its deployment succeeded.

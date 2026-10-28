# Tasks

Final design and local implementation were approved on 2026-10-27. Credentials, account changes, deployment and live activation remain out of scope; tasks 3.2 and 3.3 require separate authorization.

## 1. Product mapping and provider access

- [x] 1.1 Implement and test conversion of accepted public catalog and authoritative in-stock offers to Google inputs, including price, checkout holds, stable offer identity and Greece-only targeting. Exclude any uncleared raw stock pre-order, including elapsed exact dates. Test omission of unknown identifiers and identifierExists, no catalog-number/artist substitutions, and verified condition handling.
- [x] 1.2 Implement and test environment-isolated Merchant API authentication and bounded upsert/removal requests, with job-specific timeouts and no immediate provider retries; never log credentials.

## 2. Reconciliation and operations

- [x] 2.1 Implement and test the persistent rotating scan, complete accepted-inventory checks, partial-read safety, removal/reinsertion, safe replay and seven-day refresh without affecting checkout or paid-order delivery.
- [x] 2.2 Integrate disabled-by-default controls and at most five candidates per fifteen minutes on the existing schedule; test overlap protection, fair rotation, isolation and operation limits. Document measured Free-tier budget, delayed convergence, Merchant Center diagnostics and operator recovery; add no event hooks, change detector or automatic status polling.

## 3. Acceptance

- [x] 3.0 Resolve final-review findings with regression tests: claim once per fifteen-minute clock slot despite delivery jitter, retain real-time leases and quota cooldowns, and preserve managed listings when checkout flag evaluation fails while keeping shopper fallback unchanged.

- [x] 3.1 Run focused tests, strict OpenSpec validation, graph update and final `pnpm validate`; record source-bound evidence and unverified behaviors.
- [ ] 3.2 In an isolated Google test account, verify product submission/processing, price and stock changes, removal/reinsertion and pre-order exclusion, including elapsed exact-date state and explicit clearing. Document the existing authenticated API recovery when Copies arrived is hidden. Record bounded provider evidence without treating default test-account approval as proof of real eligibility or displayed shipping.
- [ ] 3.3 Verify pilot product condition and available identifiers, then after the separate deployment and activation gates verify actual production identifier diagnostics, listing eligibility and accurate shipping/returns. Resolve affected product data through its existing owner; record evidence without exposing credentials.

## 1. Inventory Source And Matching

- [x] 1.1 Create a repo-owned Distro Inventory Source manifest from the design table, including source artist, source title, type, source price, resolved price policy, release date, source aliases, and rejected duplicate-source rows with `duplicateOf`.
- [x] 1.2 Add approved Current-Site Extras `S/T - Spinners` and `Three Way Plane - Wreckquiem` to the manifest with Vinyl 12-inch fixed `2000 EUR` defaults.
- [x] 1.3 Add normalization/matching tests proving known aliases map to existing content without duplicate Store Items.
- [x] 1.4 Add duplicate handling for `Living Under Drones - Knot On Knot?` so only one `Knot On Knot` item is emitted.
- [x] 1.5 Add validation that fails when unapproved current distro content absent from the Distro Inventory Source and approved extras appears in generated current catalog artifacts or checkout eligibility.

## 2. Content Reconciliation

- [x] 2.1 Reconcile existing distro JSON entries against the manifest and update matched entries for type, release date, title/artist aliases, and ordering.
- [x] 2.2 Add missing distro JSON entries for manifest rows not currently represented on the site.
- [x] 2.3 Replace the excluded `___.json` placeholder intent with the real `Calf - —` Vinyl 10-inch item.
- [x] 2.4 Remove unapproved current distro content absent from the manifest from generated current catalog artifacts and checkout eligibility; keep editorial/source files only if they no longer render as current distro Store Items.
- [x] 2.5 Verify `/distro/`, store item routes, and generated collection schemas still render after content reconciliation.

## 3. Artwork Pass

- [x] 3.1 Prepare an artwork-fetcher input TSV for all manifest rows missing verified repo-owned artwork.
- [x] 3.2 Reuse verified prior artwork-fetcher outputs for Nausea Bomb and Salto Mortale.
- [x] 3.3 Run `tools/artwork-fetcher` for missing/uncertain rows and record verified, manual-review, and known-missing results.
- [x] 3.4 Generate format-appropriate mockups where tooling supports them.
- [x] 3.5 Use a generic fallback only for known-missing artwork, including The Vagina Lips if no verified override is found.
- [x] 3.6 Run `cd tools/artwork-fetcher; python -m unittest discover tests`.

## 4. Catalog Price Model

- [x] 4.1 Extend desired catalog price types to distinguish fixed and pay-what-you-want price kinds.
- [x] 4.2 Update generated Desired Catalog State and Product Projection artifacts to consume the manifest price policy.
- [x] 4.3 Update catalog artifact validation so numeric, `ΕΣ`, blank-default, and Current-Site Extra prices are checked.
- [x] 4.4 Update D1 Store Offer snapshot schema/repository behavior if fixed-only `amountMinor` cannot safely represent pay-what-you-want state.
- [x] 4.5 Add unit tests for fixed prices, pay-what-you-want prices, blank defaults, and duplicate-source handling.

## 5. Stripe Catalog Sync And Checkout

- [x] 5.1 Update Stripe catalog gateway create/read mapping for `custom_unit_amount` Prices.
- [x] 5.2 Update catalog reconciler drift checks to distinguish fixed Price drift from pay-what-you-want Price drift.
- [x] 5.3 Update Store Offer public contracts to expose browser-safe fixed/custom price display without Stripe IDs.
- [x] 5.4 Update frontend price display, cart snapshots, and checkout affordances for `Pay what you want`.
- [x] 5.5 Keep checkout session creation Price-ID based and add tests proving Stripe-hosted amount entry is used for pay-what-you-want Prices.
- [x] 5.6 Add finalization tests proving paid amount authority comes from Stripe webhook/session data, not cart display state.

## 6. UAT Proof

- [x] 6.1 Decide whether UAT uses manual cleanup inside the current Stripe test environment or a fresh Stripe test environment. Decision: retain the current UAT Stripe test environment with workflow-scoped reset/archive, not a fresh Stripe test environment.
- [x] 6.2 If using a fresh UAT Stripe environment, update UAT GitHub/Worker Stripe secrets, payment method configuration, webhook endpoint, and runtime config. Not applicable; the current UAT Stripe test environment was retained.
- [x] 6.3 Run catalog artifact generation/checks after implementation.
- [x] 6.4 Run UAT D1 catalog seed, catalog apply, and catalog post-verify. Evidence: Catalog promotion run `28713586951`, UAT artifact `catalog-promotion-uat-28713586951` (`8083795932`, `sha256:d22a78e30fe391c527b32f0d3df1fc78fbc8735afd5893832f5e6cefd4fdb3bd`).
- [x] 6.5 Deploy UAT Worker and run hosted UAT smoke for one fixed-price item and one pay-what-you-want item. Evidence: static deploy run `28714799447`; UAT provider smoke run `28714881460` passed `happy_path_paid` and `pay_what_you_want_paid`; artifact `uat-smoke-28714881460-1` (`8084139936`, `sha256:648b8218207f9e3279759edd526f53c713cd3fc4e8834401d449c11aa1fbc42b`).
- [x] 6.6 Record redacted UAT evidence without committing secrets, raw provider payloads, or full Stripe object IDs. Evidence is in GitHub Actions artifacts; no secrets, raw provider payloads, or full Stripe object IDs are committed.

## 7. PRD Readiness

- [x] 7.1 Keep PRD reset out of scope.
- [x] 7.2 Decide whether PRD uses manual cleanup where Stripe permits it or a fresh live Stripe environment before PRD-open. Decision: defer live cleanup/fresh-live-environment choice to the PRD-open gate; do not mutate live provider state before explicit approval.
- [x] 7.3 Run PRD readiness checks without live provider mutation until explicit PRD-open approval exists. Evidence: Catalog promotion run `28713586951`, PRD artifact `catalog-promotion-prd-28713586951` (`8083797792`, `sha256:f068edd6db2acf92ad4d91a3ed06f4e00d2b27c3bfd1ee4116cc4bb06a4031b3`).
- [ ] 7.4 After PRD-open approval, run normal catalog promotion from the artifact commit that passed UAT proof.

## 8. Validation Gates

- [x] 8.1 Run `pnpm openspec -- validate full-distro-catalog-source-of-truth --type change --strict`.
- [x] 8.2 Run `pnpm openspec -- validate --all --strict`.
- [x] 8.3 For later behavior-changing implementation, run `pnpm test:unit`.
- [x] 8.4 For later behavior-changing implementation, run `pnpm check`.
- [x] 8.5 For later behavior-changing implementation, run `pnpm build`.

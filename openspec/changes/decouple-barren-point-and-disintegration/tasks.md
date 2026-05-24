## 1. OpenSpec

- [x] 1.1 Create `decouple-barren-point-and-disintegration`.
- [x] 1.2 Add proposal, tasks, and spec deltas for the identity split.

## 2. Content Identity

- [x] 2.1 Rename Disintegration release content from `barren-point` to `disintegration`.
- [x] 2.2 Rename Barren Point distro content from `mass-culture-lp` to `barren-point`.
- [x] 2.3 Set Disintegration's primary sellable format to `Black Vinyl LP`.
- [x] 2.4 Delete the `/store/barren-point/` and `/store/barren-point/checkout/` redirects to Disintegration.

## 3. Generic Commerce Derivation

- [x] 3.1 Replace release-specific slug, variant ID, and option-label mappings with title plus first physical format derivation.
- [x] 3.2 Ensure Disintegration derives `/store/disintegration-black-vinyl-lp/` and `variant_disintegration-black-vinyl-lp_standard`.
- [x] 3.3 Ensure Barren Point derives `/store/barren-point/` and `variant_barren-point_standard`.
- [x] 3.4 Keep Caregivers deriving `/store/caregivers-vinyl/` naturally.

## 4. Generated Artifacts And Cleanup

- [x] 4.1 Regenerate the Product Projection manifest.
- [x] 4.2 Regenerate sandbox UAT D1 seed SQL.
- [x] 4.3 Add sandbox UAT cleanup for stale `mass-culture-lp` and `variant_mass-culture-lp_standard` rows.
- [x] 4.4 Update local mock seed expectations, smoke defaults, and test fixtures.

## 5. Documentation

- [x] 5.1 Remove docs and OpenSpec wording that describes `barren-point` as a Disintegration compatibility alias.
- [x] 5.2 Document the decoupled source identities in the relevant active change/spec text.

## 6. Verification

- [x] 6.1 Run `pnpm stripe:catalog:artifacts:generate`.
- [x] 6.2 Run focused catalog, seed, checkout, and smoke fixture tests.
- [x] 6.3 Run `pnpm test:unit`.
- [x] 6.4 Run `pnpm check`.
- [x] 6.5 Run `pnpm build`.
- [x] 6.6 Run `openspec validate --all --strict`.

## 7. Sandbox Provider Proof

- [x] 7.1 Run `pnpm stripe:catalog:reset-sandbox --env sandbox --dry-run`.
- [x] 7.2 Run `pnpm stripe:catalog:reset-sandbox --env sandbox --confirm`.
- [x] 7.3 Run `pnpm --filter @blackbox/backend d1:seed:sandbox:uat-catalog`.
- [x] 7.4 Run `pnpm stripe:catalog:verify --env sandbox --apply`.
- [x] 7.5 Run `pnpm stripe:catalog:verify --env sandbox`.
- [x] 7.6 Run `pnpm deploy:backend:sandbox`.
- [ ] 7.7 Run GitHub Pages UAT `checkout_surface` and `happy_path_paid` smokes after the pushed frontend has deployed.

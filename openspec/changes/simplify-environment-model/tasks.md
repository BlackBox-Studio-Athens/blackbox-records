## 1. Inventory and Canonical Mapping

- [ ] 1.1 Inventory every current environment-like name in README, AGENTS, docs, workflows, package scripts, `apps/backend/wrangler.jsonc`, and OpenSpec specs.
- [ ] 1.2 Create one canonical environment matrix that maps Product Environment to static host, Worker runtime target, D1 store, Stripe/provider mode, CI credential scope, secret store, and validation gates.
- [ ] 1.3 Mark GitHub Pages as UAT and Cloudflare Pages as PRD in the matrix.
- [ ] 1.4 Mark PRD checkout and live provider mutation as disabled until an explicit production-readiness gate opens them.
- [ ] 1.5 Document that GitHub Actions environments, Wrangler environments, Stripe modes, and secret stores are platform/provider layers, not product environments.
- [ ] 1.6 Inventory every current `PUBLIC_BACKEND_BASE_URL`, `CHECKOUT_RETURN_ORIGINS`, CORS origin, and checkout return URL value and classify it as Local, UAT, PRD, or non-product diagnostic.
- [ ] 1.7 Inventory generated catalog Product image URLs and public catalog asset URL bases in catalog contracts, Desired Catalog State, Product Projections, verification scripts, and evidence artifacts.

## 2. Documentation and Language Cleanup

- [ ] 2.1 Update `README.md` with the Local/UAT/PRD model and the environment matrix.
- [ ] 2.2 Update `AGENTS.md` so future work uses GitHub Pages as UAT and Cloudflare Pages as disabled PRD.
- [ ] 2.3 Update `docs/stripe-sandbox-uat.md` to use UAT as the product name and sandbox only as the Worker/Stripe implementation mapping.
- [ ] 2.4 Update `docs/catalog-promotion.md` so operator-facing targets are UAT and PRD, with PRD currently disabled.
- [ ] 2.5 Remove or replace "GitHub Pages rollback/legacy" wording from current source-of-truth docs.
- [ ] 2.6 Add a short "why secrets must be entered again" section that explains isolated local, GitHub Actions, Cloudflare Worker, and Stripe secret stores.
- [ ] 2.7 Keep `@t3-oss/env-core` described as env validation for local/process contracts, not as a secret store.
- [ ] 2.8 Reconcile `automate-cms-catalog-promotion` and `production-go-live-readiness` wording so they do not describe production provider mutation as available before the PRD-open gate.
- [ ] 2.9 Update affected OpenSpec baseline `## Purpose` text, especially `static-site-and-deployment`, so archived specs do not retain GitHub Pages rollback or Cloudflare Pages canonical-production language.

## 3. Workflow and Script Target Alignment

- [ ] 3.1 Update GitHub Pages workflow naming/comments/output so it is clearly the UAT static deployment.
- [ ] 3.2 Update Cloudflare Pages workflow naming/comments/output so it is clearly the PRD static deployment and PRD remains disabled.
- [ ] 3.3 Remove Cloudflare Pages `pages/**` branch deploys or explicitly classify them as non-product diagnostics excluded from UAT/PRD evidence.
- [ ] 3.4 Update catalog promotion dispatch targets from operator-facing `production` to `prd`, while preserving the internal mapping to production Worker/Stripe targets where needed.
- [ ] 3.5 Add a fail-closed PRD-open gate to production/PRD catalog promotion before any live provider mutation can run.
- [ ] 3.6 Decide whether to rename GitHub Actions environment `catalog-promotion-production` to `catalog-promotion-prd`; if renamed, guide the maintainer to recreate required secrets, variables, and protection rules manually.
- [ ] 3.7 Preserve existing `sandbox` and `production` Wrangler environment names as Worker runtime targets unless a later task explicitly migrates provider resources.
- [ ] 3.8 Ensure workflow artifacts and Promotion Evidence use `uat` and `prd` directories/names at the operator boundary, with PRD pre-go-live evidence classified as readiness-only, disabled, or `not_configured`.
- [ ] 3.9 Update any pending production promotion/proof task so it is readiness-only or explicitly blocked by the PRD-open gate.
- [ ] 3.10 Split frontend backend-base variables so GitHub Pages UAT resolves only the UAT Worker/API and Cloudflare Pages PRD resolves only the PRD Worker/API.
- [ ] 3.11 Split Worker checkout return/CORS origin allowlists so local, UAT, PRD, and non-product diagnostics cannot call or return through the wrong Worker runtime target.
- [ ] 3.12 Make catalog contract/artifact generation target-aware so UAT Product image URLs use the GitHub Pages UAT asset base and PRD readiness/live Product image URLs use the Cloudflare Pages PRD asset base or an approved PRD custom domain asset base.

## 4. Local Modes

- [ ] 4.1 Keep `pnpm dev:stack:stripe-mock` as the default Local `mock` command.
- [ ] 4.2 Add or document a Local `uat-connected` command that runs the local static frontend against the deployed UAT Worker/API.
- [ ] 4.3 Ensure Local `uat-connected` does not require copying UAT Stripe secrets or UAT Worker secrets into local files.
- [ ] 4.4 Reclassify `pnpm dev:stack:stripe-test` as an advanced provider diagnostic, or explicitly retire it from normal Local docs.
- [ ] 4.5 Update local preflight output so the normal Local modes are exactly `mock` and `uat-connected`.

## 5. Runtime and Secret Validation

- [ ] 5.1 Extend runtime/config verification so it can report against Product Environment names: Local, UAT, and PRD.
- [ ] 5.2 Add checks proving UAT static deploy points at the UAT Worker/API and PRD static deploy points at the PRD Worker/API.
- [ ] 5.3 Add checks proving PRD checkout capability and live provider mutation fail closed before the PRD-open gate exists.
- [ ] 5.4 Add redacted secret-presence checks for GitHub Actions, Cloudflare Worker, Stripe webhook/catalog setup, and local ignored files where CLI/API inspection is possible.
- [ ] 5.5 Use `@t3-oss/env-core` only for Node script/process-env contracts and keep output redacted.
- [ ] 5.6 Add a drift check that flags new user-facing `sandbox` or `production` wording where `uat` or `prd` should be used.
- [ ] 5.7 Add a drift check that flags Cloudflare Pages preview/branch deploys if they are used as UAT acceptance, PRD readiness, Promotion Evidence, or shopper-facing commerce proof.
- [ ] 5.8 Add a drift check that rejects successful PRD Promotion Evidence before the PRD-open gate exists.
- [ ] 5.9 Add a drift check that fails when UAT or PRD static builds can call the wrong Worker/API or when Worker origin allowlists include the wrong static host.
- [ ] 5.10 Add a closeout check that scans affected OpenSpec baseline Purpose and requirement prose for stale rollback/legacy/canonical-production wording.
- [ ] 5.11 Add a drift check that fails when UAT catalog artifacts use PRD asset hosts, PRD catalog artifacts use UAT asset hosts, or PRD readiness/live evidence is generated from Product image URLs that do not match the PRD static asset base.

## 6. PRD Readiness Without Go-Live

- [ ] 6.1 Complete production Worker runtime config enough for readiness checks without enabling live checkout.
- [ ] 6.2 Ensure production D1 binding and migrations are represented without rewriting existing migration history.
- [ ] 6.3 Keep Cloudflare Pages PRD deployable as a static disabled storefront while live checkout and live provider mutation remain gated off.
- [ ] 6.4 Ensure `/api/store/capabilities` reports browser-safe disabled checkout state for PRD until go-live.
- [ ] 6.5 Ensure production catalog readiness can dry-run without live mutation while PRD is disabled.

## 7. Verification

- [ ] 7.1 Run `openspec validate simplify-environment-model --type change --strict`.
- [ ] 7.2 Run `openspec validate --all --strict`.
- [ ] 7.3 Run `pnpm test:unit`.
- [ ] 7.4 Run `pnpm check`.
- [ ] 7.5 Run `pnpm build`.
- [ ] 7.6 If workflow/script changes are made, run the relevant non-mutating runtime/config verification commands for UAT and PRD.
- [ ] 7.7 If static UI behavior changes, verify Local mock, Local UAT-connected, UAT, and disabled PRD surfaces with Browser Use.
- [ ] 7.8 Before archive, re-read affected baseline specs after applying the change and verify Purpose, requirements, and scenarios all use the Local/UAT/PRD model.

## 8. Manual Provider Checkpoints

- [ ] 8.1 Guide the maintainer through any GitHub Actions environment/secret renames after the workflow changes are ready.
- [ ] 8.2 Guide the maintainer through any Cloudflare Worker secret additions or rotations from `apps/backend`.
- [ ] 8.3 Guide the maintainer through any Cloudflare Pages PRD deploy settings only if implementation discovers a provider-side setting is still required; the default plan keeps static PRD deploys active with commerce disabled.
- [ ] 8.4 Guide the maintainer through any Stripe Dashboard/Workbench webhook or live-mode readiness steps that cannot be inferred from API output.
- [ ] 8.5 Record manual completion evidence in docs or redacted artifacts without storing sensitive values.

## Why

The repo now has several overlapping environment concepts: GitHub Pages UAT, Cloudflare Pages production, sandbox Worker, production Worker, local mock, local Stripe test, catalog promotion environments, GitHub Actions environments, Cloudflare Worker environments, and Stripe modes. That complexity makes the system harder to reason about and makes secret/config setup feel larger than the actual product model.

This change establishes one simple product environment model: UAT on GitHub Pages, PRD on Cloudflare Pages but disabled until go-live, and Local with two explicit modes: mock and UAT-connected.

## What Changes

- Add a canonical environment model that collapses shopper-facing operation into exactly three product environments:
  - Local: developer machine only, with `mock` and `uat-connected` modes.
  - UAT: GitHub Pages static frontend plus sandbox Worker, sandbox D1, Stripe test mode, and UAT Promotion Evidence.
  - PRD: Cloudflare Pages static frontend plus production Worker, production D1, and Stripe live mode, with PRD readiness or disabled evidence before go-live and successful PRD Promotion Evidence only after production readiness is explicitly opened.
- Rename and document platform-specific environment layers so they do not compete with the product model:
  - GitHub Actions environments become credential scopes, not product environments.
  - Wrangler environments become Worker runtime targets, not user-facing environments.
  - Stripe test/live remains provider mode, not product environment naming.
- Replace the current scattered UAT/production/sandbox wording with a single mapping table used by README, AGENTS, workflows, scripts, OpenSpec specs, and validation output.
- Tie `PUBLIC_BACKEND_BASE_URL`, `CHECKOUT_RETURN_ORIGINS`, CORS origins, and checkout return URLs to that matrix so static frontends cannot accidentally call or return through the wrong Worker runtime target.
- Tie generated Stripe Product image URLs and other public catalog asset URLs to the target environment so UAT catalog artifacts use GitHub Pages assets and PRD catalog readiness/live artifacts use Cloudflare Pages assets.
- Clean up baseline OpenSpec purpose/source-of-truth text, not only requirement bodies, so archived specs do not keep describing Cloudflare Pages as canonical production and GitHub Pages as rollback/legacy.
- Plan removal or de-emphasis of redundant flows that do not match the target model:
  - UAT static frontend must deploy only to GitHub Pages.
  - PRD static frontend must deploy only to Cloudflare Pages.
  - GitHub Pages remains UAT, not rollback/legacy production language.
  - Cloudflare Pages remains PRD, but PRD is fail-closed/disabled until production readiness is intentionally opened.
  - Local default stays mock; local connected-to-UAT is explicit and never writes provider state unless a named command says so.
- Keep the existing safety split between UAT/test and PRD/live, but make it easier to operate by reducing the number of named paths maintainers must understand.
- Reconcile active production-facing OpenSpec changes so `automate-cms-catalog-promotion` and `production-go-live-readiness` do not keep describing production apply/proof as available before the PRD-open gate.
- Clarify the role of `@t3-oss/env-core`: it validates env contracts where code reads local/process env, but it is not a secret store and does not replace GitHub Actions secrets, Cloudflare Worker secrets, Wrangler bindings, or Stripe provider credentials.

## Capabilities

### New Capabilities

- `environment-model`: Defines the canonical Local/UAT/PRD product environment model, the allowed platform mappings, and the naming rules that keep product environments distinct from GitHub Actions environments, Wrangler environments, Stripe modes, and secret stores.

### Modified Capabilities

- `static-site-and-deployment`: Static deployment requirements change from Cloudflare Pages canonical plus GitHub Pages rollback/legacy to UAT-only GitHub Pages and PRD-only Cloudflare Pages with PRD currently disabled.
- `commerce-checkout`: Checkout readiness must understand PRD disabled state, Local mock mode, and Local UAT-connected mode without leaking provider secrets or allowing ambiguous local/provider writes.
- `tooling-validation`: Validation gates must prove the simplified environment matrix, detect drift from the three-environment model, and make env validation library usage explicit.
- `project-language`: Canonical terminology must distinguish Product Environment, Platform Environment, Worker Runtime Target, Provider Mode, Secret Store, Local Mock Mode, and Local UAT-Connected Mode.

## Impact

- `README.md`, `AGENTS.md`, and docs under `docs/`
- OpenSpec baseline specs under `openspec/specs/`, including purpose text and requirements
- GitHub Actions workflows under `.github/workflows/`, especially Pages, Cloudflare Pages, sandbox Worker deploy, catalog artifacts, and catalog promotion
- Worker runtime config in `apps/backend/wrangler.jsonc`
- Frontend backend-base variables and Worker origin allowlists, especially `PUBLIC_BACKEND_BASE_URL` and `CHECKOUT_RETURN_ORIGINS`
- Catalog contract generation, Desired Catalog State, Product Projection image URLs, and public catalog asset URL validation
- Local launcher scripts and docs for `pnpm dev:stack:stripe-mock`, `pnpm site:dev`, `pnpm dev:backend:sandbox`, and any future local UAT-connected mode
- Runtime config validation scripts such as `scripts/verify-runtime-config.ts`, Stripe verifier scripts, and local preflight scripts that use or should use `@t3-oss/env-core`
- Catalog Promotion docs and task flow, especially naming and evidence boundaries for UAT and PRD
- GitHub Actions environments and secrets/variables naming for promotion credentials

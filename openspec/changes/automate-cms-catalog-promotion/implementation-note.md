## Audit Findings

- Decap release and distro builders previously exposed commerce intent, target environment, Desired Price, tax code, stock initialization, smoke candidate, and checkout retirement fields; production cleanup removed those CMS-authored commerce controls.
- `apps/web/src/content.config.ts` now accepts release and distro editorial fields only, so production buyability is not controlled from CMS-authored content.
- `scripts/stripe-catalog-contract.ts` derived every current entry as sandbox checkout-eligible and used format-derived sandbox test prices. That preserved UAT behavior but was too implicit for production.
- `scripts/generate-stripe-uat-catalog-artifacts.ts` generated Product Projection and sandbox UAT D1 seed artifacts only. No environment-neutral Desired Catalog State or production-safe D1 readiness artifact existed.
- `scripts/stripe-catalog-verify.ts` allowed `--env production` dry-runs through argument parsing but blocked every production apply with a sandbox-only guard.
- The existing catalog reconciler, Stripe catalog gateway, D1 repository seams, and redaction helpers can still be reused for dry-run verification and sandbox apply. Production mutation policy still needs provider-side proof before final closeout.
- Backend D1 commands covered local and sandbox migrations/seeds. Production catalog readiness commands were absent.
- GitHub workflows deployed Cloudflare Pages, GitHub Pages rollback/UAT, and the sandbox Worker separately. No committed workflow regenerated catalog artifacts after Decap changes or promoted the artifact commit through UAT and production.
- `scripts/smoke-stripe-sandbox.ts` already separates `checkout_surface` from paid-path scenarios for UAT. Production no-payment smoke still needs a dedicated live-mode runner before provider proof tasks can close.

## Implemented Local Slice

- Removed guarded CMS commerce fields and matching Astro content schema.
- Added code-facing Catalog Promotion types and generated Desired Catalog State.
- Kept generated sandbox entries production-disabled by default, so existing content did not become production-buyable.
- Added a production readiness SQL artifact that does not overwrite existing stock rows.
- Replaced the blanket production apply argument rejection with a CI promotion-context guard.
- Added catalog artifact regeneration and catalog promotion workflows.
- Added runtime config, D1 readiness, production no-payment smoke, and checkout pause commands.
- Added maintainer documentation for statuses, CMS fields, automation shape, rollback, and evidence boundaries.

## Local Validation

- Targeted backend/script coverage passed for production catalog readiness, promotion smoke, workflow ordering, runtime config verification, checkout pause, and catalog reconciler behavior.
- Repository gates passed: `pnpm test:unit`, `pnpm check`, and `pnpm build`.
- OpenSpec gates passed: `openspec validate automate-cms-catalog-promotion --type change --strict` and `openspec validate --all --strict`.
- Closeout scan found no active legacy planning workflow, duplicate catalog promotion workflow, production reset path, or stale sandbox-only documentation contradicting the implemented promotion path. Historical OpenSpec migration notes and sandbox reset documentation remain intentionally historical or sandbox-scoped.

## Provider Proof Limitation

- 2026-06-24 environment rename note: forward-looking commands and Cloudflare resource names are now UAT/PRD. Historical evidence below may still name the old sandbox/production resources that existed when the proof was gathered.
- UAT Promotion Evidence and PRD readiness or PRD Promotion Evidence are still required before the change can be archived. PRD Promotion Evidence can only succeed after the PRD-open gate exists.
- GitHub Actions credential scope `catalog-promotion-uat` exists. The production-named scope should be migrated to `catalog-promotion-prd` with required secrets, variables, and protection rules before PRD proof runs.
- Both catalog promotion environments still need environment-scoped `STRIPE_PAYMENT_METHOD_CONFIGURATION_ID`, `CLOUDFLARE_API_TOKEN`, and `STRIPE_SECRET_KEY` before workflow proof can run. GitHub reports no secret names on either catalog promotion environment yet, and only `CLOUDFLARE_ACCOUNT_ID` is listed as a variable.
- A local sandbox runtime config probe now passes: `STRIPE_PAYMENT_METHOD_CONFIGURATION_ID`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `CHECKOUT_RETURN_ORIGINS`, and `COMMERCE_DB` are present through Worker configuration. Local `pnpm stripe:webhooks:verify --env sandbox` still requires a local `STRIPE_SECRET_KEY` process env or the GitHub promotion workflow secret.
- Production D1 now exists as `blackbox-records-commerce-production` in Cloudflare, is bound as `COMMERCE_DB`, has all current migrations applied, and passes `pnpm production:catalog-readiness:check -- --phase pre-apply` for the current catalog state. The readiness seed executed successfully with zero Store Item rows written because the current Desired Catalog State has no production-targeted variants.
- The production Worker shell now exists at `https://blackbox-records-backend.blackboxrecordsathens.workers.dev` with version `c2d9b6f0-9f7f-40f6-8a5a-bbbf8342e9ce`, bound to production D1 and `CHECKOUT_RETURN_ORIGINS`.
- A local production runtime config probe now fails only on missing Worker secrets: `STRIPE_PAYMENT_METHOD_CONFIGURATION_ID`, `STRIPE_SECRET_KEY`, and `STRIPE_WEBHOOK_SECRET`. `CHECKOUT_RETURN_ORIGINS` and `COMMERCE_DB` are present; `FLAGS` and `PRODUCTION_CATALOG_CRON` reported not applicable.
- Provider proof tasks must remain open until a real UAT Promotion Run and either PRD `not_configured` readiness evidence or an opened PRD Promotion Run completes from the artifact commit and the redacted evidence is reviewed.

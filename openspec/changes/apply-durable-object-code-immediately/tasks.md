# Tasks

## 1. Immediate Durable Object code updates

- [x] 1.1 `apps/backend/astro.config.mjs` and `apps/backend/astro.public.config.mjs`: set `durable_objects.code_update_strategy: { mode: 'immediate' }`. Confirm that local UAT builds carry it into both generated `server/wrangler.json` files, and that `wrangler deploy --dry-run` accepts them.
- [x] 1.2 `scripts/release-candidate.mjs`: `verify-worker` and `verify-hosted` also require the store Durable Object to report the candidate. Update `scripts/release-candidate.test.mjs`.
- [x] 1.3 `apps/backend/test/scripts/public-build-config.test.ts`: keep the setting in both generators. Update `docs/catalog-promotion.md` and `docs/validation-feedback.md`.
- [ ] 1.4 On the next push and promotion, record when the Worker entry and the store object serve the new SHA. Expected: within seconds of the deploy, with `verify-worker` passing on its first or second attempt.
- [ ] 1.5 Record the hosted result in `validation.md`, validate strictly and archive the change.

## 1. Completed Alignment

- [x] 1.1 Align repo-owned environment types, Wrangler keys, Worker/D1 names, workflows, generated catalog targets, scripts, docs, and tests to Local/UAT/PRD.
- [x] 1.2 Keep Stripe test/live provider wording separate and retain only existing direct legacy command aliases.
- [x] 1.3 Create/copy/deploy renamed UAT and PRD Cloudflare resources while retaining old resources.
- [x] 1.4 Prove renamed UAT runtime, webhook, payment configuration, catalog, and smoke; GitHub Actions run 30166382129 passed on July 25, 2026.
- [x] 1.5 Leave PRD live secrets, webhook activation, provider mutation, and launch evidence in production-go-live-readiness.

## 2. Remaining External Cleanup

- [ ] 2.1 Reconfirm no current workflow references repository variable PUBLIC_BACKEND_BASE_URL, then delete that stale variable from GitHub and record the deletion date.
- [ ] 2.2 Reconfirm no current workflow references GitHub environment catalog-promotion-production, then delete that unused environment and record the deletion date.
- [ ] 2.3 Search active repo and external configuration for disallowed sandbox/production product-target names, run pnpm openspec -- validate align-cloudflare-environment-names --strict, and archive after both external deletions.

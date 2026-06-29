## 1. Production Gate Definition

- [ ] 1.1 Name final go/no-go reviewers and approval checkpoints.
- [ ] 1.2 Document native-commerce rollback and emergency-disable conditions.
- [ ] 1.3 Confirm final PRD domain and checkout return-origin model.

## 2. External Evidence

- [ ] 2.1 Capture live Stripe Products/Prices, Payment Method Configuration, and webhook evidence without committing secrets or full account-specific IDs.
- [ ] 2.2 Configure and verify PRD Worker secrets, D1 binding, migrations, seed/mapping data, and webhook endpoint.
- [ ] 2.3 Verify final Cloudflare Pages and Worker routing with exact PRD origins.
- [ ] 2.4 Confirm the launch catalog artifact commit is generated from Decap/repo content that has passed UAT proof, and do not copy UAT D1 rows, Stripe test-mode objects, synthetic stock, or UAT evidence into PRD.
- [ ] 2.5 Define the PRD target policy for launch Store Items, including explicit live price authority, first-publication stock readiness, PRD D1 readiness rows, and live provider ownership before setting `PRD_OPEN_GATE=open`.

## 3. Launch Review

- [ ] 3.1 Run `pnpm test:unit`, `pnpm check`, and `pnpm build` against the final launch tree.
- [ ] 3.2 Verify generated PRD catalog readiness artifacts are non-empty for approved launch items and reference PRD asset URLs, not UAT asset URLs.
- [ ] 3.3 Record manual Browser Use checkout acceptance evidence only after PRD-like configuration exists and the PRD-open gate is ready.
- [ ] 3.4 Record final go/no-go result in this change before archiving.

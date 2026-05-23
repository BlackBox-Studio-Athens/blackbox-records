## 1. Production Gate Definition

- [ ] 1.1 Name final go/no-go reviewers and approval checkpoints.
- [ ] 1.2 Document native-commerce rollback and emergency-disable conditions.
- [ ] 1.3 Confirm final production domain and checkout return-origin model.

## 2. External Evidence

- [ ] 2.1 Capture live Stripe Products/Prices, Payment Method Configuration, and webhook evidence without committing secrets or full account-specific IDs.
- [ ] 2.2 Configure and verify production Worker secrets, D1 binding, migrations, seed/mapping data, and webhook endpoint.
- [ ] 2.3 Verify final Cloudflare Pages and Worker routing with exact production origins.

## 3. Launch Review

- [ ] 3.1 Run `pnpm test:unit`, `pnpm check`, and `pnpm build` against the final launch tree.
- [ ] 3.2 Record manual Browser Use checkout acceptance evidence only after production-like configuration exists.
- [ ] 3.3 Record final go/no-go result in this change before archiving.

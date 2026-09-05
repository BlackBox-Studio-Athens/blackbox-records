## 1. Deployment Ownership

- [x] 1.1 Remove Worker deployment and D1 migration from UAT provider smoke, delete the standalone UAT Worker workflow, and verify workflow contract tests reject both paths.
- [x] 1.2 Update environment-model validation to require catalog promotion as the sole UAT Worker workflow owner and verify `pnpm environment:model:verify` passes.

## 2. Runtime Reconciliation

- [x] 2.1 Remove public catalog mutation policy wiring, force Store Offer and checkout reconciliation to read-only mode, and verify checkout use-case tests preserve fail-closed drift behavior.
- [x] 2.2 Improve non-ready Store Offer smoke diagnostics and verify the focused smoke test includes slug and catalog status without sensitive data.

## 3. Contracts and Documentation

- [x] 3.1 Update UAT deployment and Stripe guidance for the single-owner, observation-only model and verify OpenSpec strict validation passes.

## 4. Verification and Rollout

- [x] 4.1 Run `pnpm test:unit`, `pnpm check`, and `pnpm build` against the final tree.
- [x] 4.2 Commit the scoped fix, promote the exact commit to UAT without catalog reset, and verify paid CI smoke plus Chrome checkout readiness.

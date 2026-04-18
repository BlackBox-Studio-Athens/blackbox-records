# Phase 1: Runtime And Guardrails - Discussion Log

**Date:** 2026-04-19
**Status:** Finalized into `01-CONTEXT.md`

## Summary

This discussion resolved the production runtime direction for native commerce and replaced the earlier storage assumption of Supabase with a Cloudflare-native database baseline.

## Discussion Trail

### Initial user positions
- User preferred to stay on GitHub Pages if feasible.
- User wanted secrets in GitHub Secrets if possible.
- User wanted a full migration with no Fourthwall fallback.
- User expressed interest in a Java backend, likely Spring Boot native.

### Runtime feasibility check
- GitHub Pages alone was ruled out because embedded checkout session creation and Stripe webhooks require live server routes.
- Cloudflare Free plus Java/Spring Boot was challenged as a runtime mismatch for the current Cloudflare platform shape.
- Oracle Always Free plus Java remained technically possible, but it introduced more operations burden than the lowest-cost serverless path.

### Database direction
- SQL was recommended over NoSQL for inventory, order lifecycle, webhook authority, and reconciliation needs.
- Cloudflare D1 was identified as the best fit if the runtime moved to Cloudflare Workers.
- Oracle SQL was identified as the better fit only if Java remained a hard requirement.

### Final decisions made
- Use Astro on Cloudflare Workers as the production runtime baseline.
- Use D1 as the v1 operational database baseline.
- Treat Stripe as the source of truth for catalog/pricing/payment truth.
- Do not keep Fourthwall as a fallback.
- Keep browser writes away from authoritative inventory and order state.
- Treat GitHub Secrets as CI/deployment secret storage only; runtime secrets belong in Cloudflare Worker secrets and bindings.

## Notes for planning

- The earlier Supabase-only storage assumption is now superseded and must not leak into later plans.
- ADR-001 and ADR-002 need to be updated during Phase 1 planning so the decision records match the locked context.
- The remaining implementation work in Phase 1 should focus on turning this runtime decision into concrete deployment, secret-handling, and cutover ADRs.

---

*Decisions are captured in `01-CONTEXT.md`; this file preserves the reasoning trail.*

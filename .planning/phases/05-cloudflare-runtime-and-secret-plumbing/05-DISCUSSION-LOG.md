# Phase 5: Cloudflare Runtime And Secret Plumbing - Discussion Log

**Date:** 2026-04-20
**Status:** Finalized except for deploy-trigger policy

## Summary

This discussion locked the Workers-first alpha runtime, the Worker-secret model, the D1 environment strategy, and the Prisma-on-D1 runtime posture. The remaining open item is the exact automated deploy-trigger policy.

## Discussion Trail

### Initial positions
- User accepted a stable separate Cloudflare sandbox hostname.
- User wanted secrets delegated to GitHub Actions and GitHub Secrets where possible, while still keeping the setup secure and automatable.
- User wanted full automation and a monorepo-style workflow rather than manual deploy choreography.
- User initially suggested reusing one D1 database across local, beta, and production if that simplified operations.

### Runtime direction
- The dual-target Pages plus Workers shape was challenged as unnecessary overhead for an alpha-only testing period.
- User chose to go full Workers sandbox first for active alpha work.
- The resulting recommendation was one Workers-oriented Astro config rather than split config files.

### Secret-handling direction
- GitHub Secrets alone were ruled out as insufficient for runtime trust boundaries.
- CI/CD credentials were kept in GitHub Secrets.
- Runtime Stripe, webhook, and database secrets were moved conceptually to Cloudflare Worker secrets and bindings, with Wrangler/API automation favored for future scripting.
- Cloudflare Access for the sandbox environment was explicitly deferred until a later launch-oriented milestone.
- The consequence was made explicit: the sandbox Worker must not be treated as strongly access-controlled while Access is deferred.

### Database environment direction
- Sharing one remote database between beta and production was challenged as the wrong simplicity tradeoff.
- D1's current platform shape was checked against current docs.
- The docs support separate databases per environment, and current Workers Free limits still allow up to 10 D1 databases per account.
- User asked specifically how a second production database would be created for free and whether migrations had been considered.
- The resulting recommendation was:
  - local D1 for normal development
  - one shared remote beta database
  - one separate remote production database later
  - no schema-based environment split

### Migration direction
- User compared the problem to Liquibase in a Java stack.
- The simplest equivalent for this stack was identified as Cloudflare D1's built-in Wrangler migrations.
- The migration decision was locked around checked-in SQL files, one authoritative migration directory, and the same migration chain applied to local, beta, and production.

### Prisma direction
- User challenged the assumption that raw D1 access was simpler than a proper ORM or data layer.
- Current Prisma and Cloudflare docs were checked against D1 specifically.
- The docs support Prisma runtime access on D1, but the supported D1 migration workflow still routes through D1/Wrangler migrations, with `prisma migrate diff` generating SQL.
- User chose to stay on D1 with Prisma runtime access rather than switch databases for first-class Prisma-only migrations.

## Finalized decisions so far

- Workers-first alpha runtime on Cloudflare
- Stable separate sandbox hostname
- GitHub Secrets for CI auth; Worker secrets and bindings for runtime secrets
- Local D1 plus separate remote beta and production D1 databases
- No schema-based environment isolation
- Prisma runtime access on D1
- Prisma schema plus `prisma migrate diff`, with Wrangler/D1 applying migrations as the authoritative migration system
- Cloudflare Access deferred until a later live-mode milestone

## Still open

- Exact automated deploy trigger policy for Worker sandbox deploys

## Notes for planning

- Phase 5 planning should treat migrations as part of the deployment contract, not as an optional operational detail.
- Future plans should assume a second production D1 database is feasible on the free tier and should not be avoided by inventing table-prefix or shared-database workarounds.
- If later implementation requires seed data, keep it separate from schema migrations.
- Future plans should avoid describing the sandbox environment as private unless Access or an equivalent control is actually added.

---

*Decisions are captured in `05-CONTEXT.md`; this file preserves the reasoning trail.*

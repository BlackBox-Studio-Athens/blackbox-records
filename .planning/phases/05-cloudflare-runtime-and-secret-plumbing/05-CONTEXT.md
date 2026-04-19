# Phase 5: Cloudflare Runtime And Secret Plumbing - Context

**Gathered:** 2026-04-20
**Status:** Ready for planning

<domain>
## Phase Boundary

Lock the active Cloudflare runtime shape for alpha and sandbox work: Astro deployment target, secret-handling model, D1 environment split, and migration system. This phase does not reopen checkout, order-state, inventory, or shipping semantics.

</domain>

<decisions>
## Implementation Decisions

### Runtime and hosting model
- **D-01:** The active alpha runtime target is Astro on Cloudflare Workers.
- **D-02:** During alpha, do not maintain GitHub Pages as an equal day-to-day runtime target. Treat the current Pages deployment as the brownfield baseline and fallback reference only.
- **D-03:** Use one Astro configuration oriented around the Workers runtime instead of split Pages and Workers config files.
- **D-04:** Use a stable separate Cloudflare sandbox hostname for worker-based testing so Stripe return URLs and browser/UAT checks have one consistent target.

### Secrets and environment ownership
- **D-05:** GitHub Secrets may hold CI/CD credentials such as Cloudflare API tokens and account identifiers.
- **D-06:** Runtime secrets must live in Cloudflare Worker secrets or bindings, not only in GitHub Secrets.
- **D-07:** Favor Wrangler and Cloudflare API-managed secret workflows so setup can be automated later from scripts or GitHub Actions.
- **D-08:** Cloudflare Access is deferred for the sandbox milestone and should be revisited in the later go-live or live-mode milestone before real-customer traffic is allowed.
- **D-09:** Because Cloudflare Access is deferred, do not describe the sandbox Worker hostname as strongly access-controlled. Treat it as an intentionally reachable alpha surface, not a private internal environment.

### Database environments
- **D-10:** Use a local D1 database for normal development.
- **D-11:** Use one shared remote D1 database for beta and sandbox testing.
- **D-12:** Use a separate remote D1 database for production when the go-live milestone is reached.
- **D-13:** Do not share one remote D1 database between beta and production.
- **D-14:** Do not plan around Postgres-style schemas for environment separation. D1 should be separated by database, not by schema.
- **D-15:** The second remote D1 database needed for production remains feasible on the current free-tier shape because Workers Free currently allows up to 10 D1 databases per account.

### Migration system
- **D-16:** Prisma is approved for runtime database access on D1 via the current D1 adapter path.
- **D-17:** Database schema changes must be versioned in-repo through one authoritative SQL migration directory.
- **D-18:** Stay on D1, so the migration path remains D1/Wrangler migrations rather than Prisma-only `migrate dev/deploy`.
- **D-19:** Use `prisma migrate diff` to generate migration SQL from the Prisma schema when Prisma modeling is the source of truth.
- **D-20:** Do not introduce a separate Liquibase-style framework for v1.1 unless later complexity proves the chosen Prisma-plus-Wrangler workflow insufficient.
- **D-21:** Apply the same migration chain across local, beta, and later production databases.
- **D-22:** Prefer forward-only, SQL-first migrations over environment-specific schema drift or manual dashboard edits.

### Deploy automation
- **D-23:** Use a dedicated `sandbox` branch for automatic sandbox Worker deploys.
- **D-24:** Also provide a `workflow_dispatch` override so sandbox deploys can be triggered manually without coupling them to the GitHub Pages workflow.
- **D-25:** Use a separate GitHub Actions workflow for Worker sandbox deploys rather than Cloudflare Workers Builds for this repo, because the repo already uses GitHub Actions and the user prefers a monorepo-style automation path.

### the agent's Discretion
- Exact Wrangler file shape and environment naming
- Whether preview and beta share the same remote database or whether preview is kept local-only
- Seed-data workflow and import/export ergonomics
- Exact migration folder path if the repo adopts a monorepo-style layout later

</decisions>

<specifics>
## Specific Ideas

- Treat `local -> beta -> production` as the environment path for D1, with one database per remote environment.
- Use Prisma for query/runtime ergonomics, but keep migration application aligned with D1's platform workflow.
- Avoid inventing table prefixes or schema conventions to compensate for environment separation that the platform already supports natively with separate databases.
- Keep database creation and secret provisioning scriptable through Wrangler so future automation can run through GitHub Actions or agent-driven CLI flows.
- Document clearly that deferring Cloudflare Access is a deliberate tradeoff, not an implicit security guarantee.
- Prefer a stable `workers.dev` sandbox hostname in this milestone unless a later phase intentionally adds a custom domain.

</specifics>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase requirements and milestone rules
- `.planning/ROADMAP.md` - Phase 5 goal, success criteria, and plan inventory
- `.planning/REQUIREMENTS.md` - Active milestone requirements for runtime, secrets, and operations
- `.planning/STATE.md` - Current focus and remaining open item for deploy automation

### Architecture and repo constraints
- `.planning/PROJECT.md` - Milestone context and key decisions that must stay in sync with this phase
- `AGENTS.md` - Repo constraints, verification expectations, and Stripe guidance
- `astro.config.mjs` - Current Astro deployment target that Phase 5 will replace for active alpha work
- `.github/workflows/pages.yml` - Existing deployment workflow that should not be silently coupled to Worker sandbox deploys

### External runtime and platform references
- [Astro deploy to Cloudflare](https://docs.astro.build/en/guides/deploy/cloudflare/) - Astro adapter and deploy model for Workers
- [Cloudflare D1 Wrangler commands](https://developers.cloudflare.com/d1/wrangler-commands/) - Database creation and migration commands
- [Cloudflare D1 migrations](https://developers.cloudflare.com/d1/reference/migrations/) - Built-in migration behavior and tracking table
- [Cloudflare D1 local development](https://developers.cloudflare.com/d1/best-practices/local-development/) - Local-versus-remote D1 behavior
- [Cloudflare D1 environments](https://developers.cloudflare.com/d1/configuration/environments/) - Binding separate databases per environment
- [Cloudflare D1 release notes](https://developers.cloudflare.com/d1/platform/release-notes/) - Current free-tier database-count limit
- [Prisma on Cloudflare D1](https://docs.prisma.io/docs/v6/orm/overview/databases/cloudflare-d1) - Current Prisma runtime and migration guidance for D1
- [Deploy Prisma to Cloudflare Workers](https://docs.prisma.io/docs/v6/orm/prisma-client/deployment/edge/deploy-to-cloudflare) - Worker-compatible Prisma runtime requirements
- [Cloudflare Workers preview URLs](https://developers.cloudflare.com/workers/configuration/previews/) - Current public-by-default behavior and Access option for preview endpoints
- [Cloudflare Workers GitHub Actions](https://developers.cloudflare.com/workers/ci-cd/external-cicd/github-actions/) - Official external CI/CD workflow for Wrangler deploys
- [Cloudflare Build Branches](https://developers.cloudflare.com/workers/ci-cd/builds/build-branches/) - Reference for branch-trigger behavior when comparing CI/CD options

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `astro.config.mjs`: Current GitHub Pages-oriented Astro config and the obvious switch point for a Workers-first runtime.
- `.github/workflows/pages.yml`: Existing CI pipeline that shows how much of the current deployment path is still coupled to Pages.

### Established Patterns
- The repo is still configured for static output today, so Phase 5 planning must explicitly account for runtime and binding setup rather than assume server routes already exist.
- The app shell and content collections remain the architectural center of the site; runtime changes should preserve that structure rather than split commerce into a separate app.

### Integration Points
- Future Worker bindings and environment names will be introduced through the Wrangler configuration and deployment workflow, not through browser code.
- Database lifecycle commands should be scriptable from the repo root so they can be reused in CI and local development without a second toolchain.

</code_context>

<deferred>
## Deferred Ideas

- Sharing one remote D1 database between beta and production
- Postgres-style schema-based environment isolation
- Prisma-only `migrate dev/deploy` as the migration authority while staying on D1
- Liquibase, Flyway, or any additional migration framework on top of the Prisma-plus-Wrangler path for v1.1
- Coupling Worker deployment automation directly to the legacy Pages production workflow before Phase 5 closes
- Treating Workers Builds as mandatory when the repo already has a functioning GitHub Actions-based deployment workflow

</deferred>

---

*Phase: 05-cloudflare-runtime-and-secret-plumbing*
*Context gathered: 2026-04-20*

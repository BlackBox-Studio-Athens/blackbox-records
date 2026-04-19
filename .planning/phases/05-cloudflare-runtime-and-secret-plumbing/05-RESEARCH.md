# Phase 5: Cloudflare Runtime And Secret Plumbing - Research

**Researched:** 2026-04-20
**Domain:** Astro on Cloudflare Workers, D1, Prisma on D1, GitHub Actions deployment
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- The active alpha runtime target is Astro on Cloudflare Workers.
- GitHub Pages is no longer the day-to-day runtime target during alpha, but it remains the brownfield baseline that must not be disturbed in this milestone.
- Use one Astro configuration oriented around the Workers runtime rather than split Astro config files.
- Use a stable separate Cloudflare sandbox hostname for worker-based testing.
- GitHub Secrets may hold CI/CD credentials, but runtime secrets must live in Worker secrets or bindings.
- Cloudflare Access is intentionally deferred until a later live-mode milestone; the sandbox must not be treated as strongly access-controlled.
- Use local D1 for normal development, one shared remote beta D1 for sandbox testing, and a separate remote D1 for production later.
- Stay on D1 and use Prisma for runtime database access.
- Stay on D1/Wrangler migrations, with `prisma migrate diff` generating SQL.
- Use a dedicated `sandbox` branch for automatic Worker deploys and provide a `workflow_dispatch` override.
- Keep Worker sandbox automation separate from the GitHub Pages workflow.

### the agent's Discretion
- Exact `wrangler.jsonc` layout and environment names
- Exact package-script names
- Whether a minimal runtime helper for typed bindings lands in Phase 5 or Phase 8
- Whether the stable sandbox hostname is a `workers.dev` hostname or a custom domain later

### Deferred Ideas (OUT OF SCOPE)
- Cloudflare Access enforcement in this milestone
- Separate Node backend framework
- Separate migration framework such as Liquibase or Flyway
- Sharing one remote D1 database between beta and production
- Schema-based environment isolation

</user_constraints>

<architectural_responsibility_map>
## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Brochure/content rendering | Astro prerender | Worker fallback | Most routes should stay static where practical, with Worker execution only where needed. |
| Checkout and webhook endpoints | Worker server routes | — | Secret-bearing Stripe operations and webhook verification must stay server-side. |
| Inventory and order state | D1 | Worker runtime | D1 stores operational state, Worker code owns access. |
| Runtime DB access ergonomics | Prisma runtime | D1 SQL | Prisma improves maintainability, but D1 remains the backing store. |
| Schema migration application | Wrangler/D1 migrations | Prisma schema diff | Current Prisma D1 guidance keeps migration apply on the D1/Wrangler side. |
| Local and deployed secret handling | Worker secrets / `.dev.vars` | GitHub Secrets for CI | CI credentials and runtime secrets must not be conflated. |
| Sandbox deployment automation | GitHub Actions | Wrangler CLI | External CI aligns with the current repo workflow and avoids coupling with Pages. |

</architectural_responsibility_map>

<research_summary>
## Summary

Astro's current Cloudflare deployment model supports a "mostly static with selective on-demand routes" approach, which matches this repo well. The official docs still support adding the Cloudflare adapter while keeping the broader site prerendered and opting specific pages or endpoints into on-demand rendering with `export const prerender = false`. That means Phase 5 does not need to convert the entire site into a fully dynamic app just to support checkout and webhooks.

Cloudflare's current Worker runtime also supports the secret and binding model the project wants. Runtime secrets are set through Wrangler or the dashboard, local secret files are `.dev.vars` or `.env`, and the new `secrets.required` configuration property can now make missing secrets fail early in local development and deployment. This is a strong fit for Phase 5 because it turns secret requirements into a checked-in contract instead of tribal knowledge.

Prisma is a good runtime-layer choice here, but the migration story remains specific. Current Prisma docs for D1 say to use the D1 adapter for runtime access and keep schema migrations on the Wrangler/D1 side, with `prisma migrate diff` generating SQL. That means the maintainable split is: Prisma for query ergonomics, Prisma schema for modeling, Wrangler migrations for actual application. Trying to force Prisma-only `migrate dev/deploy` onto D1 would be a mismatch with the documented workflow.

For deployment automation, the repo already uses GitHub Actions for Pages, and Cloudflare's own docs support Wrangler-based deploys from GitHub Actions. That makes a separate Worker sandbox workflow the cleanest option: push-driven deploys on a dedicated `sandbox` branch plus a `workflow_dispatch` override. It preserves automation without coupling Worker sandbox rollout to the existing Pages workflow.

**Primary recommendation:** Execute Phase 5 as a Workers-first runtime lift with one Astro config, a custom `wrangler.jsonc`, Prisma-on-D1 runtime scaffolding, and a separate GitHub Actions workflow for sandbox Worker deploys. Keep the legacy Pages path available as an explicit non-default build target until the later go-live milestone.
</research_summary>

<standard_stack>
## Standard Stack

### Core
| Library / Platform | Version | Purpose | Why Standard |
|--------------------|---------|---------|--------------|
| `astro` | existing `^5.18.0` | Main app framework | Already the core app layer; Phase 5 should preserve it. |
| `@astrojs/cloudflare` | Astro-5-compatible release at implementation time | Official Worker adapter | Official Astro path for Cloudflare Workers and selective on-demand routes. |
| `wrangler` | current stable | Local Worker runtime, deploys, D1, secrets | Official Cloudflare CLI for runtime bindings and deploys. |
| Cloudflare Workers | platform | Runtime | Required for server routes, webhooks, and server-only secrets. |
| D1 | platform | SQL operational state | Lowest-ops SQL store colocated with the Worker runtime. |

### Supporting
| Library / Tool | Version | Purpose | When to Use |
|----------------|---------|---------|-------------|
| `prisma` | current stable | Prisma schema tooling and `migrate diff` | Use for data modeling and SQL generation against D1. |
| `@prisma/client` | current stable | Runtime DB client | Use inside Worker-side server code once data access is introduced. |
| `@prisma/adapter-d1` | current stable | Prisma D1 runtime adapter | Required for Prisma runtime access on D1. |
| `cloudflare/wrangler-action@v3` | current | GitHub Actions deploy step | Use in the sandbox Worker workflow. |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| GitHub Actions + Wrangler | Workers Builds | Native Cloudflare CI, but less aligned with the repo's current automation style and branch strategy. |
| Prisma runtime + Wrangler migrations | Raw D1 access everywhere | Thinner, but weaker on readability and maintainability. |
| D1 | Another free DB later | Still possible, but unnecessary until D1 becomes an actual blocker. |
| Worker runtime in Astro | Separate Node framework | Adds more framework and deployment surface than the current phase needs. |

</standard_stack>

<architecture_patterns>
## Architecture Patterns

### Pattern 1: Workers-first Astro config with explicit legacy Pages mode
**What:** Keep one `astro.config.mjs`, but make the Worker build the primary path while preserving a non-default legacy Pages build mode.
**When to use:** Brownfield Astro repos that need a live server runtime during migration but cannot break an existing static baseline abruptly.
**Why here:** It satisfies the "one config" decision without forcing the Pages workflow to disappear immediately.

### Pattern 2: Prisma runtime layer over D1, with Wrangler-applied SQL migrations
**What:** Use Prisma Client and the D1 adapter for maintainable runtime access, while keeping migration files as SQL generated from the Prisma schema and applied by Wrangler.
**When to use:** Projects that want readable TypeScript data access without diverging from D1's documented migration workflow.
**Why here:** It matches the user's maintainability preference and the current official D1 + Prisma guidance.

### Pattern 3: Secret contract in `wrangler.jsonc`
**What:** Declare required Worker secrets in config and use `.dev.vars.example` plus GitHub Secrets for CI auth.
**When to use:** Worker projects where secret names must be explicit and validated early.
**Why here:** It reduces setup drift and avoids runtime-secret confusion across local dev and CI.

### Pattern 4: Separate sandbox workflow in GitHub Actions
**What:** Add a dedicated Worker sandbox workflow triggered by pushes to `sandbox` and by `workflow_dispatch`.
**When to use:** Repos that already rely on GitHub Actions and need an automated but isolated non-production deploy path.
**Why here:** It gives full automation without tying sandbox deploys to the Pages pipeline.

### Anti-Patterns to Avoid
- **Using Prisma-only `migrate dev/deploy` on D1:** Current Prisma docs do not present this as the supported D1 migration path.
- **Treating the sandbox as private while Access is deferred:** Without Cloudflare Access or an equivalent guard, the sandbox is a reachable alpha surface.
- **Letting Worker deploys piggyback on the Pages workflow:** This breaks the agreed decoupling between sandbox runtime work and the current static baseline.
- **Scattering D1 access through route files:** Phase 5 should set up the Prisma runtime direction so later phases do not fall back to ad hoc DB calls.

</architecture_patterns>

<dont_hand_roll>
## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Secret validation | Custom shell scripts checking env files | `secrets.required` in Wrangler + `.dev.vars.example` | Cloudflare now validates required secrets natively. |
| Runtime DB layer | Ad hoc `env.DB.prepare()` everywhere | Prisma + `@prisma/adapter-d1` | Better readability and maintainability. |
| Schema deployment | Custom SQL runner or homegrown migration tracker | Wrangler D1 migrations | D1 already tracks applied migrations. |
| Sandbox CI | Manual deploy steps documented in README only | GitHub Actions + Wrangler action | The repo already uses GitHub Actions, and the user wants full automation. |

</dont_hand_roll>

<common_pitfalls>
## Common Pitfalls

### Pitfall 1: Assuming the sandbox is private because it is "only for testers"
**What goes wrong:** The team behaves as if the sandbox URL is access-controlled when Cloudflare Access is not yet enabled.
**How to avoid:** Document the exposure explicitly in README and AGENTS, and avoid sensitive assumptions in phase execution or UAT.

### Pitfall 2: Forgetting that Pages still needs a clean escape hatch
**What goes wrong:** Worker-first changes silently destroy the ability to rebuild the legacy Pages baseline.
**How to avoid:** Add an explicit legacy Pages build script and keep the existing Pages workflow untouched in this phase.

### Pitfall 3: Mixing Prisma modeling and D1 migration application rules
**What goes wrong:** Developers try to use Prisma migrate commands as if D1 were a conventional Node-hosted relational DB.
**How to avoid:** Keep the rule simple: Prisma models and generates SQL; Wrangler creates and applies D1 migrations.

### Pitfall 4: Treating GitHub Secrets as the runtime secret store
**What goes wrong:** CI can deploy, but the deployed Worker is missing the actual runtime secrets.
**How to avoid:** Separate CI auth secrets from runtime Worker secrets in both code comments and repo docs.

### Pitfall 5: Over-scoping Phase 5 into full schema design
**What goes wrong:** The runtime/setup phase starts inventing order and inventory schema details that belong to Phase 8.
**How to avoid:** Scaffold the Prisma and migration workflow now, but defer actual domain models and SQL until the schema phase.

</common_pitfalls>

<code_examples>
## Code Examples

Verified patterns from official sources:

### Astro on Cloudflare Worker output
```jsonc
{
  "main": "dist/_worker.js/index.js",
  "name": "blackbox-records-sandbox",
  "compatibility_date": "2026-04-20",
  "assets": {
    "binding": "ASSETS",
    "directory": "./dist"
  }
}
```

### Required Worker secrets
```jsonc
{
  "secrets": {
    "required": [
      "STRIPE_SECRET_KEY",
      "STRIPE_WEBHOOK_SECRET"
    ]
  }
}
```

### Prisma-on-D1 schema direction
```prisma
generator client {
  provider = "prisma-client"
  output   = "../src/generated/prisma"
  runtime  = "cloudflare"
}

datasource db {
  provider = "sqlite"
}
```

### D1 migration flow with Prisma
```bash
pnpm wrangler d1 migrations create blackbox-beta init
pnpm prisma migrate diff --from-empty --to-schema prisma/schema.prisma --script --output prisma/migrations/0001_init.sql
pnpm wrangler d1 migrations apply blackbox-beta --local
pnpm wrangler d1 migrations apply blackbox-beta --remote
```

### Sandbox Worker deploy automation
```yaml
on:
  push:
    branches: ["sandbox"]
  workflow_dispatch:
```

</code_examples>

<planning_implications>
## Planning Implications

- Phase 5 execution should add Worker runtime capability without requiring checkout, order, or shipping implementation yet.
- The execution plan should introduce the Prisma runtime and migration workflow scaffolding, but avoid premature domain schema work.
- The deploy workflow should default to the `sandbox` branch and still allow manual dispatch for controlled beta testing.
- Because Cloudflare Access is deferred, docs must explicitly warn that the sandbox is not a private environment.

</planning_implications>

---

*Research completed: 2026-04-20*

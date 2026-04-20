# Phase 5: Worker Backend Platform And Deployment Plumbing - Context

**Gathered:** 2026-04-20
**Status:** Planning complete

<domain>
## Phase Boundary

Phase 5 bootstraps a **separate Cloudflare Worker backend** inside the repo. It does not move the Astro frontend to Workers, and it does not front-run the commerce domain model, D1 schema design, or Stripe checkout implementation.

</domain>

<decisions>
## Implementation Decisions

### Deployment model
- **D-01:** The Astro site remains the static frontend and keeps its GitHub Pages deployment path during this milestone.
- **D-02:** A separate Cloudflare Worker backend is added in-repo for dynamic commerce APIs, Stripe integration, webhooks, and D1 access.
- **D-03:** The Worker is a backend/BFF, not the primary frontend runtime.

### Environment model
- **D-04:** Wrangler is the source of truth for Worker runtime configuration and environment naming.
- **D-05:** Frontend-to-Worker URLs and env vars must be explicit for local and sandbox use.
- **D-06:** The sandbox Worker must have one stable hostname so browser checks, Stripe return URLs, and webhook testing point at one consistent backend target.

### Secrets and trust boundaries
- **D-07:** Runtime secrets stay in Worker secrets/bindings, not in browser code and not only in GitHub Secrets.
- **D-08:** GitHub Secrets hold CI credentials such as Cloudflare API tokens and account identifiers.
- **D-09:** Cloudflare Access remains deferred; the sandbox Worker must be treated as reachable, not private.

### Phase shape
- **D-10:** Phase 5 owns only backend runtime/auth/deploy plumbing.
- **D-11:** Phase 5.1 is the architecture gate for entities, source-of-truth, IDs, mappings, and APIs.
- **D-12:** D1 + Prisma implementation remains deferred to Phase 6.1.

### the agent's Discretion
- exact script names for local Worker dev/build/deploy
- exact backend package/layout choice, as long as it stays separate from the Astro frontend
- exact env var names, as long as frontend vs backend ownership stays explicit

</decisions>

<specifics>
## Specific Ideas

- Treat Phase 5 as the minimum platform foundation needed before storefront and backend state work begins.
- Preserve the static Astro build path while adding backend-specific commands and workflow files.
- Keep sandbox backend deployment automation isolated from the current Pages workflow.

</specifics>

<canonical_refs>
## Canonical References

- `.planning/ROADMAP.md` - Phase 5 goal, requirements, success criteria, and plan list
- `.planning/REQUIREMENTS.md` - DEPL and SECU requirements
- `.planning/STATE.md` - current milestone position and plan counts
- `.planning/PROJECT.md` - milestone context and key decisions
- `astro.config.mjs` - current frontend runtime baseline that should remain static
- `.github/workflows/pages.yml` - existing production deployment path that must stay intact
- `AGENTS.md` - repo constraints and verification policy

</canonical_refs>

<code_context>
## Existing Code Insights

- The repo is static-first today and already deploys successfully to GitHub Pages.
- `/shop/` is still a redirect route and the app shell remains the frontend architectural center.
- No separate backend workspace or Worker config currently exists in the repo.

</code_context>

<deferred>
## Deferred Ideas

- commerce entity modeling
- source-of-truth and mapping rules
- D1 and Prisma runtime setup
- checkout session creation, webhooks, and BOX NOW integration

</deferred>

---

*Phase: 05-cloudflare-runtime-and-secret-plumbing*
*Context gathered: 2026-04-20*

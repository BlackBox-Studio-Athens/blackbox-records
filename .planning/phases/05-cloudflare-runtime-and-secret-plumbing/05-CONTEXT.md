# Phase 5: Cloudflare Runtime And Secret Plumbing - Context

**Gathered:** 2026-04-20
**Status:** Planning complete

<domain>
## Phase Boundary

Phase 5 now stops at runtime, environment, local Worker ergonomics, deployment plumbing, and secret ownership. It does not front-run the unified shop model, local D1 + Prisma domain work, or any Stripe checkout integration.

</domain>

<decisions>
## Implementation Decisions

### Runtime split
- **D-01:** Cloudflare Workers remains the active alpha runtime target.
- **D-02:** Use one Astro config that is Worker-first while preserving an explicit legacy Pages build path.
- **D-03:** Brochure and editorial routes remain prerendered by default; later commerce routes opt into on-demand execution deliberately.
- **D-04:** Phase 5 defines the runtime boundary only. The actual shop projection work belongs to Phase 6 and the local D1 + Prisma domain baseline belongs to Phase 6.1.

### Environment model
- **D-05:** Wrangler becomes the source of truth for Worker runtime configuration and environment naming.
- **D-06:** The sandbox Worker must have one stable hostname so browser checks, Stripe return URLs, and future webhook testing point at one consistent target.
- **D-07:** Local Worker development must be explicit and documented, not inferred from the legacy Astro Pages workflow.

### Secrets and trust boundaries
- **D-08:** Runtime secrets stay in Worker secrets/bindings, not in browser code and not only in GitHub Secrets.
- **D-09:** GitHub Secrets hold CI credentials such as Cloudflare API tokens and account identifiers.
- **D-10:** Cloudflare Access remains deferred; sandbox must be treated as reachable, not as a private internal surface.

### Phase shape
- **D-11:** Phase 5 expands from 3 plans to 6 plans:
  - `05-01` adapter bootstrap
  - `05-02` prerender contract
  - `05-03` Wrangler and environment model
  - `05-04` local Worker dev path
  - `05-05` sandbox deploy workflow and hostname
  - `05-06` secrets contract
- **D-12:** Prisma and D1 schema work move out of Phase 5 and into inserted Phase 6.1 so the runtime foundation stays separate from local commerce state modeling.

### the agent's Discretion
- exact script names for Worker dev/build
- whether Pages fallback uses env switching or a named explicit compatibility mode
- exact Wrangler env labels, as long as local/sandbox/production intent stays clear

</decisions>

<specifics>
## Specific Ideas

- Treat Phase 5 as the minimum Worker platform foundation needed before native shop work begins.
- Do not let D1 or Prisma scaffolding distort the simpler runtime tasks in this phase.
- Keep sandbox deployment automation isolated from the current Pages workflow.
- Document the runtime contract so later phases can assume Worker bindings and local dev are already stable.

</specifics>

<canonical_refs>
## Canonical References

- `.planning/ROADMAP.md` - Phase 5 goal, requirements, success criteria, and expanded plan list
- `.planning/REQUIREMENTS.md` - DEPL and SECU requirements
- `.planning/STATE.md` - current milestone position and plan counts
- `.planning/PROJECT.md` - milestone context and key decisions
- `astro.config.mjs` - current Astro runtime config baseline
- `.github/workflows/pages.yml` - existing production deployment path that must stay isolated
- `AGENTS.md` - repo runtime constraints and Stripe guidance

</canonical_refs>

<code_context>
## Existing Code Insights

- The repo is still static-first today, so runtime capability must be introduced intentionally.
- `/shop/` is still a redirect route and must not be treated as already-native.
- The app shell and content collections remain the architectural center and should survive the runtime transition unchanged.

</code_context>

<deferred>
## Deferred Ideas

- Prisma runtime setup and migration scaffolding
- local D1 bootstrap and inventory-related reads
- unified shop projection and fixture-backed shop data
- checkout session creation, webhooks, and BOX NOW integration

</deferred>

---

*Phase: 05-cloudflare-runtime-and-secret-plumbing*
*Context gathered: 2026-04-20*

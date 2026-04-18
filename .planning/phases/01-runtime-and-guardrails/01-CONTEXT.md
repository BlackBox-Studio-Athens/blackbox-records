# Phase 1: Runtime And Guardrails - Context

**Gathered:** 2026-04-19
**Status:** Ready for planning

<domain>
## Phase Boundary

Decide the production runtime, deployment model, data-store baseline, secret-handling rules, and cutover posture for the native commerce migration before any implementation planning begins.

</domain>

<decisions>
## Implementation Decisions

### Runtime and hosting model
- **D-01:** The site will move from GitHub Pages static hosting to Astro running on Cloudflare Workers.
- **D-02:** The storefront should stay mostly prerendered where possible, with on-demand server execution only where commerce or runtime-bound behavior requires it.
- **D-03:** Do not plan around a split Pages storefront plus separate backend service for v1.
- **D-04:** Do not plan around Java, Spring Boot, Oracle Always Free compute, or Cloudflare Containers for v1.

### Database and system ownership
- **D-05:** D1 is the v1 operational database baseline for commerce state. This supersedes the earlier milestone assumption that Supabase would own inventory and order lifecycle state.
- **D-06:** Stripe remains the source of truth for products, prices, checkout sessions, and payment event truth.
- **D-07:** D1 is the source of truth for inventory counts and order lifecycle state only.
- **D-08:** SQL is the chosen storage model for v1. Do not plan the commerce core around KV or other NoSQL storage.

### Trust boundaries and secrets
- **D-09:** Browser code may read safe projections but must not write authoritative inventory state or paid-order state.
- **D-10:** Inventory decrements only after verified webhook-confirmed payment success. v1 does not reserve stock before payment.
- **D-11:** GitHub Secrets may hold CI and deployment credentials, but runtime secrets must live in Cloudflare Worker secrets and bindings, not only in GitHub Secrets.
- **D-12:** D1 access must use Worker environment bindings. Server secrets remain server-only.
- **D-13:** Stripe secret keys, webhook secrets, BOX NOW credentials, and any privileged database access must never be exposed to the browser.
- **D-14:** Planning should assume Stripe API version pinning is explicit in server integration rather than inheriting account-default behavior.

### Cutover posture
- **D-15:** This migration is a full replacement of the current Fourthwall model. Do not plan a Fourthwall fallback path.
- **D-16:** `/shop/` becomes a native in-site route in the Cloudflare-hosted Astro deployment.
- **D-17:** The current GitHub Pages plus Fourthwall setup is the migration baseline for analysis only, not the intended end state.

### the agent's Discretion
- Exact Worker file layout and route structure
- Exact D1 schema shape and migration tooling
- Local development and preview workflow details
- Whether later phases need Queues, Durable Objects, or other Cloudflare primitives

</decisions>

<specifics>
## Specific Ideas

- Keep the Astro site architecture intact instead of introducing a separate application stack for commerce.
- Favor the lowest recurring cost and lowest maintenance path that still supports embedded checkout, webhooks, and server-only secrets.
- Use Cloudflare-native runtime and database primitives for v1 unless a later phase finds a concrete blocker.
- Treat the previous Supabase-only storage assumption as superseded by the Cloudflare Workers plus D1 decision made in this discussion.

</specifics>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase requirements and milestone rules
- `.planning/ROADMAP.md` — Phase 1 goal, success criteria, and active milestone boundaries
- `.planning/REQUIREMENTS.md` — Original milestone requirements; any Supabase-specific wording must be treated as superseded by this context's D1 decision
- `.planning/STATE.md` — Current project position and remaining blockers

### Architecture and decision records
- `.planning/adrs/ADR-001-hosting-runtime.md` — Prior runtime ADR that must be updated to reflect the Cloudflare Workers decision captured here
- `.planning/adrs/ADR-002-commerce-boundaries.md` — Prior commerce-boundary ADR; use it for trust model intent, but replace Supabase references with D1 during Phase 1 planning
- `.planning/adrs/ADR-003-boxnow-and-cutover.md` — Existing BOX NOW and cutover assumptions that affect later phases

### Current repo constraints and integration points
- `AGENTS.md` — Repo constraints, verification expectations, and current project guidance
- `astro.config.mjs` — Current GitHub Pages static deployment config that Phase 1 planning will replace
- `src/pages/shop/index.astro` — Current `/shop/` Fourthwall redirect route that native commerce will replace
- `src/layouts/RedirectLayout.astro` — Existing redirect layout pattern used by the current external shop handoff
- `src/components/app-shell/AppShellRoot.tsx` — Top-level app-shell routing owner; new native shop behavior must respect this shell model
- `src/config/site.ts` — Existing route/path handling that includes `/shop/`

### External runtime and platform references
- [Astro on-demand rendering](https://docs.astro.build/en/guides/on-demand-rendering/) — Astro server-route model and selective prerendering
- [Deploy your Astro Site to Cloudflare](https://docs.astro.build/en/guides/deploy/cloudflare/) — Astro Cloudflare adapter and deployment path
- [Cloudflare Workers pricing](https://developers.cloudflare.com/workers/platform/pricing/) — Free-tier runtime constraints relevant to low-volume planning
- [Cloudflare D1 pricing](https://developers.cloudflare.com/d1/platform/pricing/) — D1 free-tier read/write/storage constraints
- [Cloudflare Workers secrets](https://developers.cloudflare.com/workers/configuration/secrets/) — Runtime secret handling on deployed Workers
- [Cloudflare D1 Worker API](https://developers.cloudflare.com/d1/worker-api/d1-database/) — D1 access via Worker environment bindings

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/layouts/RedirectLayout.astro`: Encapsulates the current external redirect behavior and marks the existing `/shop/` handoff pattern that Phase 1 replaces.
- `src/layouts/SiteLayout.astro`: Current document-level metadata and redirect support for static pages.
- `src/components/app-shell/AppShellRoot.tsx`: Owns top-level navigation and shell-route behavior; the future native shop route must integrate with this layer instead of bypassing it.

### Established Patterns
- `astro.config.mjs` currently uses `output: 'static'` and GitHub Pages `site` / `base` settings, so runtime planning must explicitly account for replacing the current deployment model.
- The persistent app shell owns top-level section routing and overlay behavior, so planning should preserve that ownership model.
- Astro content collections remain the editorial CMS/content layer and should not become the sellable catalog authority for native commerce.

### Integration Points
- `astro.config.mjs` is the deployment/runtime switch point from static Pages output to Cloudflare-hosted Astro.
- `src/pages/shop/index.astro` is the current commerce entry route and expected replacement point for native storefront behavior.
- `src/config/site.ts` and shell navigation logic are likely touchpoints for changing `/shop/` behavior without breaking top-level routing expectations.

</code_context>

<deferred>
## Deferred Ideas

- Reintroducing Java or Spring Boot through a separate service or paid container runtime
- Using Oracle Always Free compute as the primary v1 host
- Using Supabase instead of D1 for v1 operational state
- Using KV or another NoSQL store for inventory or order lifecycle state
- Keeping a Fourthwall fallback path after native cutover

</deferred>

---

*Phase: 01-runtime-and-guardrails*
*Context gathered: 2026-04-19*

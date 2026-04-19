# Phase 1: Runtime And Guardrails - Research

**Researched:** 2026-04-19
**Domain:** Astro on Cloudflare Workers, D1, Stripe embedded Checkout, deployment guardrails
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- The site will move from GitHub Pages static hosting to Astro running on Cloudflare Workers.
- The storefront should stay mostly prerendered where possible, with on-demand server execution only where commerce or runtime-bound behavior requires it.
- Do not plan around a split Pages storefront plus separate backend service for v1.
- Do not plan around Java, Spring Boot, Oracle Always Free compute, or Cloudflare Containers for v1.
- D1 is the v1 operational database baseline for commerce state. This supersedes the earlier milestone assumption that Supabase would own inventory and order lifecycle state.
- Stripe remains the source of truth for products, prices, checkout sessions, and payment event truth.
- D1 is the source of truth for inventory counts and order lifecycle state only.
- SQL is the chosen storage model for v1. Do not plan the commerce core around KV or other NoSQL storage.
- Browser code may read safe projections but must not write authoritative inventory state or paid-order state.
- Inventory decrements only after verified webhook-confirmed payment success. v1 does not reserve stock before payment.
- GitHub Secrets may hold CI and deployment credentials, but runtime secrets must live in Cloudflare Worker secrets and bindings, not only in GitHub Secrets.
- D1 access must use Worker environment bindings. Server secrets remain server-only.
- Stripe secret keys, webhook secrets, BOX NOW credentials, and any privileged database access must never be exposed to the browser.
- Planning should assume Stripe API version pinning is explicit in server integration rather than inheriting account-default behavior.
- This migration is a full replacement of the current Fourthwall model. Do not plan a Fourthwall fallback path.
- `/shop/` becomes a native in-site route in the Cloudflare-hosted Astro deployment.
- The current GitHub Pages plus Fourthwall setup is the migration baseline for analysis only, not the intended end state.

### the agent's Discretion
- Exact Worker file layout and route structure
- Exact D1 schema shape and migration tooling
- Local development and preview workflow details
- Whether later phases need Queues, Durable Objects, or other Cloudflare primitives

### Deferred Ideas (OUT OF SCOPE)
- Reintroducing Java or Spring Boot through a separate service or paid container runtime
- Using Oracle Always Free compute as the primary v1 host
- Using Supabase instead of D1 for v1 operational state
- Using KV or another NoSQL store for inventory or order lifecycle state
- Keeping a Fourthwall fallback path after native cutover

</user_constraints>

<architectural_responsibility_map>
## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Editorial pages and content collections | CDN/Static | Frontend Server | Astro can prerender brochure and CMS-driven routes while preserving existing content architecture. |
| Native `/shop/` route rendering | Frontend Server | Browser/Client | The app shell still owns navigation, but server-rendered or on-demand shop entry points are required for live commerce behavior. |
| Checkout Session creation | Frontend Server | — | Stripe secret key use and Checkout Session creation must stay server-side. |
| Webhook verification and payment authority | Frontend Server | Database/Storage | The webhook endpoint must verify signatures and mutate order/inventory state without browser involvement. |
| Inventory and order lifecycle state | Database/Storage | Frontend Server | D1 stores operational commerce state; Worker code owns reads/writes. |
| Catalog and pricing truth | API/Backend | Frontend Server | Stripe remains authoritative; Astro and D1 should consume projections, not duplicate catalog truth. |
| CI/CD secret injection | API/Backend | — | GitHub Actions can deliver deploy-time credentials, but deployed runtime secrets must terminate in Worker secrets/bindings. |

</architectural_responsibility_map>

<research_summary>
## Summary

Astro’s official Cloudflare deployment path supports running full-stack Astro apps on Cloudflare Workers, with prerendered assets served from `dist` and on-demand server execution provided by the Cloudflare adapter. This fits the repo’s brownfield shape better than keeping GitHub Pages for storefront hosting, because Stripe embedded Checkout and webhook handling require live server routes and secret-safe execution contexts. Cloudflare Workers Free and D1 Free both appear sufficient for the stated low order volume, while avoiding the operational burden of managing a separate VM or container host.

Cloudflare’s runtime model also matches the trust-boundary requirements. Secrets are first-class Worker bindings, and D1 is accessed via Worker environment bindings rather than browser-accessible credentials. Local development uses `wrangler dev` or Vite-backed Worker dev plus local or remote D1 bindings, which reduces the risk of designing a Node-only local flow that breaks on `workerd`.

Stripe’s current official docs create one important planning constraint: as of April 19, 2026, the Checkout Sessions API reference uses `ui_mode: embedded`, not `embedded_page`, while the broader product docs still describe the integration as an embedded Checkout page or embedded form. The plan should therefore normalize project docs around date-stamped Stripe terminology and explicit API version pinning before any sandbox work starts, rather than baking stale enum names into later phases.

**Primary recommendation:** Treat Phase 1 as a documentation-normalization phase that locks Astro on Cloudflare Workers, D1-backed operational state, Worker-secret handling, and a Stripe API terminology/version policy before any sandbox or UI implementation work.
</research_summary>

<standard_stack>
## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `astro` | `^5.18.0` | Existing site runtime | Already in repo; migration should preserve Astro as the primary app layer. |
| `@astrojs/cloudflare` | current Astro-compatible release at implementation time | Cloudflare Worker adapter for Astro | Official Astro path for Cloudflare-hosted Astro apps with on-demand rendering. |
| `wrangler` | current stable at implementation time | Worker build, local dev, bindings, deploy | Official Cloudflare CLI for Workers and D1 workflows. |
| `D1` | managed platform service | SQL operational state | Native Worker binding, free tier, low ops, relational fit for orders and inventory. |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `stripe` | current stable at implementation time | Server-side Checkout Session and webhook handling | Use in Worker server routes for session creation and event verification. |
| `@stripe/stripe-js` | current stable at implementation time | Browser-side embedded Checkout bootstrap | Use only in later implementation phases that mount embedded Checkout. |
| Cloudflare Worker secrets | platform feature | Runtime secret storage | Use for Stripe secret key, webhook secret, BOX NOW credentials, and any privileged integration token. |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Cloudflare Workers + D1 | GitHub Pages + separate Node API | Preserves static hosting, but adds a second deployment surface and cross-origin/service complexity. |
| Cloudflare Workers + D1 | Oracle Always Free + Java | Keeps Java viable, but raises maintenance and portability costs for a low-volume store. |
| D1 | Supabase | Good product, but conflicts with the locked Cloudflare-native low-ops direction for v1. |

**Installation:**
```bash
pnpm add -D @astrojs/cloudflare wrangler
pnpm add stripe @stripe/stripe-js
```
</standard_stack>

<architecture_patterns>
## Architecture Patterns

### System Architecture Diagram

```text
Browser / App Shell
  -> Astro routes and hydrated UI
    -> Cloudflare Worker server routes
      -> Stripe API (catalog, Checkout Sessions, webhook verification)
      -> D1 (inventory + order state)
      -> BOX NOW API (later shipping phase)

Stripe webhook delivery
  -> Cloudflare Worker webhook endpoint
    -> signature verification
    -> idempotent order update in D1
    -> inventory decrement after paid confirmation
```

### Recommended Project Structure
```text
src/
├── pages/                # Astro routes, including future native /shop route
├── components/           # App-shell and storefront UI
├── lib/                  # Route helpers, data mapping, server-side commerce helpers
└── content/              # Editorial collections remain here

wrangler.jsonc            # Worker deployment + bindings
migrations/ or db/        # D1 migration assets when implementation begins
```

### Pattern 1: Mostly static Astro with selective on-demand routes
**What:** Keep brochure/content pages prerendered, but add Worker-backed on-demand behavior only for commerce routes and APIs.
**When to use:** Brownfield Astro sites that need minimal dynamic behavior without converting the entire site to a fully dynamic app.
**Example:**
```ts
// Example planning target, not implementation:
// keep static content routes prerendered
// add Worker-backed server routes for /api/checkout and /api/webhooks/stripe
```

### Pattern 2: Stripe as catalog/payment truth, D1 as operational state
**What:** Read product/price truth from Stripe and persist only operational data that Stripe does not own, such as inventory and internal order status.
**When to use:** Low-volume commerce where portability and minimized duplicated data matter more than advanced commerce back-office features.
**Example:**
```ts
// Server route creates Checkout Session from Stripe price IDs
// Webhook persists paid-order transition and decrements D1 inventory
```

### Pattern 3: Worker bindings for secrets and database access
**What:** Resolve secrets and D1 connections from the Worker `env` binding instead of shipping credentials through the browser or committing them in config.
**When to use:** Any Stripe/D1 integration on Cloudflare Workers.
**Example:**
```ts
export interface Env {
  DB: D1Database;
  STRIPE_SECRET_KEY: string;
  STRIPE_WEBHOOK_SECRET: string;
}
```

### Anti-Patterns to Avoid
- **GitHub Pages as final commerce host:** Pages alone cannot create Checkout Sessions or receive authoritative webhooks.
- **Browser writes to inventory/order state:** This violates the locked trust model and makes payment authority unreliable.
- **Catalog duplication across Astro content and D1:** Use Astro collections for editorial content only; keep sellable pricing truth in Stripe.
- **Assuming old Stripe terminology is still current:** Current official API docs use `ui_mode: embedded`; stale enum names should be treated as documentation drift, not implementation truth.

</architecture_patterns>

<dont_hand_roll>
## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Runtime secret management | Custom encrypted JSON or checked-in env files | Worker secrets and bindings | Platform support already exists and is safer. |
| Embedded payment UI | Homegrown card form or custom payment iframe | Stripe Checkout embedded form / Stripe-hosted embedded checkout flow | Stripe already handles payment UX, compliance, and payment-method flows. |
| Operational DB layer | Ad hoc JSON blobs in KV | D1 SQL tables and migrations | Inventory, orders, and reconciliation are relational workflows. |
| Local Worker emulation | Node-only local stubs that ignore Worker APIs | `wrangler dev` / Vite Worker runtime + local D1 | Closer match to production `workerd` behavior. |

**Key insight:** The lowest-maintenance path comes from leaning into Cloudflare’s runtime and Stripe’s prebuilt payment surface, not recreating missing platform primitives in app code.
</dont_hand_roll>

<common_pitfalls>
## Common Pitfalls

### Pitfall 1: Treating GitHub Secrets as runtime secret storage
**What goes wrong:** Teams store secrets only in GitHub Actions and forget that deployed Worker code still needs secret bindings at runtime.
**Why it happens:** CI secret storage and runtime secret storage get conflated.
**How to avoid:** Document GitHub Secrets as deploy-pipeline inputs only, and declare required Worker secrets in Wrangler/Worker configuration.
**Warning signs:** Planning language says “secrets live in GitHub” without naming Worker secrets or bindings.

### Pitfall 2: Designing against Node-only assumptions
**What goes wrong:** Packages or APIs that work locally in Node fail in the Worker runtime.
**Why it happens:** The team plans around generic server semantics instead of `workerd` compatibility.
**How to avoid:** Keep Phase 1 explicit that the target runtime is Cloudflare Workers and local dev must test against the Worker execution model.
**Warning signs:** Plans rely on Node filesystem access, process-managed long-lived servers, or Java-only runtime assumptions.

### Pitfall 3: Using return pages as payment authority
**What goes wrong:** Orders are marked paid from redirect/return-page logic instead of verified webhook events.
**Why it happens:** Embedded Checkout visually succeeds in browser flows, which tempts teams to trust the client-visible success state.
**How to avoid:** Keep webhook-confirmed payment success as the only authoritative trigger for inventory decrement and paid status.
**Warning signs:** Requirements or plan tasks say “mark order paid on success page load” or “decrement stock after redirect.”

### Pitfall 4: Free-tier drift into accidental paid features
**What goes wrong:** Plans quietly rely on Containers, advanced background primitives, or unnecessary services that push the architecture off the free path.
**Why it happens:** Platform options are added incrementally without rechecking free-tier constraints.
**How to avoid:** Keep the Phase 1 architecture limited to Worker routes, D1, secrets, and later only add other primitives if a concrete blocker exists.
**Warning signs:** Plans introduce a second runtime, container host, or service with no clear v1 necessity.

</common_pitfalls>

<code_examples>
## Code Examples

Verified patterns from official sources:

### Worker deployment shape for Astro
```jsonc
// Source: Astro deploy-to-Cloudflare guide
{
  "main": "dist/_worker.js/index.js",
  "name": "blackbox-records",
  "compatibility_date": "2026-04-19",
  "assets": {
    "binding": "ASSETS",
    "directory": "./dist"
  }
}
```

### D1 access through Worker bindings
```ts
// Source: Cloudflare D1 Worker API docs
export async function loadOrder(env: Env, orderId: string) {
  return env.DB.prepare(
    "SELECT * FROM orders WHERE order_id = ?1"
  ).bind(orderId).first();
}
```

### Stripe embedded Checkout server contract shape
```ts
// Source: Stripe Checkout embedded quickstart + Checkout Sessions API docs
// Server creates a session and returns client_secret to the browser.
// Planning note: confirm the exact API version and enum names before coding.
{
  mode: "payment",
  ui_mode: "embedded",
  return_url: "https://example.com/shop/return?session_id={CHECKOUT_SESSION_ID}"
}
```

</code_examples>

## Validation Architecture

- Use repo smoke commands for every implementation pass: `pnpm test:unit`, `pnpm check`, `pnpm build`.
- Use targeted `rg` checks against ADRs, requirements, and launch docs to verify terminology and trust-boundary decisions were actually written.
- Treat any lingering `Supabase`, `Fourthwall fallback`, or stale Stripe enum wording in active planning docs as a validation failure.

<sota_updates>
## State of the Art (2025-2026)

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| GitHub Pages / Cloudflare Pages as likely Astro static endpoints | Cloudflare Workers is the forward path for Astro full-stack and on-demand Cloudflare deployments | current docs observed on 2026-04-19 | Planning should target Workers, not design around Pages as the permanent commerce host. |
| Project wording around `ui_mode: embedded_page` | Current Stripe API reference uses `ui_mode: embedded`; product docs describe an embedded checkout page/form | current docs observed on 2026-04-19 | Phase 1 must normalize terminology and pin API version explicitly. |
| Generic environment variables for sensitive data | Worker secrets plus declared required secret names in Wrangler | Cloudflare docs updated through 2026-03 | Planning should distinguish plaintext vars from secret bindings and use required-secret validation. |

**New tools/patterns to consider:**
- **Wrangler required-secrets declaration:** Lets deploys fail early when expected runtime secrets are missing.
- **Local D1 with `--local`:** Supports repeatable local workflow without needing a separate hosted dev database.

**Deprecated/outdated:**
- **Assuming GitHub Pages can remain the final commerce runtime:** This is outdated for webhook-authoritative native commerce.
- **Assuming stale Stripe enum names from older project notes are authoritative:** Current official docs should win.
</sota_updates>

<open_questions>
## Open Questions

1. **How aggressively should the Worker runtime be introduced into the current Astro 5 repo?**
   - What we know: Cloudflare deployment is the locked target, and Astro officially supports deploying Astro to Cloudflare Workers.
   - What's unclear: Whether the implementation should stay on Astro 5 with a compatible adapter first or bundle an Astro upgrade into the runtime migration.
   - Recommendation: Keep Phase 1 docs version-agnostic but require implementation planning to verify adapter compatibility against the exact installed Astro major before code changes.

2. **Should Stripe API version be pinned per request or via account/workbench version plus SDK alignment?**
   - What we know: Stripe’s recent docs and changelog show active evolution in Checkout `ui_mode` semantics.
   - What's unclear: The repo does not yet state whether version pinning will happen in SDK config, request headers, or account-level configuration plus webhook endpoint versioning.
   - Recommendation: Make this an explicit ADR outcome in Plan 01-02 before sandbox work.

3. **What is the minimal acceptable rollback model without a Fourthwall fallback?**
   - What we know: The user rejected a Fourthwall fallback, but Phase 1 still needs explicit rollback criteria.
   - What's unclear: Whether rollback means redeploying the last known-good revision, temporarily disabling checkout entry points, or both.
   - Recommendation: Define rollback as deployment-level reversal and shopper-facing kill-switch behavior, not as a parallel commerce platform fallback.

</open_questions>

<sources>
## Sources

### Primary (HIGH confidence)
- [Astro deploy to Cloudflare](https://docs.astro.build/en/guides/deploy/cloudflare/) — checked Worker deployment shape, adapter requirement, Wrangler config, and Node-compat notes
- [Cloudflare Workers pricing](https://developers.cloudflare.com/workers/platform/pricing/) — checked free-tier request and CPU limits
- [Cloudflare Workers secrets](https://developers.cloudflare.com/workers/configuration/secrets/) — checked runtime secret handling, required secrets, and local-dev secret guidance
- [Cloudflare D1 pricing](https://developers.cloudflare.com/d1/platform/pricing/) — checked free-plan behavior and overage behavior
- [Cloudflare D1 Worker API](https://developers.cloudflare.com/d1/worker-api/d1-database/) — checked binding-based access patterns
- [Cloudflare local development](https://developers.cloudflare.com/workers/local-development/) — checked Worker-local development model
- [Cloudflare D1 local development](https://developers.cloudflare.com/d1/build-with-d1/local-development/) — checked local D1 workflow
- [Stripe Checkout Sessions create API](https://docs.stripe.com/api/checkout/sessions/create) — checked current `ui_mode` values and embedded return/success constraints
- [Stripe embedded Checkout quickstart](https://docs.stripe.com/checkout/embedded/quickstart) — checked client-secret-returning server contract and return-page flow
- [Stripe webhooks](https://docs.stripe.com/webhooks) — checked webhook endpoint requirements and signature verification expectations
- [Stripe Checkout fulfillment](https://docs.stripe.com/checkout/fulfillment) — checked webhook-authoritative fulfillment guidance

### Secondary (MEDIUM confidence)
- [Astro Cloudflare integration guide](https://docs.astro.build/en/guides/integrations-guide/cloudflare/) — checked current Cloudflare adapter guidance and Workers-first language
- [Cloudflare Workers limits](https://developers.cloudflare.com/workers/platform/limits/) — checked request reset behavior and subrequest limits

### Tertiary (LOW confidence - needs validation)
- None
</sources>

<metadata>
## Metadata

**Research scope:**
- Core technology: Astro on Cloudflare Workers
- Ecosystem: D1, Wrangler, Stripe Checkout Sessions, Stripe webhooks
- Patterns: secret bindings, server-only payment authority, brownfield runtime migration
- Pitfalls: stale terminology, Pages/runtime mismatch, secret boundary drift

**Confidence breakdown:**
- Standard stack: HIGH - based on official Astro, Cloudflare, and Stripe docs
- Architecture: HIGH - aligned with locked context and official runtime/payment constraints
- Pitfalls: HIGH - directly supported by official docs and current repo state
- Code examples: MEDIUM - examples are simplified planning-oriented adaptations of official guidance
</metadata>

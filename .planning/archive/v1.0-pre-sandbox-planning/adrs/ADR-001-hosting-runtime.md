# ADR-001: Hosting And Runtime Strategy For Native Commerce

**Status:** Proposed  
**Date:** 2026-04-06  
**Decision owner:** Human review required in Phase 1

## Context

The current production site is an Astro 5 storefront deployed as static output on GitHub Pages. That deployment model cannot safely host Stripe Checkout Session creation or Stripe webhook endpoints, which means it cannot be the final production runtime for native commerce.

Astro’s current on-demand rendering guidance allows adding a server adapter and opting specific routes out of prerendering while keeping the rest of the site static. The migration therefore does not require turning the entire site into a fully dynamic app, but it does require a runtime decision before any commerce implementation work starts.

## Decision Drivers

- Lowest recurring cost
- Minimal maintenance
- Maximum portability
- Good fit for Stripe webhooks and server-only secrets
- Low friction for the existing Astro codebase

## Options Considered

### Option A: Astro with a Node-oriented adapter on a managed Node host

**Pros**
- Strong portability
- Straightforward fit for server routes and webhooks
- Keeps Astro as the primary deployment unit

**Cons**
- Introduces baseline hosting cost
- Requires replacing or augmenting the current GitHub Pages deployment

### Option B: Astro with a platform-specific edge/runtime adapter

**Pros**
- Potentially lower idle cost
- Strong managed-platform ergonomics

**Cons**
- Lower portability
- Higher adapter/runtime specificity

### Option C: Keep GitHub Pages for the storefront and split commerce into a separate API service

**Pros**
- Smaller immediate change to the static site deployment
- Lets brochure pages stay on Pages

**Cons**
- Splits the runtime and operational model early
- Adds cross-service complexity and a second deployment surface

## Proposed Decision

Prefer **Option A**: keep the storefront in Astro and target a portable Node-oriented runtime, while preserving prerendered brochure/content routes where possible and opting only commerce routes/endpoints into on-demand execution.

This is the best match for the stated priorities because it minimizes platform lock-in without forcing a split frontend/API architecture. It also aligns cleanly with Stripe’s server-route needs and the existing Astro repo shape.

## Consequences

- `/shop/` cannot remain a pure GitHub Pages redirect route forever if native commerce is adopted
- Deployment tooling, secrets management, and rollback procedure must be redesigned in Phase 1
- The final host vendor still needs human approval based on current minimum monthly cost and operational preference

## Review Gate

Phase 1 is not complete until the team approves:

1. Adapter/runtime family
2. Initial host/vendor shortlist
3. Cutover/rollback shape from the current GitHub Pages + Fourthwall model

## References

- [Astro on-demand rendering](https://docs.astro.build/en/guides/on-demand-rendering/)


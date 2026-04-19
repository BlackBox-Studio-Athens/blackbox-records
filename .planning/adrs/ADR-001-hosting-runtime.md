# ADR-001: Hosting And Runtime Strategy For Native Commerce

**Status:** Accepted  
**Date:** 2026-04-19  
**Decision owner:** Approved during archived milestone v1.0

## Context

The current production site is an Astro 5 storefront deployed as static output on GitHub Pages. That deployment model cannot safely host Checkout Session creation or Stripe webhook endpoints, which means it cannot be the final runtime for native commerce.

The approved implementation target needs to support:
- low recurring cost
- minimal maintenance
- server-only secrets
- a narrow live runtime surface for checkout and webhook routes
- compatibility with the existing Astro storefront and shell

## Decision

Use **Astro on Cloudflare Workers** for the native commerce runtime and **Cloudflare D1** for the minimal SQL state store.

Implementation guidance:
- keep the storefront in Astro
- add the official Cloudflare adapter
- keep brochure/editorial routes prerendered where practical
- opt required commerce pages and endpoints into on-demand execution with `prerender = false`
- keep secrets in Worker bindings / local secret config, not in browser code

## Rationale

- Cloudflare Workers + D1 is the lowest-cost and lowest-ops option that still supports server routes, secrets, and webhooks.
- The Worker model avoids introducing a second API service just to add commerce.
- Astro’s current on-demand rendering model fits the repo’s brownfield shape better than a broader frontend rewrite.
- D1 is sufficient for the approved low-volume order and inventory semantics.

## Consequences

- GitHub Pages remains the live production baseline only until the future go-live milestone; it is not the target runtime for native commerce.
- Commerce handlers must stay thin because Workers Free CPU limits are tight.
- Sandbox deployment and production cutover are separate concerns; production launch remains a future milestone.

## References

- [Astro on-demand rendering](https://docs.astro.build/en/guides/on-demand-rendering/)
- [Cloudflare Workers pricing](https://developers.cloudflare.com/workers/platform/pricing/)
- [Cloudflare Workers limits](https://developers.cloudflare.com/workers/platform/limits/)
- [Cloudflare D1 pricing](https://developers.cloudflare.com/d1/platform/pricing/)

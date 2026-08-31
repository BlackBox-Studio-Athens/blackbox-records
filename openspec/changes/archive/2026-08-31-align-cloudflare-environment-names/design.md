## Context

As of August 31, 2026:

- Local/UAT/PRD names are implemented across the repo.
- renamed UAT and PRD Workers/D1 resources exist.
- UAT webhook/payment verification passed GitHub Actions run 30166382129 on July 25, 2026.
- repository variable PUBLIC_BACKEND_BASE_URL was deleted on August 31, 2026 after current workflows were reconfirmed to use only UAT_PUBLIC_BACKEND_BASE_URL and PRD_PUBLIC_BACKEND_BASE_URL.
- GitHub environment catalog-promotion-production and its unused CLOUDFLARE_ACCOUNT_ID variable were deleted on August 31, 2026 after current workflows were reconfirmed to use catalog-promotion-uat or catalog-promotion-prd.
- PRD live Stripe secrets are absent by design while the PRD-open gate is closed.

## Goals / Non-Goals

**Goals:**

- Keep one closed product-environment type: Local, UAT, PRD.
- Remove the final unused external naming artifacts.
- Preserve deliberate low-cost command compatibility.

**Non-Goals:**

- Deleting old Cloudflare Workers/D1 databases.
- Configuring PRD live secrets or webhook endpoints.
- Adding another environment alias or translation layer.

## Decisions

### Keep product and provider axes separate

Application code and generated contracts use only Local, UAT, and PRD. Wrangler keys and app-owned CLI values use local, uat, and prd. Stripe's provider axis remains test/live only where Stripe livemode is evaluated.

Boundary parsers may accept the already committed sandbox/production command aliases and immediately normalize them to UAT/PRD. Internal types cannot represent those legacy values.

### Retain only existing cheap aliases

Existing package scripts that are likely in operator history may remain as direct aliases. They contain no independent logic and call the canonical command. No new alias is added, and docs show only canonical commands.

### Keep old Cloudflare resources

Old Worker and D1 resources are not active product environments and remain undeleted. Their presence is historical rollback capacity, not naming acceptance.

### Separate completed UAT from future PRD launch

UAT renamed resources, runtime configuration, webhook, and payment configuration are proven. PRD live secrets, endpoint activation, provider mutation, and smoke depend on the PRD-open gate and remain in production-go-live-readiness.

### Close only the two unused GitHub settings

The external non-code cleanup completed on August 31, 2026:

1. deleted repository variable PUBLIC_BACKEND_BASE_URL;
2. deleted GitHub environment catalog-promotion-production.

Before deletion, current workflows were confirmed to have no references. Neither deletion changed deployed traffic or provider state.

## Risks / Trade-offs

- [Legacy setting is still consumed out of band] → Search current workflows and document the deletion timestamp before removal.
- [Old Cloudflare resources look active] → Keep docs explicit that only renamed UAT/PRD resources are product targets.
- [PRD missing secrets is misclassified] → Treat it as expected closed-gate state, not an environment-name defect.

## Migration Plan

Repository and provider cutover are complete. GitHub-setting cleanup completed on August 31, 2026. Rerun scoped searches and strict validation, then archive this change. Do not delete old Cloudflare resources or configure PRD live commerce during closeout.

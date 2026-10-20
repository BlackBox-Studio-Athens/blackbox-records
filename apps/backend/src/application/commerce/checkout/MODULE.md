# checkout-core

## Scope and start

Owns authoritative checkout application orchestration and reconciliation. Start at [index.ts](index.ts), [reconcile-checkout-session.ts](reconcile-checkout-session.ts), the readers and feature-flag entrypoints listed in [project.json](project.json). Its metadata owns the allowed exports, checkout-spi seam, dependencies and test inputs.

## Do not break

The Worker owns commerce authority; D1 owns stock/order state. Preserve explicit trust-boundary validation, idempotency, side-effect ordering and each failure/retry policy. Do not move provider identifiers or commerce controls into editorial content or treat browser totals as authoritative. Keep launch, catalog authorization and code publication separate. Persistence follows the existing repository/Prisma-D1 seam and Wrangler migrations; do not introduce a second database URL or Prisma deployment workflow.

## Contracts and decisions

Read [checkout spec](../../../../../../openspec/specs/commerce-checkout/spec.md), [commerce operations](../../../../../../docs/commerce-operations.md) and [content/data constraints](../../../../../../docs/content-agent-contracts.md). Follow exact public interfaces rather than inferred graph reachability.

## Verification and work split

From repository root use `pnpm test checkout-core` and relevant integration file selectors, then required `pnpm validate`. [Acceptance](../../../../../../docs/agent-acceptance.md) distinguishes normal Local mock checks from separately authorized provider/hosted evidence. Codex implements this non-UI module and its tests by default. Any shopper-facing UI change is a separate Claude slice with an agreed public contract unless the prompt overrides ownership.

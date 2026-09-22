# Design

## Context

See [proposal.md](proposal.md) for the outcome. Read-only investigation on 2026-09-22 found:

- Analekta CD / Agia Monaxia had stock 1 physical / 1 online and an existing ledger movement, but Selling showed no price input.
- Anarchotribal showed the same generic setup/price review error.
- Disintegration had a working EUR 28.00 price editor.

Local commit `53abbbbc81c80f3385693e1c30752928e172dfa4` explains the gap: `ItemPriceEditor` requires a successful strict price read; `readCatalogPriceState` requires completed runtime setup and a valid bound Price; new-item setup deliberately rejects an existing identity or stock. Publication shares the strict price helper, so weakening it is not the fix. The exact affected PRD bindings and deployed revision still need checking; the observations do not prove Stripe objects are absent.

## Goals / Non-Goals

Support occasional, deliberate price setup by a small number of label members. Use ordinary request/response commands, the existing journal and manual recovery for exceptional legacy data.

Keep this to the retained-item price gap and same-item Stock handoff. No new dependency, CMS plugin, queue, polling, collaboration system, repair console or general navigation work. Existing money, identity, stock, auth and launch controls remain necessary even at low traffic.

## Decisions

### 1. Reuse EmDash and the existing commerce seams

Use installed EmDash 0.38.0 through the current source adapters. Reuse the publication adapter's native `_rev` contract, existing Details/media controls and `prepareCmsSetupPresentation`; do not add hooks or duplicate editorial forms. Resolve `cmsSourceId` or an exact unique source-kind/source-ID match.

Derive Distro/Merch type from its native group. For an unset Release type, offer Item Setup's supported physical choices. Preserve an established type and price-kind policy. Initial Product presentation uses the reviewed saved title/summary with no images, as existing setup does; artwork approval stays with publication.

Reuse the EUR schema, `euroMinor`, Stripe gateway, identity helpers, operation journal and staff query helpers. Extend these in place; do not turn the command into a reusable workflow framework.

### 2. Add only the missing read and command

Add `GET /api/internal/variants/{variantId}/selling` and `POST /api/internal/variants/{variantId}/price/initialize` within the protected catalog routes. Keep old price/setup/publication contracts intact. A separate readiness read avoids changing the strict price response used by existing clients and publication.

Keep the linked-item response small:

- `ready`: existing `CatalogPriceDetail`; an unrelated incomplete private draft does not block Change price.
- `setup_required`: verified source/revision and any missing format choice; the initial amount is blank.
- `blocked`: a safe reason and existing action, with the retained operation when relevant. Missing details, unfinished work and unsafe bindings do not need separate frontend workflows.

Check unresolved operations before classifying a fresh setup. For pending initialization, expose the retained review input only to its initiating authorized actor and offer an explicit Resume action. Other operation kinds retain their current recovery behavior. Do not add automatic retries or a general operation-recovery API.

Unknown variants use 404; authorization, configuration and provider failures retain existing safe error responses. A failed read is never evidence that creating a price is safe. GET must not write catalog/provider state. If using reconciliation for diagnosis, use `apply: false`.

Before showing new-item setup for a null list projection, refresh the selected record through the existing workspace read to verify it is truly unlinked. Retain the server's duplicate-setup guard.

### 3. Run one initial-price command through the existing journal

The request contains `operationId`, nonnegative `expectedRevision`, native `cmsRevision`, supported `itemType`, the existing EUR `price` shape and `confirmLiveSetup`. Reuse the protected route middleware and strict validation. Actor identity comes from middleware; stock quantities, provider IDs and replacement identities are not accepted.

1. **Resolve replay first.** Match an existing operation's actor, environment, variant and input fingerprint. Return a completed receipt even after later revisions/publication; resume pending work using its accepted input. Do not apply fresh-item eligibility to its own earlier writes.
2. **Preflight new work.** Require a withheld variant, current reviewed catalog/source revisions, valid details/type/price and the existing live confirmation. Reject correctable errors before creating an unresolved row.
3. **Check only the selected provider identity.** Read its binding or deterministic Product ID and reuse existing ownership/default-Price checks. Expose the few additional fields needed through the existing gateway; no diagnostic subsystem is needed. The nullable `retrieveDefaultPrice` result alone is insufficient: it also covers missing/deleted Products and invalid defaults. Preserve valid authority. A broken binding, foreign/invalid Product or independently created Product needs manual review, not automatic adoption. An unbound managed variant can create its deterministic Product; a replay can reuse the Product belonging to that same operation.
4. **Record intent before external writes.** Add `price_initialize` to `CatalogOperation` through the existing forward-migration pattern. Atomically insert its validated input and reviewed projection using the existing revision and unresolved-variant guards. Reuse the journal's native revision, fingerprint and projection fields; only the new kind needs server-restored input. Later private drafts do not replace an accepted snapshot.
5. **Execute and finish.** Reuse `ensureSetupProduct`, `createReplacementPrice` and `selectReplacementPrice`, including their bounded provider recovery and expected-default checks. Use `started → product_bound → price_bound → default_selected → completed`; a separate validated phase is redundant because the initial row already contains validated intent. Only the dedicated completion method can finish the new kind.

Completion uses one D1 transaction for runtime setup fields, mapping, normalized verified snapshot and receipt, with the existing revision/mapping/lease checks. Do not use the reconciler's separate apply writes. Preserve identities, stock/ledger, pauses, reservations, orders and publication state; availability stays withheld. No inventory write is needed, so intervening stock movements remain untouched.

Keep unknown provider outcomes under the same operation identity. Recovery is member-triggered; legacy ambiguity shows a reason and operation reference for an administrator. Low traffic makes manual handling reasonable, but does not justify duplicate Prices or clearing the journal.

### 4. Keep the UI refresh model simple

`CatalogSelling` owns the readiness read and passes its result to `ItemPriceEditor`; the child does not issue a duplicate price GET. Read on entry, explicit Refresh and confirmed command completion. No background polling, focus-refresh requirement or cross-tab synchronization is added.

Configured items retain Change price. Eligible items get No price set, a blank amount and Set price, plus only a missing supported format choice. Blocked states reuse Details, Resume or administrator guidance.

Keep the form's reviewed revision fixed while editing. A rare concurrent change uses the existing 409 conflict: retain the entered value and offer explicit Refresh/review. Refresh may discard unsaved values only after confirmation. Do not build draft merging or persistence across navigation/reloads; submitted commands remain recoverable through the journal. Preserve existing editorial unsaved-change behavior.

After confirmed completion, refresh the selected summary and publication prerequisites. A failed follow-up read shows Price saved with Refresh, rather than asking for another save. Ignore results from a previously selected item through the existing request lifecycle.

Read/mount item-publication preflight only after runtime setup is complete; otherwise show its prerequisite. Initial pricing does not activate the item. Ordinary editorial Review changes remains independent.

Add Stock → Selling through the existing `/items/?variantId=…` resolver, preserving `tab=selling` to the canonical content URL. The parallel navigation change owns general Back/history behavior.

## Validation Strategy

Use existing suites and add tests for the new branches, not a Cartesian matrix of items, browsers, failures and environments:

- One retained-item regression with null setup fields/revision zero, stock 1/1 and a ledger row, plus a configured-price control. Keep the fixture isolated from normal `price_mock_*` seeding. Small parameterized cases cover source-type derivation and zero/missing stock.
- Focused command/repository tests for invalid input or unsafe provider state, the new migration, replay after provider work, atomic completion and a competing request. Reuse existing auth, money, gateway recovery and checkout tests; extend them only where this new route/kind adds an uncovered branch. No fault injection after every await or hosted concurrency rehearsal.
- One browser journey in the primary Chromium workflow at desktop and 320 CSS pixels, covering keyboard access, comma/point amounts, Set price, refresh/conflict feedback and the Stock handoff. Additional browsers need a concrete browser-specific concern.

Run the repository-required full/editor gates and relevant Local CMS checks. Existing publication and checkout suites verify their boundaries; do not rebuild those suites around this fix. Initial pricing preserves withheld/paused state, while later explicit publication keeps its existing activation effects.

## Risks / Trade-offs

- **Legacy bindings may need manual repair** → Inspect the affected item and use the existing administrator path. Build broader repair tooling only if recurring cases justify it.
- **Provider and D1 writes are not one transaction** → Reuse journal claims, fingerprints and deterministic recovery; freeze the reviewed projection before writing.
- **Older code may reject the new journal kind** → Preserve historical rows/indexes and use a compatible reviewed rollback candidate or forward fix.

## Migration Plan

1. **Local and UAT:** Complete Local checks, then perform one ordinary UAT stock-first smoke with a configured-item control through the existing release workflow. Keep failure/retry simulation local; record the candidate SHA/run ID and result.
2. **PRD code:** Review the compatible migration with the candidate. The existing `deploy-prd` job applies it before the combined Worker deployment. Use the reviewed artifact SHA, successful candidate run and `confirm_code_promotion=true`; keep `confirm_live_catalog_changes=false`. No separate catalog-seeding dispatch is needed.
3. **PRD item:** With the existing per-item live authorization, verify the affected item's reviewed amount on its retained variant, unchanged inventory/history and unchanged launch controls. Ambiguous legacy bindings require a separate scoped repair; this plan does not authorize it.
4. **Rollback:** Preserve provider objects and journal history. Use a compatible reviewed candidate or forward fix, never inventory reseeding or restoration of an old provider amount.

Follow `docs/cloudflare-free-tier.md`. This change adds no bindings/jobs; a single ordinary smoke does not require a new capacity study or budget-approval gate. Its usage preflight still applies if work expands into repeated probes, hosted recovery rehearsals or bulk changes. Planning grants no deployment or live mutation approval.

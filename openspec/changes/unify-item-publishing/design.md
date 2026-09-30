# Design

## Context

See proposal.md. The item editor shows Details & photos and Price & stock tabs. Editorial text autosaves as EmDash drafts. Prices change through `changeCatalogPrice` / `initializeCatalogPrice`, stock through audited stock commands, and `publishCatalogItem` projects checkout presentation to Stripe before publishing the CMS revision. The `unify-staff-catalog-editing` decision that "commerce commands keep their separate explicit controls" produced the missed-button failure; this change supersedes it for price and shop publication.

## Goals / Non-Goals

Goals: one visible publish action per item, no silent loss of a typed price, checkout presentation that follows website publication for items on sale, and unchanged commerce authority.

Non-goals: staging stock, applying prices from the batch Review changes page, new backend commands or database tables.

## Decisions

- **Price drafts live in EmDash.** The existing `blackbox-editorial` standard plugin gains a private `price-drafts` route (GET, PUT, DELETE) over its plugin KV, keyed `price-draft:<collection>:<recordId>`. Writes use `compareAndSet` with the previous revision, so concurrent members get a conflict instead of a silent overwrite. The route requires `content:edit_own`, EmDash's CSRF header and the CMS guard's same-origin check. The draft stores the price (EUR minor units, fixed or pay what you want), the optional format for a first price, the live amount the member saw while typing, and `attempt`: null until publication starts, then exactly one `change` or `initialize` command (operation id and revisions) that every retry resends. Stored drafts always carry their compare-and-set revision; list reads include it. It stores no provider identifier and never enters the publication snapshot. `content:afterDelete` removes a deleted record's draft.
- **Discovery uses EmDash.** `readStaffWorkspace` reads drafts through `runtime.handlePluginApiRoute`, attaches `priceDraft` to catalog records, and keeps unchanged-content records in `view=changes` when they have a draft, inside the existing bounded cursor scan. No private table reads.
- **One reviewed sequence.** `planItemPublication` orders steps: price, then item publication when the item is on sale or the member ticks the first-sale box, otherwise content publication; content then item when required drafts force a batch. Price-only publishing skips website publication because the runtime offer updates directly. Each step keeps a retained identity (the draft's `attempt`, pending content publication, retained item command), so Retry resumes the failed step only.
- **Confirmation.** The review lists the item, old and new price, and every step. One PRD confirmation authorizes exactly those bounded operations, satisfying the existing live price and publication confirmations.
- **Leaving is safe.** A saved draft never blocks navigation; only an in-flight command, unsaved typing or an upload does.
- **Illegal states are unrepresentable.** Selling state is one `loading | unavailable | ready` value; shop standing is one `on_sale | ready_to_sell | not_ready` value and a run's shop effect one `none | sync | activate` value; a settled publish step always carries its message; a workspace read either knows an item's draft (possibly none) or reports drafts as unknown.
- **Degraded reads.** If drafts cannot be read, workspace reads still succeed with `priceDraftsUnavailable`, and the editor reads its own draft. If selling details cannot be read, publishing falls back to website-only publication, which states that price and stock stay unchanged.
- **Ordering and recovery.** When required drafts force a content batch, the item step starts only after that publication is live. Draft saves run one at a time. A retained price attempt locks the price field and Undo until publishing finishes it. A pending, failed or review-required shop update shows its status and retry on the Price & stock tab.
- **UI.** Reuse the staff surface tokens and shadcn primitives. Add the official shadcn `item` and `empty` components. Design Library references: ReUI `c-item-5`, `c-item-2`, `c-stepper-3`, `c-stepper-8`, `c-empty-1`, `c-button-group-53` and shadcn-studio `button-19`, as patterns only. Mockups: private Design canvas "Staff Publish Redesign".

## Risks / Trade-offs

- A dependency batch before the item step causes a second website update for that item (`ponytail:` note in `planItemPublication`).
- A price completed on the server whose draft could not be cleared is discarded on the next read when the live price matches it.
- Batch publishing from Review changes still publishes content only; draft prices are shown there with a link to the item.
- Draft saves are debounced D1 writes through EmDash KV; negligible against the Free-tier write budget.

## Migration Plan

No data migration. Plugin KV rows are created on first use. Rollback removes the route and UI; any stored drafts remain inert.

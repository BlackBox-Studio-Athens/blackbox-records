# Proposal

## Why

The Releases page currently gives its largest position to the newest editorial release date, which can elevate a digital release over an active vinyl preorder. BlackBox wants to sell records and deliberately lead with Sidus, with Afterwise in the same campaign tier, while keeping older stocked records easy to buy.

## What Changes

- Keep the existing asymmetric Releases composition and replace its date-selected `Latest out now` and `Upcoming` roles with physical buying states. Proposed initial order: Sidus / LOTUS, then Afterwise / Disintegration. Use the existing `Releases` and `Our releases` identity without a `Featured records` heading or extra storefront sections for four records.
- Give every buyable physical record a clear route to its edition, with `Pre-order vinyl` or `Buy vinyl` determined by the existing public commerce presentation and authoritative offer, never the editorial release date.
- Recompute actions and eligible placement automatically from existing accepted digital timing and authoritative physical offer/preorder/stock data. Reuse the current exact-date expiry and Staff `Copies arrived` behavior; a passed month estimate does not prove arrival. Do not add a state-machine framework, scheduler or duplicated stored commerce state.
- Keep older stocked vinyl visible in the existing lower catalog. Show Ouranopithecus as `Digital out now` and `Vinyl coming later` until its physical offer actually opens, then update its buying action and placement automatically.
- Retain release information, credits, artist links and the persistent player. Digital release chronology becomes supporting context.
- Maintain the editable review Page and revise its wireframe around the current page before runtime implementation. Record research, acceptance and user decisions in this change. The Page is a review surface, not a separate task system.
- Refine the approved implementation with explicit artwork/title, artist, purchase and listening targets; selectable inert copy and metadata; compact status labels using the older uppercase editorial language; and a shared subtle hover treatment for ordinary Releases and Store buying actions. Keep a requested October 2026 preorder example in Local using the existing Staff control.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `release-catalog-presentation`: Use deliberate physical campaign priority, truthful edition states and a clear purchase path instead of date-selected lead and upcoming roles.
- `module-boundaries`: Declare the Releases presentation entrypoint within existing editorial, store, platform and UI ownership, without new commerce authority.

## Impact

Likely implementation owners are `web-editorial`, `web-store`, `content-model` and the existing EmDash editorial schema/Staff editing surface. Investigated entry points are `apps/web/src/pages/releases/index.astro`, `apps/web/src/lib/release-feature.ts`, `apps/web/src/components/editorial/ReleaseStoreLink.tsx`, and the existing catalog and public listing-price/offer contracts. Any new editorial ranking field must cross the normal draft and Content Publication path; it must not hold stock, price, provider IDs or shipping authority.

Runtime implementation was approved and completed in the authorized worktree. The user's October 5 refinement retains its algorithm and composition while improving interaction boundaries, statuses and purchase feedback. Initial live priorities, factual hosted catalog corrections, Content Publication and Software Release retain their separate gates. The requested Local example changes only an existing edition's preorder estimate, preserving stock and prices. No dependency, ranking service, analytics score or new commerce authority is proposed.

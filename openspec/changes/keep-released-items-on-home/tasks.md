## 1. Projection contract (non-UI, Codex)

- [x] 1.1 Extend the open pre-order projection type, derivation and identity with `homeOffers` (slug, availability `stocked | sold_out`, price text or null) for ready release-sourced items that are not on an open pre-order; omit Coming Soon, Repressing, paused, unavailable and not-ready items. Verify with unit tests in the backend checkout readers: stocked, sold out, closed pre-order moves lists, excluded states, slug order, and an unchanged identity when only the stock count changes.
- [x] 1.2 Make the renderer's projection validation and storage accept the optional list, treat a missing list as empty, and keep the unchanged-identity rule. Verify with the existing projection push and renderer tests plus cases for a legacy projection and an invalid `homeOffers` entry (rejected without changing storage).
- [x] 1.3 Confirm the existing push triggers cover Home offer changes (staff pre-order or stock change, paid finalization, scheduled run). Verify with `preorder-projection-push.worker.test.ts` extended for a pre-order closing and the last copy selling.
- [x] 1.4 Update `docs/local-runtime.md` and `docs/catalog-promotion.md` where they describe the projection file and its fields. Verify by reading both against the new shape.

## 2. Content flag and staff switch

- [x] 2.1 Add optional `show_on_home` to the release content schema (non-UI, Codex), carry it through the accepted snapshot and Content Publication, and keep drafts private. Verify with content-model schema tests and a publication test showing the flag is absent from the public snapshot until published.
- [x] 2.2 Add the Show on Home switch to the staff release editor beside Pre-order (UI, Claude): off by default, locked on while the item has an open pre-order, 44px target, name and description, keyboard and mobile use, and the Home line stating a chapter shows only while the item is in stock or sold out. Verify with component tests for default, on, locked and disabled states, and a content-workspace browser check that mirrors the existing Pre-order switch check.
- [x] 2.3 Confirm draft, review and discard flows treat the setting as an ordinary release field. Verify with the existing `ContentFields` and publication review tests extended for the new field.

## 3. Home chapters

- [x] 3.1 Join featured releases with Home offers in `preorderShowcaseItems` (UI, Claude): include open pre-orders first, then switched-on releases with a Home offer, newest release date first, slug tie-break; keep prepared-clip logic unchanged. Verify with `preorder-showcase.test.ts` cases for each ordering, a switched-on item without an offer, and an off item without a pre-order.
- [x] 3.2 Give `StorePreorderShowcase` an offer state and derive the action, badge row, shipping line, terms link text and closing link from it, matching the approved canvas (UI, Claude). Reuse `buttonVariants` Buy styling and the vinyl disc icon; Buy CD, Buy cassette and Buy follow the format. Verify with `StorePreorderShowcase.test.tsx` for the three states, the format labels, and that the Sea Pre-order colour and wording never appear in the stocked and sold-out states.
- [ ] 3.3 Name the hidden section heading for what it holds (Pre-orders when all chapters are pre-orders, otherwise Featured releases), keep the `preorders` anchor, and add the Home CSS for the stocked and sold-out purchase blocks at 390px and 1440px without overflow. Verify with the Home CSS and accent-role tests and a measured layout check at both widths.
- [ ] 3.4 Extend `e2e/home-preorders.spec.ts` for the keep-on-Home flow: a closed, stocked, switched-on release shows a Buy vinyl chapter with its video and Listen; sold out shows the static status; a pre-order shows the existing block; and no pre-order or featured item hides the section. Verify by running the spec in Chromium, Firefox and WebKit, including shell navigation continuity of the persistent player.

## 4. Design guidance and acceptance

- [x] 4.1 Update `DESIGN.md` (and `docs/backoffice-design.md` for the staff switch) where they describe Home chapters as pre-order only. Verify with `pnpm agent:check`.
- [ ] 4.2 Measure the projection payload and the Home render on the current catalog against `docs/cloudflare-free-tier.md`. Verify by recording the payload size and the unchanged push, purge and storage-write counts for a stock-count-only change in `validation.md`.
- [ ] 4.3 Run `pnpm validate` on the final tree and verify on UAT with Afterwise switched on and then off, recording the exact candidate and results in `validation.md`. Do not claim production or hosted acceptance from local validation alone.

## Workflow follow-up

- Production promotion and archive follow the existing release workflow after UAT acceptance; they are not tracked tasks here.

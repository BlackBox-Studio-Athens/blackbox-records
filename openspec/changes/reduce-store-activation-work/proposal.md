# Proposal

## Why

Profiling the October 2026 dependency upgrade found that each Store activation spent 95–250 ms of main-thread time at 4× CPU rewriting listing state that a fresh page already held. A further 25–41 ms went to sorting artist choices with `localeCompare`. Both costs fall inside the long task after load, on every Store and Distro visit.

## What Changes

- `sanitizeStoreListingPricePlaceholders` writes a text, attribute, flag, class or dataset value only when it differs. Snapshot sanitation reaches the same end state.
- Store card Buy buttons render `disabled` as well as `hidden`, matching the sanitized state, so activation no longer toggles 100+ form controls.
- `getStoreArtistChoices` sorts with one shared `Intl.Collator`. The order is identical to argument-less `localeCompare`.
- Regression tests: sanitation of an untouched server presentation performs no writes, and the server Buy markup stays disabled.

No visible change. Prices, availability, Buy and the Artists list keep their current behaviour.

## Not changed (measured, decision retained)

The baseline font rule stays: only Latin Inter and Veneer preload in the shell. Preloading Latin Bebas Neue removes Home's late font swap (Bebas finishes at about 0.6 s instead of 3.3 s) but delays FCP by about 70 ms and Veneer by about 73 ms under mobile stress. See `tasks.md`.

## Capabilities

None changed; `skip_specs: true`.

## Impact

`apps/web/src/components/store/StoreListingPricePresentation.ts`, `StoreItemCard.astro`, `StoreDistroSearch.tsx` and their tests, plus the test fakes in `shell-page-snapshot.test.ts`. Local only; no commit, push or release.

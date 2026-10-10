# Proposal

## Why

Distro currently separates formats and uses editorial order values, making a band's records harder to browse together. BlackBox Store items also need to remain discoverable here, with recent label releases receiving priority.

## What Changes

- Include canonical BlackBox Store items in Distro without changing their source or commerce identity.
- Present one mixed-format Grid: released BlackBox titles from the last six calendar months first, newest first, followed by all remaining items in band A–Z order.
- Keep format, artist and text filters, accurate counts, legacy format fragments, optional unfiltered Coverflow and complete no-JavaScript access.
- Deliver independently of Claude's later pre-order flow. Pre-order detection, labels and promotion are outside this change.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `store-catalog-categories`: BlackBox releases also belong to Distro, with one canonical appearance per collection.
- `distro-format-discovery`: Mixed-format band ordering and a six-calendar-month BlackBox promotion window.
- `distro-format-jump-navigation`: Format links filter individual cards and retain their existing fragment identities.
- `distro-coverflow-catalog-disclosure`: One explicit-choice Coverflow for the complete unfiltered Distro collection.
- `distro-search`: Combined filters preserve the mixed catalog's canonical order and force Grid.

## Impact

Frontend collection projection, Distro markup and local filtering, plus existing collection/filter/template/browser checks. No new dependency, CMS field, commerce API, stock rule, publication or deployment. Preserve the completed `refine-store-browsing-and-item-information` and `add-store-wide-search` behavior while reconciling their overlapping deltas at eventual spec sync.

## Why

Release dates now affect public release ordering and catalog trust, but current content mixes actual release dates, platform upload dates, placeholders, and unknowns. We need a frugal local tool that researches dates with provenance before any editor or promotion flow treats them as authoritative.

## What Changes

- Add a standalone local `release-date-research` CLI that reads current release and distro content, queries cached public metadata sources, and reports candidate dates with confidence and source evidence.
- Distinguish Actual Release Date from Platform Upload Date, preorder date, repress date, reissue date, announcement date, and store availability date.
- Support dry-run reports first, with an explicit apply mode only for high-confidence dates or reviewed overrides.
- Split the existing local tool package into clear modules instead of adding more behavior to one artwork-fetcher surface: artwork fetching, mockup rendering, distro sync, release-date research, and shared core helpers.
- Reuse existing `tools/artwork-fetcher` internals where practical: cached HTTP, conservative source scoring, per-host delays, TSV/JSON evidence, and no browser automation or auth bypasses.
- Add tests and fixture-backed checks so date classification regressions are caught without hitting the network.

## Capabilities

### New Capabilities

- `release-date-research`: Defines the local tool, date-source precedence, confidence model, output evidence, and safe apply behavior for researching release dates.

### Modified Capabilities

- `tooling-validation`: Adds standalone command and module-boundary expectations for the local artwork/distro tool package.
- `project-language`: Adds canonical terms for Actual Release Date, Platform Upload Date, Release Date Evidence, and Release Date Confidence.

## Impact

- New standalone local CLI under `tools/`, initially inside the existing `tools/artwork-fetcher` package for frugality, with separated modules and console entrypoints.
- Reads `apps/web/src/content/releases/*.md`, `apps/web/src/content/distro/*.json`, and `scripts/data/distro-inventory-source.json`.
- May update content `release_date` fields only in explicit apply mode after confidence gates pass.
- Adds tests/fixtures for source parsing, date classification, confidence scoring, and apply safety.
- No Stripe, D1, Worker, checkout, stock, order, or provider mutation behavior changes.

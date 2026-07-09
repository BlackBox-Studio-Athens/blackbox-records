## 1. Current-State Audit

- [x] 1.1 Capture current release/distro date coverage with a repeatable script or command and save summary evidence under `.codex-artifacts/release-date-research/`.
- [x] 1.2 List existing content dates that disagree with Distro Inventory Source dates and classify whether the source row or content row should be treated as the working target.
- [x] 1.3 Identify known fixture cases for tests: `Disintegration`, `Anarchotribal`, `Caregivers`, `Russian Circles - Live at Dunk! Fest 2016`, `Pelican - Live at Dunk!Fest 2016`, and at least one missing-date obscure distro item.

## 2. Local Tool Module Split

- [x] 2.1 Map current `tools/artwork-fetcher` console scripts, imports, and shared helpers before moving code.
- [x] 2.2 Extract or organize shared core helpers for HTTP/cache, text normalization, evidence/reporting, and reusable source adapters without changing existing command behavior.
- [x] 2.3 Keep existing standalone commands working: `artwork-fetcher`, `vinyl-mockup`, `cd-front-mockup`, `cassette-front-mockup`, and `distro-sync`.
- [x] 2.4 Split `distro-sync` internals so manifest sync/orchestration, release-date metadata research, and content writing are separate callable units.
- [x] 2.5 Separate command modules so artwork fetching, mockup rendering, distro sync, and release-date research do not import each other's runners.
- [x] 2.6 Add smoke tests or unit coverage for the split boundaries where cheap, especially that mockup modules do not depend on date research and date research does not depend on mockups.

## 3. Release Date Tool Skeleton

- [x] 3.1 Add a standalone `release-date-research` console script in the local tools package, reusing shared core helpers rather than another command's runner.
- [x] 3.2 Implement catalog input readers for `releases/*.md`, `distro/*.json`, and `scripts/data/distro-inventory-source.json`.
- [x] 3.3 Implement normalized item identity matching that reuses or mirrors existing distro alias rules without creating a new source-of-truth model.
- [x] 3.4 Add command flags for dry-run default, output directory, optional source limits, optional verified overrides file, and guarded `--apply`.
- [x] 3.5 Ensure the command can run directly without first running artwork fetch, mockup generation, or distro sync.

## 4. Evidence Model and Source Adapters

- [x] 4.1 Implement candidate date records with date, precision, basis, source tier, source name, source URL, matched metadata, confidence, and notes.
- [x] 4.2 Add source parsing for official Bandcamp/artist/label pages using cached HTTP and existing parser helpers where possible.
- [x] 4.3 Add MusicBrainz candidate extraction for release-group and release dates with matched artist/title/format evidence.
- [x] 4.4 Add optional Discogs candidate extraction when `DISCOGS_TOKEN` is present, keeping no-token runs valid.
- [x] 4.5 Treat DSP/auto-generated platform evidence as low-authority Platform Upload Date evidence unless corroborated by higher-tier release evidence.

## 5. Scoring, Reports, and Apply Safety

- [x] 5.1 Implement conservative candidate ranking: official exact release evidence first, corroborated catalog database evidence next, weak/upload/partial/conflicting evidence as manual review.
- [x] 5.2 Write dry-run artifacts: `summary.json`, `candidates.tsv`, `missing.tsv`, `conflicts.tsv`, and proposed updates.
- [x] 5.3 Add verified override support with chosen date, basis, source URL, reviewer note, and matched item identity.
- [x] 5.4 Implement `--apply` so it updates only day-precision high-confidence non-conflicting dates or verified overrides.
- [x] 5.5 Ensure apply evidence records file path, old value, new value, basis, confidence, source URL, and override authority when used.

## 6. Tests and Documentation

- [x] 6.1 Add offline fixtures for Bandcamp, MusicBrainz, Discogs, retailer, and DSP-like payloads.
- [x] 6.2 Test classification of Actual Release Date, Platform Upload Date, format release date, weak evidence, and source conflicts.
- [x] 6.3 Test dry-run report generation without content writes.
- [x] 6.4 Test apply mode updates only safe fixture rows and leaves weak/conflicting rows unchanged.
- [x] 6.5 Update `tools/artwork-fetcher/README.md` with the module split, setup, dry-run, report, override, and apply examples.

## 7. Validation

- [x] 7.1 Run `python -m unittest discover tests` in `tools/artwork-fetcher`.
- [x] 7.2 Smoke the standalone local commands cheaply enough to confirm entrypoints still resolve.
- [x] 7.3 Run `pnpm test:unit`.
- [x] 7.4 Run `pnpm check`.
- [x] 7.5 Run `pnpm build`.
- [x] 7.6 Run Release Date Research in dry-run mode against the current catalog and attach summary counts to implementation notes.

## Implementation Notes

- 2026-07-06: `python -m artwork_fetcher.release_date_research --project-root . --source-limit 0 --out-dir .codex-artifacts/release-date-research/current-state` wrote ignored evidence with `82` items, `59` dated items, `23` missing-date items, `40` conflict rows, `0` proposed updates, and `0` source lookups.

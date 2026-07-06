## Context

`release_date` already drives public release ordering and optional distro metadata, but repo data is incomplete and inconsistent:

- Releases are `3/3` dated, but sampled `Anarchotribal` and `Disintegration` look like placeholders compared with public evidence.
- Distro content is `56/79` dated, while the Distro Inventory Source still carries many `null` dates and several dates only in site JSON.
- Existing `tools/artwork-fetcher` already provides useful local patterns: Python CLI, cached HTTP, conservative source scoring, MusicBrainz/Bandcamp/Discogs helpers, fixture-friendly tests, and dry-run-first behavior.
- That package also already mixes concerns: artwork fetching, mockup creation, distro sync, and partial metadata research live behind one historical package name.

The new tool should improve date trust without creating another provider authority, CMS field, or speculative service.

## Goals / Non-Goals

**Goals:**

- Research Actual Release Dates for current `releases` and `distro` content with source evidence.
- Identify missing, suspicious, conflicting, and low-confidence dates.
- Prefer official artist/label/release sources over platform upload dates.
- Preserve date precision and avoid inventing day-level dates from month/year-only evidence.
- Produce a reviewable report before changing files.
- Apply only exact-day, high-confidence, non-conflicting dates unless a human-provided verified override authorizes the date.
- Expose Release Date Research as a standalone command, not as a mode hidden inside artwork fetch or distro sync.
- Untangle the local tool package enough that artwork fetching, mockup rendering, distro sync, and release-date research can be reasoned about separately.
- Reuse existing local tool code and dependencies where this keeps the diff smaller.

**Non-Goals:**

- Do not make Stripe, D1, checkout, or Store Offer state depend on release-date research.
- Do not add a new CMS date field.
- Do not promise fully automatic perfect dates for every obscure release.
- Do not use browser automation, search-engine scraping, authentication bypasses, or LLM judgment as source authority.
- Do not overwrite source files from weak DSP/upload-only evidence.
- Do not rename the Python package or split it into multiple installable packages in the first slice unless implementation proves that cheaper than an internal module split.

## Decisions

### Keep one package for now, split modules and entrypoints

Keep `tools/artwork-fetcher` as the installable package for the first implementation slice, but stop treating the historical artwork-fetcher surface as the place where every command lives. Add `release-date-research` as its own console script and organize command code behind small modules.

Rationale: the package already contains HTTP caching, MusicBrainz, Bandcamp, Discogs, text normalization, image helpers, and tests. A second package would mostly duplicate setup and dependencies. Internal boundaries address the real problem first.

Alternative considered: create `tools/release-date-research` or rename the package to `catalog-tools` now. Rejected for the first slice because it adds packaging churn before the behavior exists. Revisit after the split if the historical name still causes confusion.

### Target module boundaries

The implementation should shape the package around separate command areas:

- shared core: HTTP/cache, text normalization, evidence/report helpers, and reusable source adapters
- artwork: release artwork search/fetch behavior only
- mockups: vinyl/CD/cassette rendering only
- distro sync: manifest-to-content sync, mockup file selection, and content write orchestration only
- release dates: catalog input, source candidate extraction, scoring, reports, and guarded apply

Existing console scripts remain thin entrypoints:

- `artwork-fetcher`
- `vinyl-mockup`
- `cd-front-mockup`
- `cassette-front-mockup`
- `distro-sync`
- `release-date-research`

Boundary rules:

- Release Date Research must run directly without first running artwork fetch, mockup creation, or distro sync.
- Existing release-date metadata helpers embedded in distro sync should move behind the release-date module or a shared source-adapter module before being reused.
- Release Date Research must not import mockup rendering modules.
- Mockup rendering must not import release-date research modules.
- CLI entrypoints should call domain modules, not each other.
- Shared source adapters belong in core only when at least two command areas use them.

Rationale: this keeps the work frugal while preventing another mixed runner. It also gives a clean later path to rename or physically split the package if the local tool family keeps growing.

Alternative considered: leave the current package shape and add a new `--dates` flag to an existing command. Rejected because it would deepen the mixing the tool is meant to fix.

### Model date evidence explicitly

The tool will classify every candidate with:

- `date`
- `precision`: `day`, `month`, or `year`
- `basis`: `original_release`, `format_release`, `reissue`, `preorder`, `announcement`, `platform_upload`, `store_availability`, or `unknown`
- `sourceTier`: `official`, `catalog_database`, `retailer`, `dsp`, or `manual`
- `sourceName`
- `sourceUrl`
- matched artist/title/format
- confidence and notes

Rationale: “released on Bandcamp” and “uploaded to YouTube Music” can both expose dates, but they do not mean the same thing. Keeping basis visible prevents false certainty.

Alternative considered: store only one date and source URL. Rejected because it hides conflicts such as Russian Circles digital release vs vinyl release.

### Source precedence stays conservative

Default confidence policy:

1. Official artist/label/release pages with explicit release wording can produce high confidence.
2. MusicBrainz and Discogs can support or raise confidence when artist/title/format match.
3. Retailer pages can support `format_release` or repress/reissue dates, but do not override official original-release evidence alone.
4. DSP/auto-generated platform pages are evidence only and cannot auto-apply alone.
5. Search snippets and social posts are review evidence unless the source is an official account and the matched text names the release and date clearly.

Rationale: the tool should solve the “random platform upload” problem, not automate it into content.

Alternative considered: earliest date wins. Rejected because earliest dates can be teaser singles, preorders, announcements, or unrelated release groups.

### Date target is catalog-item aware

For `releases/*.md`, the preferred date is the official release date for the BlackBox release/work. For `distro/*.json`, the preferred date is the stocked catalog item’s release date:

- Use format/edition date when evidence clearly identifies the stocked format.
- Use original musical-release date when no format-specific date exists.
- Mark manual review when original and format dates conflict and neither is clearly the desired date.

Rationale: a vinyl distro item may legitimately differ from a digital Bandcamp release date.

Alternative considered: one global “album date” rule. Rejected because current catalog includes format-specific vinyl, CD, cassette, reissue, live, and distro items.

### Dry-run and review are the default

The first implementation will write reports under `.codex-artifacts/release-date-research/<timestamp>/`:

- `summary.json`
- `candidates.tsv`
- `missing.tsv`
- `conflicts.tsv`
- optional `proposed-content-updates.patch`

`--apply` is allowed only when every changed row is `day` precision and either high-confidence non-conflicting or backed by a verified override.

Rationale: data quality work needs evidence. Reviewable patches are cheaper than debugging wrong dates after publication.

Alternative considered: update JSON/Markdown immediately. Rejected as too risky for dates that affect ordering/latest behavior.

### Verified overrides are plain JSON

Manual corrections live in a small JSON file, likely `scripts/data/release-date-overrides.json`, with artist/title/sourceId, chosen date, basis, source URL, and review note.

Rationale: obscure items will need human confirmation. Keeping overrides in a simple file avoids database or CMS work.

Alternative considered: put provenance inside every content file. Rejected because public content should stay editorial and the provenance can be bulky.

## Risks / Trade-offs

- Some sources disagree on original vs format release date -> report conflict and require verified override.
- Bandcamp “released” can reflect platform upload or edited album metadata -> trust it only as official-source evidence, and lower confidence when other sources conflict.
- MusicBrainz/Discogs may have wrong or incomplete user-contributed data -> use them as corroboration unless exact format and release match.
- Full automation will miss obscure Greek/local releases -> keep manual override path cheap.
- Module cleanup can expand scope -> move only enough shared code to support standalone release-date research and keep existing console scripts compatible.
- Keeping the package name `blackbox-artwork-fetcher` stretches its meaning -> acceptable short term because the first slice fixes module boundaries; rename/split later if the historical name remains harmful.

## Migration Plan

1. Map current `tools/artwork-fetcher` entrypoints and imports.
2. Split shared helpers and command-specific modules without changing existing command behavior.
3. Implement the standalone dry-run release-date report with fixture tests and no content writes.
4. Run against the current catalog and review missing/conflict output.
5. Add verified overrides for known label releases and high-value missing rows.
6. Enable patch/apply mode for high-confidence exact-day dates only.
7. Apply reviewed updates in a separate content commit, then run `pnpm test:unit`, `pnpm check`, and `pnpm build`.

Rollback is reverting content updates and ignoring generated `.codex-artifacts` evidence. The tool itself is local and has no runtime impact.

## Open Questions

- Should `Russian Circles - Live at Dunk! Fest 2016` display the digital release date (`2017-04-07`) or vinyl format date (`2017-04-13`) for the vinyl distro item?
- Should the Distro Inventory Source eventually receive researched dates, or should the site content remain the only editorial date target?
- Should month/year precision ever be shown publicly, or should non-day precision stay report-only until a later content model change?
- After the internal split lands, should `tools/artwork-fetcher` be renamed to a broader local catalog tools package, or is the separated entrypoint surface enough?

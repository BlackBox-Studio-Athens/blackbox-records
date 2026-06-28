# Artwork Fetcher

Reusable local CLI for fetching front-cover artwork from CSV/TSV release lists.

## Setup

```powershell
cd tools/artwork-fetcher
python -m venv .venv
.\.venv\Scripts\python -m pip install -e .
```

Optional Discogs fallback:

```powershell
$env:DISCOGS_TOKEN = "..."
```

## Usage

```powershell
python -m artwork_fetcher --input examples/blackbox_artwork.tsv --out ./artwork --manifest ./artwork/manifest.csv
python -m artwork_fetcher --input examples/blackbox_artwork.tsv --limit 3 --out ./artwork_test --manifest ./artwork_test/manifest.csv
python -m artwork_fetcher --input examples/blackbox_artwork.tsv --dry-run
```

Input must be CSV or TSV with `artist,title,format` columns. Header is optional.

Sources are Bandcamp autocomplete, MusicBrainz/Cover Art Archive, Discogs when `DISCOGS_TOKEN` exists, then conservative YouTube lookup through `yt-dlp` when no high-confidence image candidate exists.
Bandcamp lookup tries strict `artist title` queries first, then broader title/artist queries only when needed. A title-only or artist-only hit is manual review, not an accepted download.
MusicBrainz uses release cover art first, then release-group cover art.
The selected download favors metadata accuracy first, independent thumbnail agreement when sources expose thumbnails, and highest known image resolution after that.
YouTube search does not download videos. It runs one `yt-dlp` metadata search, uses thumbnails as confirmation evidence, and only allows square-ish thumbnails as fallback cover candidates.

Bandcamp page HTML is often protected by a client challenge. The tool does not bypass that. It uses Bandcamp's autocomplete data through `bandcamp_async_api`, which returns album/track URLs and image URLs directly.

Artwork overrides are supported for known direct image, Bandcamp album, or Discogs release URLs:

```json
{
  "Artist\tTitle": "https://artist.bandcamp.com/album/title",
  "Verified Artist\tVerified Title": {
    "url": "https://artist.bandcamp.com/album/title",
    "image_url": "https://f4.bcbits.com/img/example_10.jpg",
    "verified": true
  },
  "Known Missing\tNo Cover": {
    "url": "https://www.discogs.com/release/example",
    "missing": true,
    "note": "Known source has no exposed artwork."
  }
}
```

Pass overrides with `--artwork-overrides overrides.json`.
Use `verified: true` only after manual artist/title/format review.

This repo includes a BlackBox-specific example at `examples/blackbox_artwork_overrides.json`.

## Output

The tool writes `images/`, `logs/fetch.log`, `.cache/`, `manifest.csv`, and `manual_review.tsv` under the output directory.

Generated filenames use:

```text
NNN - Artist - Title [Format] - cover.ext
```

No Google Images, auth bypasses, browser automation, or fake images.

## Network Policy

- Use a contactable User-Agent.
- Cache search, metadata, page, thumbnail, and image responses.
- Respect `429`, `503`, and `Retry-After`.
- Keep per-host delays for known APIs.
- Use API-backed sources before any page reads.

## Tests

```powershell
cd tools/artwork-fetcher
python -m unittest discover tests
```

## Vinyl Mockups

Generate store-style mockups from fetched covers:

```powershell
python -m artwork_fetcher.mockup --cover ./artwork_test/images/example.jpg --out ./mockups/example-vinyl-mockup.webp
python -m artwork_fetcher.mockup --input-dir ./artwork_test/images --out-dir ./mockups
python -m artwork_fetcher.mockup --cover ./artwork_test/images/example.jpg --preset post --out-dir ./mockups
python -m artwork_fetcher.mockup --input-dir ./artwork_test/images --social --out-dir ./mockups
```

The bundled background comes from the old BlackBox promo recipe. Use `--background <path>` to override it.
The `vinyl-mockup` console script is also installed with the package.

## CD Front Mockups

Generate concrete-background, front-only CD mockups from fetched covers:

```powershell
python -m artwork_fetcher.cd_mockup --cover ./artwork_test/images/example.jpg --out ./mockups/example-cd-front-mockup.jpg
python -m artwork_fetcher.cd_mockup --input-dir ./artwork_test/images --out-dir ./mockups/cd-front
```

The CD renderer uses MockupBro's front-view plastic CD box geometry and ambientCG `Concrete036` as a CC0 concrete background. It shows front artwork only: no disc face, tray, back cover, booklet, or interior packaging.

## Distro Sync

Plan or apply generated mockups into the Astro distro collection:

```powershell
python -m artwork_fetcher.distro_sync --manifest ./artwork_run_20260628/manifest.csv --format CD
python -m artwork_fetcher.distro_sync --manifest ./artwork_run_20260628/manifest.csv --format CD --apply
```

The command is dry-run by default. It reads downloaded rows from `manifest.csv`, finds matching CD or vinyl mockups under `<run>/mockups`, copies the selected mockup image into `apps/web/src/content/distro`, and writes or updates the matching distro JSON entry only when `--apply` is passed.

Supported normalized formats:

- `CD` expects `*-cd-front-mockup.jpg`
- `Vinyl 12in` expects `*-vinyl-mockup.webp`

Duplicate protection happens before writes. Existing entries are matched by artist, title, and distro group; matching entries are updated instead of duplicated. Existing duplicate keys, likely fuzzy duplicates, slug collisions, and image filename collisions stop the sync so the collection can be fixed manually.
The importer validates the generated Astro collection payload before writing, but the final authority after `--apply` is still the site check/build because Astro generates image metadata during its own pipeline.

Run the relevant mockup command first, then run `distro_sync` for the same format:

```powershell
python -m artwork_fetcher.cd_mockup --input-dir ./artwork_run_20260628/images --out-dir ./artwork_run_20260628/mockups/cd-front-concrete
python -m artwork_fetcher.distro_sync --manifest ./artwork_run_20260628/manifest.csv --format CD --apply
```

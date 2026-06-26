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

Source order is Bandcamp autocomplete, MusicBrainz/Cover Art Archive, then Discogs when `DISCOGS_TOKEN` exists.

Bandcamp page HTML is often protected by a client challenge. The tool does not bypass that. It uses Bandcamp's autocomplete data through `bandcamp_async_api`, which returns album/track URLs and image URLs directly.

Bandcamp overrides are still supported for known album URLs:

```json
{
  "Artist\tTitle": "https://artist.bandcamp.com/album/title"
}
```

Pass overrides with `--bandcamp-overrides overrides.json`.

## Output

The tool writes `images/`, `logs/fetch.log`, `.cache/`, `manifest.csv`, and `manual_review.tsv` under the output directory.

Generated filenames use:

```text
NNN - Artist - Title [Format] - cover.ext
```

No Google Images, auth bypasses, browser automation, or fake images.

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

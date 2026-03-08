# TODO

Working backlog for the current BlackBox Records Astro site.

This file is intentionally short and editable.
For deeper context, see:

- `AGENTS.md`
- `SESSION-TRANSCRIPT-2026-03-01.md`

## Current state

- Static Astro 5 site deployed to GitHub Pages
- Top-level sections (`/`, `/news/`, `/artists/`, `/releases/`, `/about/`) are same-document shell routes
- Release / artist / news detail pages still exist as real Astro routes and are also opened as shell overlays in-site
- Persistent shell owns the embedded Bandcamp / Tidal player
- Single active player session only
- Minimized player survives shell-managed top-level navigation
- Content is collection-backed:
  - artists
  - releases
  - news
  - navigation
  - socials
  - settings
  - home
  - about
- Artist image delivery standard is now locked for homepage featured-roster usage:
  - ideal: `1800 x 2400`
  - acceptable minimum: `1200 x 1600`
  - rendered as strict `3:4`, center-cropped, `object-fit: cover`

## Known constraints

- Third-party iframe playback does not survive:
  - full reloads
  - new tabs
  - non-shell navigations
- Top-level navigation should not be moved back to real route swaps without re-evaluating audio persistence
- Mobile minimized player currently floats over content by product choice
- `home` / `about` decorative image fields are still string paths, not Astro `image()` fields

## Active TODOs

1. Centralize repeated content collection sorting/filtering helpers in `src/lib/site-data.ts`.
2. Decide whether `home` / `about` decorative images should move to Astro asset fields.
3. If a CMS is added, build it on top of `src/content/**` instead of introducing a parallel content system.
4. If the minimized player is touched again, re-evaluate:
   - floating vs reserved-bottom-space behavior
   - compact mobile layout
   - open / minimize / reopen / stop flow
5. If top-level routing changes again, re-validate:
   - header section switch
   - footer section switch
   - mobile nav section switch
   - player continuity
   - console cleanliness

## Recent completed work

- Shop and social external links now open in new tabs where appropriate
- Header active-state logic no longer falsely highlights `Shop` on home
- Homepage section headings were simplified to single-line editorial titles
- Release-card `LISTEN` hover got its own audio-specific interaction
- Pointer cursor behavior was normalized for real clickable controls
- Shell section routing now uses:
  - stronger top snap
  - focus reset to `main`
  - a section-transition veil
- Mobile-first persistent-audio path was re-checked and kept intact

## Additions for next pass

- Add new user-requested TODO items here
- Split into `Now`, `Next`, and `Later` if the backlog grows

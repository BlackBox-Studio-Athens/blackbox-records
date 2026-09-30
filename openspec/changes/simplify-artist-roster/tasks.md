# Tasks

## 1. Roster simplification

- [x] 1.1 Remove the roster Listen triggers, their player data and the unused `latestReleaseEntry` roster context field.
- [x] 1.2 Link the photo of the pile and disclosure prints to the artist, outside the tab order.
- [x] 1.3 Remove roster numbers from rows, preview topline, print captions and `planArtistRoster`; keep grouped letter markers aligned.
- [x] 1.4 Update the affected tests; run strict OpenSpec validation and `pnpm validate`.
- [x] 1.5 Verify Local desktop and phone roster: no numbers or Listen, photo click opens the artist overlay, grouped letters still align. Local 2026-09-30, `astro dev`: desktop and 375 px phone show no numbers or Listen; pile and disclosure photos are `tabindex=-1` links; clicking the pile photo opened the Afterwise overlay and tapping the disclosure photo opened the Chronoboros overlay over the roster; forcing `data-roster-grouped` gives rows a 72 px letter gutter, 0 under latest sort.

A design document is omitted: the change removes markup and reuses the shell's existing artist link handling.

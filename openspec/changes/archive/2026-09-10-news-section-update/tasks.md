## 1. Enrich Release and Artist content

- [x] 1.1 Update `apps/web/src/content/releases/disintegration.md` to the verified `2026-06-09` Actual Release Date; describe the six-track debut album; keep Digital as a provider-confirmed format and Black Vinyl LP/CD as label-owned formats; add the official lineup, recording, mixing, mastering, artwork, and label credits; and preserve the exact Bandcamp and Tidal values introduced by `7193409a`. Update the matching Afterwise Artist prose from forthcoming to released.
- [x] 1.2 Update `apps/web/src/content/releases/anarchotribal.md` to the verified `2026-06-06` Actual Release Date; describe the ten-track psychedelic/punk-influenced trio album; add Digital alongside the label-owned Vinyl format; add the official lineup, recording, engineering, mixing, mastering, production, guest, artwork, photography, and label credits; and preserve the exact Bandcamp and Tidal values introduced by `7193409a`. Remove the stale Ouranopithecus `upcoming_release` placeholder.

## 2. Add Release News entries

- [x] 2.1 Add the _Disintegration_ News Markdown entry with publish date `2026-06-09`, existing cover artwork, accessible alt text, the six-track sequence and useful core credits, a clear distinction between provider-confirmed and label-owned formats, a base-safe relative internal Release link, and the [official Bandcamp source link](https://afterwise.bandcamp.com/album/disintegration).
- [x] 2.2 Add the _Anarchotribal_ News Markdown entry with publish date `2026-06-06`, existing cover artwork, accessible alt text, the ten-track sequence and useful core credits, a clear distinction between provider-confirmed and label-owned formats, a base-safe relative internal Release link, and the [official Bandcamp source link](https://ouranopithecus.bandcamp.com/album/anarchotribal).
- [x] 2.3 Compare each News/Release pair for the exact date, track count, names, roles, formats, and BlackBox participation. Keep the complete structured credit record on the Release entry, allow the News entry to use a shorter narrative subset, and confirm the `7193409a` Bandcamp and Tidal values remain byte-for-byte unchanged.

## 3. Verify content and rendering

- [x] 3.1 Run `pnpm test:unit`, `pnpm check`, and `pnpm build`; confirm content schemas, relative artwork paths, Markdown links, sitemap generation, and the exact final tree pass all required gates.
- [x] 3.2 Use Browser Use to verify homepage and `/news/` order is _Disintegration_, _Anarchotribal_, then _Caregivers_; verify dates, summaries, images, and News direct-detail/app-shell-overlay rendering; click both internal Release links from direct and overlay articles and confirm they stay inside the configured UAT and PRD base paths. Verify both Release direct-detail and overlay views expose their dates, summaries, formats, and full credits at wide and 320 px viewports; confirm their album players still resolve through the `7193409a` links and the console stays clean.

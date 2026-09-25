# Complete image delivery

## Why

Some staff rows show the file placeholder because media can lack a valid private thumbnail, the key rules differ between upload and thumbnail lookup, and oversized client derivatives are silently omitted. Public runtime CMS images also reach the renderer at their original size even though Astro requests responsive widths.

## What changes

- Align staff upload, thumbnail URL, media-reference audit, and bounded R2 backfill key validation; require valid PNG thumbnails up to 96 × 96 and 40 KiB for new uploads.
- Report missing originals, unsupported keys, and missing or invalid thumbnails as separate inventory outcomes. Store derivatives separately and preserve source bytes if derivative preparation or storage fails.
- Transform only accepted public CMS snapshot images through Cloudflare Images URL transformations at `images.blackboxrecordsathens.com`, with the finite responsive widths already emitted by the site, `format=auto`, exact UAT/PRD Pages source origins, and original-byte fallback.
- Enable Workers Caching only for the public image entrypoint. Keep the default public renderer and the staff CMS uncached; staff images, drafts, and previews remain private and no-store.
- Keep repository-owned static images on their existing Astro and Pages path.

## Boundaries

- No original is changed, deleted, or copied into Cloudflare Images storage.
- Local implementation and validation are included. UAT/PRD R2 writes and Cloudflare hostname/source-origin configuration remain subject to the existing Free-tier usage review and one-run authorization.
- No paid Cloudflare product or new storage binding is introduced.

# Complete image delivery

## Why

Some staff rows show the file placeholder because media can lack a valid private thumbnail, the key rules differ between upload and thumbnail lookup, and oversized client derivatives are silently omitted. Public runtime CMS images also reach the renderer at their original size even though Astro requests responsive widths. PRD measurements on 2026-09-30 found three more gaps: the Pages gateway dropped `Accept`, so every transform returned JPEG; widths outside the ladder returned originals of up to 9.5 MB; and every page render was uncached, so document latency dominated Largest Contentful Paint.

## What changes

- Align staff upload, thumbnail URL, media-reference audit, and bounded R2 backfill key validation; require valid PNG thumbnails up to 96 × 96 and 40 KiB for new uploads.
- Report missing originals, unsupported keys, and missing or invalid thumbnails as separate inventory outcomes. Store derivatives separately and preserve source bytes if derivative preparation or storage fails.
- Transform only accepted public CMS snapshot images through Cloudflare Images URL transformations at `images.blackboxrecordsathens.com`, snapping any requested width up to a finite ladder, `format=auto`, exact UAT/PRD Pages source origins, and original-byte fallback.
- Forward only the shopper's `Accept` header through the Pages gateway so `format=auto` can negotiate AVIF or WebP; cookies and authorization stay behind.
- Enable Workers Caching for the public Worker's image and default entrypoints. Successful published HTML is shared at the edge for at most 60 seconds and revalidated by browsers on every use. Previews, `/content-version.json`, not-found and error responses, originals returned after a failed transformation, the staff CMS, staff images and drafts stay `no-store`.
- Keep repository-owned static images on their existing Astro and Pages path.

## Boundaries

- No original is changed, deleted, or copied into Cloudflare Images storage.
- Local implementation and validation are included. UAT/PRD R2 writes and Cloudflare hostname/source-origin configuration remain subject to the existing Free-tier usage review and one-run authorization.
- No paid Cloudflare product or new storage binding is introduced.

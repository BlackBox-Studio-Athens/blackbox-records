# Proposal

## Why

The shell caches a page by cloning the live `<main>`, on mount and before each section navigation. Astro removes `ssr` from an `astro-island` once it hydrates, and `@astrojs/react` hydrates only islands that still have it. A cached page therefore came back with inert React islands that still showed whatever the shopper had typed. Observed in Playwright: after Home → Who we are → Releases → Who we are, the newsletter form kept the earlier email, and Subscribe sent no request because no React handler was attached. The same happened on Home, the initial document.

## What Changes

- Remember each island's markup the first time the shell sees it: from the live page when the shell mounts, and from the applied snapshot HTML before the island loads its component. When the shell snapshots a page, the cached copy gets this markup back and `ssr` again, so the island hydrates against its server render.
- Add `e2e/shell-islands.spec.ts` (Home and Who we are newsletter forms after cached returns) and a unit test for the restore.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `app-shell-and-player`: React islands in a cached shell page hydrate again when it returns.

## Impact

`shell-page-snapshot.ts` and its unit test, and a new e2e spec. Shell-section islands today: `NewsletterSignupForm` on Home and Who we are (`client:load` elsewhere sits on detail, checkout and terms pages, which are not shell sections). No dependency, content, Worker or commerce change.

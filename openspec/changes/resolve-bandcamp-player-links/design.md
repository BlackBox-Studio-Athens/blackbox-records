# Design

## Domain and persistence

Introduce immutable validated BandcampPage and BandcampRecording value objects. A page contains a canonical HTTPS artist.bandcamp.com album/track address; a recording contains a kind and positive decimal ID. Only recording identity derives a player URL and layout. Keep existing bandcamp_embed_url storage and its embed-only schema. Existing official embed and iframe inputs resolve locally, including v=2 and album plus track embeds (track takes precedence).

## Resolver

POST /_emdash/api/blackbox/bandcamp/resolve requires an editor identity, same Origin, X-EmDash-Request and bounded strict JSON. Dispatch independently of publication routes so lookup never schedules publication or writes content. Fetch only validated Bandcamp pages, revalidate up to three redirects, send no staff headers or credentials, apply one ten-second deadline and a two-MiB decoded HTML ceiling. HTMLRewriter extracts og:video:secure_url, og:video and data-tralbum attributes without evaluating scripts. Valid advertised player identities must agree with structured recording metadata and requested kind. Missing, conflicting, blocked, oversized and unavailable responses fail safely with private no-store errors. Client validates returned identity before deriving its embed.

## Staff interaction

Use the existing field, house controls and inline accessible feedback. Explicit empty/editing/resolving/resolved/failed states separate raw text from validated draft content. Resolve pages after 750 ms, abort superseded work and reject stale results across editor identities. Only success or explicit Clear changes draft data; failure preserves the previous source. Retry and Revert recover failures. Unresolved input blocks autosave, review and navigation even if ordinary draft dirty is false, and triggers unload protection. Opening a saved embed performs no network request or rewrite. Preview remains inert and no public renderer performs resolution.

Pasted embeds parse directly into a recording value without a canonical-string round trip. The page value stays stable while resolving; new input or Retry supplies a new page value and restarts the effect. Each request's abort signal rejects late results, including synchronous input changes and unmounts. Both saved and unsaved discard reuse the editor reset so local field state follows the restored document.

## Acceptance and limits

Ethos resolves to album 2345223781; Hail resolves to track 1718987398 rather than its parent album. Fixtures retain only relevant public metadata. Focused tests cover parser trust boundaries, metadata fallback/disagreement, endpoint authorization/bounds/redirects/deadline, input races and save guards. Run final pnpm validate and strict OpenSpec validation. Local staff/preview/publication checks and player checks establish only the environment actually exercised; discovering an identity does not prove permanent provider playback availability. Custom domains, background retries, caching, backfills and deployment are outside scope. Manual official embeds remain a fallback when upstream metadata changes.

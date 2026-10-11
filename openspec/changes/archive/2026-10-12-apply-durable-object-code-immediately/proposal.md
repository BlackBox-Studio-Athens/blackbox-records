# Apply Durable Object code immediately

## Why

After `fast-release-path`, a deploy finished in seconds, but the backend's Durable Objects kept answering with the previous release's code for about 5 minutes:

- UAT run `37545331781`: the Worker entry served the new SHA at 23:17:08, the store object at 23:22:06.
- PRD promotion `37546197141`: the entry at 23:24:23, the store object at 23:29:28.

So backend API changes had to stay compatible with the previous release.

The cause is Wrangler's deployment default, read from `wrangler-dist/cli.js` in wrangler 4.141.0: `DEFAULT_DURABLE_OBJECTS_CODE_UPDATE_STRATEGY = { mode: "deferred", max_delay: 300 }`. Every deploy tells Cloudflare to apply new code to a running object only once it hibernates, or after 5 minutes. A busy object never hibernates, so it waits the full 5 minutes.

The renderer's `PublicSiteRuntime` object has the same default. Under traffic, it can render HTML naming the previous release's `/_astro` chunks for up to 5 minutes after Pages replaced them.

## What Changes

- Both Worker config generators set `durable_objects.code_update_strategy: { mode: 'immediate' }`:
  - the backend in `apps/backend/astro.config.mjs`;
  - the renderer in `apps/backend/astro.public.config.mjs`.
  - `wrangler deploy` (UAT) and `wrangler versions deploy` (PRD) read it from the generated config.
- `verify-worker` and `verify-hosted` also require the store Durable Object (a GET of `/api/store/capabilities`) to report the candidate, not only the Worker entry.
- A config test keeps the setting in both generators.

## Capabilities

### Modified Capabilities

- `software-release-promotion`: a deploy restarts running Durable Objects onto the new code at once, and the identity checks cover the store object.

## Impact

The changed files are the two Astro config generators, `scripts/release-candidate.mjs`, its test, one backend config test, and the release docs.

At the moment of a deploy, a request in flight in an object fails only if it touches Durable Object storage:

- The CMS object (preview contexts and alarms) and the renderer object (render cache) use storage.
- The store object uses none.

Cloudflare may restart objects at any time, so that code already tolerates it. There is no data, provider or quota change.

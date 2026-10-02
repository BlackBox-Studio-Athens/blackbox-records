# Cloudflare Free-tier operating rule

Stay on Free. Do not enable a paid plan to unblock implementation or tests.

The combined CMS Worker uses Access identity and disables Astro sessions. Its canonical `pnpm --filter @blackbox/backend build:cms` command rejects KV in source configuration and in the final adapter-generated Wrangler artifact, including environment and unsafe KV bindings. Dependency upgrades must pass that build and the existing authenticated-request no-session-cookie regression. Deploy only an artifact from a successful canonical build; direct Astro builds are not release evidence.

Before bulk hosted imports, repeated probes, recovery rehearsals, or scheduled work:

1. Rehearse locally. Inspect the final generated bindings and trace service operations, including session/cache writes triggered by GET requests.
2. Read current account-wide usage for each affected operation type. Record the target, remaining allowance, expected operations, retry/pagination/background overhead, and explicit headroom for ordinary service. Unknown usage is not permission for an unbounded hosted run; continue locally until there is enough evidence.
3. Run a small bounded pilot within that allowance, measure actual operations, and revise the estimate before the full run. Stop if observed use exceeds the estimate. Reuse completed evidence instead of rerunning a full import or probe without a concrete reason.
4. On a quota warning, pause affected bulk work and retries, inspect the cause and remaining allowance, and reduce the operation count. On exhaustion, stop affected writes until the provider's stated reset and recheck usage before resuming. Reset alone does not fix unnecessary writes.

Adding a quota-consuming binding or background job requires a documented purpose, owner, measured operation budget, confirmed Free-tier availability, and behavior on exhaustion. Reintroducing KV additionally requires an intentional change to the build guard and its test with that rationale; there is no environment-variable bypass. This policy prevents accidental recurrence, not exhaustion caused by arbitrary account traffic.

## Images transformations

Cloudflare Images Free allows 5,000 unique source-and-options transformations per month, shared by UAT and PRD. Past that, new transformations fail (error 9422) while cached ones keep serving. The public renderer bounds what can consume it:

- Media URLs carry the media SHA only, so a publication, including a text-only one, re-mints nothing for unchanged images.
- `/_image` transforms only media of the live snapshot or the three most recently accepted snapshots, and only widths the image components emit (the 96 to 1800 px ladder, 540 and each image's intrinsic `src` width). Every request snaps to one of 17 ladder rungs and uses one canonical source URL per media SHA, whatever the public hostname or legacy URL shape.
- The Images source is the environment's configured `PUBLIC_IMAGE_SOURCE_ORIGIN` (its Pages origin), not the request host, so adding a public hostname keeps transformations.
- When a transformation fails, the renderer serves the verified original with `public, max-age=300` and `X-Blackbox-Image: original-fallback`, never immutably, so transformations resume after the monthly reset and the edge absorbs repeats meanwhile.

The monthly ceiling is therefore about 17 transformations per distinct media SHA in the live and recent snapshots, per environment. Check it against the Images dashboard before bulk media imports. After a hostname or Images configuration change, run `pnpm smoke:uat-static -- --site-url <public-url> --scenario image_transform`; it expects a 480 px AVIF or WebP of at most 250 KiB with immutable caching.

## Incidents

Incident evidence: [UAT editorial import](../openspec/changes/replace-sveltia-with-emdash-operations/uat-editorial-import-evidence.md). Cloudflare reported the account's daily KV PUT allowance exhausted on 2026-09-13. Redundant Astro sessions were a verified contributor; the retained evidence does not attribute every account write.

Recovery was verified on 2026-09-14 at 01:01 UTC. Account-wide KV analytics reported no operations for the new UTC day before a bounded probe. One uniquely named diagnostic key in the existing M1 UAT session namespace was written with a 60-second expiry and read back successfully (HTTP 200 for both; exact value match). This used one PUT and one GET, with no retry, namespace creation, binding change, or plan upgrade. Evidence: `.codex-artifacts/emdash-m1/kv-reset-verification.log`. Analytics can lag; this is proof of restored access, not an exact remaining-quota guarantee. Keep the no-KV CMS guards and preflight budgeting rule in force.

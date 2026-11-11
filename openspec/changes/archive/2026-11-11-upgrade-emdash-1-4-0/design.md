# Design

## Decisions

- Keep the revision-fenced delete, version bump on soft delete and deleted-entry conflict. Upstream's atomic competing-save fix does not provide those contracts. Preserve source, compiled code and declarations together.
- Keep the admin exports, scoped upload routing, asset-edit restriction and disabled block commands. Staff embeds these APIs and 1.4.0 does not provide them.
- Keep Astro sessions disabled and use the existing Access authentication. Do not add KV, new schedules or changes to native admin navigation. Recommend hiding unused native areas only after a Staff owner verifies reachability and workflow.
- Extend the rehearsal's source label to 1.3.1. The source version needs independent provenance: migration 091 alone cannot distinguish 1.1.0, 1.2.0 and 1.3.1.
- Preserve application-before-core migration order, fresh manifest, target fingerprint and backup requirements. Local evidence does not authorize hosted work.

## Release assessment

- #4157: Astro sessions are disabled, so the session-write improvement does not establish a BlackBox write reduction. No session-store measurement is applicable.
- #4286: Adopt the upstream atomic competing-save fix; retain the distinct delete and missing-entry protections above.
- #3129: Adopt upstream blank image/file normalization for native API clients. Publication remains subject to BlackBox's existing required-image validation; verify compatibility in Local content checks.
- #4425: Adopt upstream optional datetime fix where native fields use it. BlackBox calendar dates are strings; no conversion is required.
- #4243: Adopt the native cache-hint fix where applicable. The accepted-snapshot renderer owns BlackBox's public cache and validators, so no measured change there is claimed.
- #4167: Adopt upstream byline query optimization; BlackBox uses its own snapshot renderer, so no site-wide query reduction is claimed.
- #4287: Existing CMS maintenance calls EmDash scheduled tasks. Hourly cleanup now includes OAuth token, authorization-code and device-code deletes; this adds database operations to the existing schedule. No new trigger is added. Local tests cannot establish hosted billed rows; reassess the Free budget before a future hosted rollout.
- #3856: Recommend reviewing comments, redirects, widgets, sections, bylines and import for hiding in native admin. Hiding is navigation only, not authorization; preserve configuration pending Staff verification.
- #4186: Adopt upstream image 304 stream cleanup where the native image route applies. BlackBox's Cloudflare adapter uses passthrough images and its publication media path is separate; no R2 saving is claimed.

# Phase 15: Adopt Sharp Asset QA - Context

**Gathered:** 2026-05-22
**Status:** Ready for planning
**Source:** Automatic `gsd-discuss-phase 15 --auto` from dependency-adoption request

<domain>
## Phase Boundary

Phase 15 formalizes `sharp` as a repo-owned image asset QA tool. It validates committed static/content image assets and favicon metadata before content or design changes ship. It does not replace Astro's existing image pipeline, introduce dynamic image processing, add a Cloudflare Images dependency, or change public asset URLs.

</domain>

<decisions>
## Implementation Decisions

### Adoption Scope

- **D-01:** Treat Sharp adoption as tooling hardening because `sharp` is already installed in `@blackbox/web` and used by the favicon test.
- **D-02:** Add a focused asset QA script instead of routing all images through a new runtime abstraction.
- **D-03:** The first script should inspect committed assets and content images only; it must not mutate files by default.
- **D-04:** The script may offer a future `--fix` mode only after the read-only check is stable.

### Asset Rules

- **D-05:** Validate favicon dimensions, alpha/channel expectations, and basic metadata for files under `apps/web/public`.
- **D-06:** Validate artist portrait source dimensions against the documented 3:4 standard where discoverable from content.
- **D-07:** Validate release, distro, news, home, about, and services image references only to the extent the repo can resolve their local files safely.
- **D-08:** Failures must identify the content entry or asset path and the exact rule that failed.

### Integration Boundary

- **D-09:** Keep Astro content collection `image()` fields as the authoritative image integration path.
- **D-10:** Do not add a Worker image API, Cloudflare Images, or server-side runtime resizing.
- **D-11:** Keep `sharp` in `@blackbox/web`; add root scripts only as wrappers around package-local checks if needed.
- **D-12:** Full implementation validation still requires `pnpm test:unit`, `pnpm check`, and `pnpm build`.

### the agent's Discretion

The agent may choose exact script names, helper function boundaries, and whether the first pass covers all image classes or ships a conservative resolver with explicit skipped-file reporting.

</decisions>

<canonical_refs>

## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Repo Policy

- `.planning/ROADMAP.md` - Phase 15 scope and success criteria.
- `AGENTS.md` - required command policy and asset/content ownership.
- `.planning/codebase/STACK.md` - records current Sharp and image stack usage.

### Image And Content Surfaces

- `apps/web/src/config/site-favicon.test.ts` - current Sharp use.
- `apps/web/src/content.config.ts` - Astro content image schemas and collection boundaries.
- `apps/web/src/content/**` - source content entries that reference image assets.
- `apps/web/public/assets/` - committed public brand/static assets.

</canonical_refs>

<code_context>

## Existing Code Insights

### Reusable Assets

- `apps/web/src/config/site-favicon.test.ts` already imports `sharp` and proves the package works in Vitest.
- Astro content collections already type image references, so the script should consume existing paths instead of creating a parallel manifest.

### Established Patterns

- Repo tooling scripts live under package or root `scripts/` and should be covered by Vitest when parsing behavior matters.
- Asset failures should be deterministic and not depend on a dev server.

### Integration Points

- Add a package script such as `assets:check` or `check:assets` in `apps/web/package.json`.
- Optionally add a root wrapper once the package command is stable.

</code_context>

<specifics>
## Specific Ideas

Use Sharp for read-only metadata checks first: dimensions, alpha/channel metadata, format, and actionable error messages. Avoid bulk conversion or optimized-output generation in this first slice.

</specifics>

<deferred>
## Deferred Ideas

- Automatic image resizing/conversion.
- Cloudflare Images or dynamic Worker image processing.
- A CMS upload pipeline that rewrites images before commit.

</deferred>

---

_Phase: 15-Adopt Sharp Asset QA_
_Context gathered: 2026-05-22_

# Design

## Context

See proposal.md. Installed EmDash core, Cloudflare and admin are 0.41.0. The existing package patch adds atomic revision-fenced deletion and retains the caller's revision baseline during draft staging; both corrections remain absent from 1.0.1. Current Node 24.21.0, Astro 7.3.5, Cloudflare adapter 14.3.3 and React 19.3.0 satisfy upstream requirements.

## Goals / Non-Goals

Preserve all BlackBox editorial and publication contracts while adopting 1.0.1. Do not introduce new APIs, UI workflows, caches, sessions, permissions, dependencies or migration infrastructure. Existing code promotion, content publication and shopper launch remain separate.

## Decisions

- Upgrade all three direct packages together and regenerate the lockfile. Keep exact package-scoped release-age exceptions; never disable release-age policy globally.
- Rebase the patch across package source, executable dist files and declarations. Parse revision tokens once at the handler boundary and carry the existing typed revision precondition to the atomic SQL predicate. Do not replace database concurrency with in-memory locks or preflight-only checks.
- Keep supported public imports, including emdash/middleware. The removed internal entrypoints, cloudflareCache, Comments/CommentForm, deprecated CLI commands and experimental.registry have no active callers here.
- Set updateCheck: false in real and fixture integrations because dependency release management already belongs to CI.
- Keep custom Access auth and session: false. The 1.0.1 integration explicitly exempts external authentication from the missing-session warning. Retain no-KV and no-cookie acceptance.
- Reuse the copied-state upgrade smoke and existing compiled REST/editor/publication/preview suites. Add cases for new migrations, unsafe URL rejection and malformed deletion revisions; retain race checks and selected-revision relation projection.
- Strip the new `_referencesBaseline` merge metadata alongside `_references` at the existing selected-revision projection boundary. It must never enter strict content validation or a published snapshot; the selected `_references` still determines the Artist.

## Risks / Trade-offs

- Lost concurrency protection: prove compiled HTTP races before accepting the rebased patch.
- Stored URLs rejected by stricter upstream validation: inventory before hosted rollout and report invalid records; do not silently rewrite content.
- Relation merging changes: verify native Artist references and exact selected-revision preview/publication, including newer unrelated drafts.
- Stale migration manifest: rebuild per target and retain its manifest with the verified artifact; use existing fingerprint checks.
- Different hosted migration state: inspect target histories; do not infer them from package pins.

## Migration Plan

Use stopped Local state copied into disposable storage. Existing application preparation remains before core migrations, including the pre-079 calendar correction when needed. Verify 088_cron_oneshot_utc preserves instants and 089_auto_seed_completion prevents configured sites being seeded again. Check two starts, fresh state and retained revision/media/publication/commerce data.

After local acceptance, use the existing UAT pipeline and immutable PRD candidate promotion. Before hosted writes, record Free-tier budget, database/media backups, accepted pointer and target migration history. A target already through 087 needs only 088/089: timestamp updates compare the original value and the seed marker uses insert-if-absent. This path does not rewrite editorial content and requires no editorial pause. Unexpected or older histories require reassessment before apply. The concurrency-safe backup released in 20f223c also permits ordinary edits during capture. PRD retains separate explicit code-promotion approval; catalog and launch flags stay unchanged. On failure stop promotion, assess whether writes must pause, and prefer a forward fix or restore compatible CMS data and code together. Never restore commerce as part of CMS recovery or downgrade code against migrated CMS data.

## Changelog Coverage

Reviewed 0.42.0, 1.0.1-rc.0, 1.0.1-rc.1 and 1.0.1 for core, Cloudflare, admin, auth, blocks and Gutenberg conversion; all RC PR entries appear in stable notes. Reviewed plugin-types 0.4.0→0.5.0, registry-client 0.6.1→0.7.0, registry-lexicons 0.6.0→0.7.0 and registry-verification 0.3.2→0.3.3.

- Core: URL/redirect/pattern safety, relation merge, edit locks, limit clamping, seed recovery/trash collisions, migration repair, update checker, Windows dev/typegen and internal path removals. Local regression results are recorded in validation.md; native routing, MCP, OAuth, registry, WordPress and plugin features remain unexposed by our existing boundary.
- Admin: dotted-filename autolinks, image metadata, reference reloads and publication conflicts affect regression selection. Native admin page/layout/localization changes need no custom staff redesign.
- Cloudflare: migration executor paths are regenerated by the adapter; removed route caching is unused. R2 sandbox/byline additions require no configuration changes.
- Auth: update permission accompanies the disabled checker. Blocks add optional table/menu behavior. Gutenberg has no intervening functional changes. Registry/plugin changes add bylines and version comparison/age enforcement; no new capabilities are enabled.

Sources: [0.42.0](https://github.com/emdash-cms/emdash/releases/tag/emdash%400.42.0), [1.0.1](https://github.com/emdash-cms/emdash/releases/tag/emdash%401.0.1), [upgrade guide](https://docs.emdashcms.com/upgrade-to-v1/), [package changelogs](https://github.com/emdash-cms/emdash/tree/emdash%401.0.1/packages).

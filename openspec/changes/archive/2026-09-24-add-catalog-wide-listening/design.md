## Context

See [proposal.md](proposal.md). Release cards, Release/Artist details, and release-backed Store Item details already use `buildEmbeddedPlayerData`, `MusicStreamingServiceListenTrigger`, and the shell-owned player. `DistroCard` and `StoreItemCard` do not expose Listen; the shared Distro schema and staff form have no provider fields.

The catalog research baseline is 101 Distro records plus 3 Releases. [research.md](research.md) explains evidence and exceptions; [listening-sources.csv](listening-sources.csv) supplies the actual values. The existing Distro enrichment ledger supplied useful leads, but an artist homepage is not an album source. Research belongs to this planning change, not the apply phase.

## Goals / Non-Goals

**Goals:** Reuse the working listening flow with a small editorial-data and presentation change. Keep provider fields optional for backward compatibility while making current catalog coverage explicit.

**Non-Goals:** New providers, autoplay, playback continuity across full document navigation, automated discovery in the application, a recording collection, duplicate-edition relationships, runtime availability polling, provider SDKs, or new Cloudflare resources. Music is the scope of “all items”; non-music merchandise has no invented recording association.

## Decisions

### Selected placement and session status

Store listing controls sit in a 52px row below artwork, using a 112 × 44px button. Empty rows align source-less cards without inventing a disabled Listen action. Coverflow reserves the action row below its active cover. Releases retains its current placement. The shell projects active editorial source identity into shared triggers as disabled amber In player status, resets them on Stop or source replacement, and resynchronizes newly rendered/cached routes and overlays. This is a view of the existing session, with no new playback state, iframe, observer or store. Open and Stop remain available in the floating player. Disabled status is static and readable.

Grid actions align with card copy; the active Coverflow action centers below the record, following the selected mode-aware alignment.

Mobile navigation acceptance also requires clean cached pages. If a dialog temporarily marks descendants with `data-aria-hidden`, snapshot capture keeps the previous clean cache rather than persisting the dialog's accessibility mask. It does not remove authored hidden attributes.

### 1. Reuse the two existing editorial fields

Add optional `bandcamp_embed_url` and `tidal_url` to `createDistroContentSchema`. Export/reuse the existing validators from `schemas.ts`, rather than copying regexes or inventing another provider model. The EmDash schema already consumes the shared Distro schema. Add the two existing-style fields to the Distro branch of `ContentFields.tsx` and retain normal empty-field handling and error messages.

Bandcamp needs an actual `EmbeddedPlayer` URL containing the verified numeric recording ID; its human-facing album URL stays in the planning register as evidence. Tidal uses the canonical `https://tidal.com/album/<id>` URL accepted by the existing builder. Do not persist provider arrays, availability flags, research status, or source-evidence URLs in CMS content.

Both fields remain optional. There is no new publication guard or schema requirement that would break old snapshots, unrelated drafts, or non-music merchandise. A one-time catalog coverage review establishes backfill completeness; it is not an online health checker.

### 2. Derive player data while building the existing frontend catalog view

Add `embeddedPlayerData: EmbeddedPlayerData | null` to the existing frontend `StoreItem` view model in `catalog-data.ts`. Populate it in the two existing Release/Distro constructors using `buildEmbeddedPlayerData`. These constructors already have the source fields and display identity, so this adds no per-card fetch, endpoint, cache, or lookup registry.

Preserve Release session IDs exactly as they are today. Prefix new Distro IDs with `distro:` before passing them to the same builder. The internal `releaseId` property and data-attribute names can remain for compatibility; a project-wide rename has no user benefit here. Different editions may repeat the same URLs and retain separate source IDs. At this catalog size, that is simpler than introducing a shared recording entity.

Use the derived data in both card templates and Store Item details. Keep existing source reads for release/artist links and Distro galleries, but remove redundant Store Item player derivation. Read through `content-reader` and the normal accepted-snapshot/static/preview projections; public pages must never read live CMS drafts. Keep the new view-model property out of explicitly constructed cart snapshots, offer/checkout payloads, and backend catalog projections.

### 3. Add one familiar action per item surface

Use the existing compact trigger on Home Distro, Store All, BlackBox Releases, Distro format previews, expanded/search results, and any other music card using the shared templates. Use the existing standalone treatment near title/artist on Store Item details. Existing Release and Artist surfaces continue unchanged. Listen remains secondary to Add to Cart, including when prices or stock are unavailable.

For the two newly supported card templates, make the item link and a real Listen button siblings within the existing visual card. Do not nest a button inside the current wrapping anchor or introduce a click-only span. Preserve card/search/coverflow hooks on the appropriate card container; keep the actual item link keyboard reachable. Adjust the current coverflow focus targeting only as needed for that markup.

The shell already resolves player intent before anchor navigation. Keep that delegated mechanism. In coverflow, an ordinary Listen activation must reach the player without being consumed as card selection; an actual swipe/drag must still suppress its synthetic click. Hidden cards remain inert. Integrate these narrow cases into the existing controller, with no second interaction system or card-component rewrite. Preserve concurrent photo-hover and browsing-layout work.

Bandcamp remains first for a fresh session; existing provider preference and switching rules continue. Only the requested player iframe loads. The current modal, loading state, focus return, interaction-before-minimize, Stop, and document-navigation limits remain authoritative.

### 4. Treat research results as a backfill input

The checked-in CSV is a planning handoff, not a runtime import or a permanent second content authority. Copy only verified provider values to the corresponding existing editorial records. Do not match records by display title at runtime. Preserve source IDs and sellable identities; document spelling/title corrections as research notes without silently renaming catalog items.

Repository content may be updated for bootstrap/static fixtures, but hosted content must be edited through the existing CMS workflow. Reconcile the register against the accepted catalog before a hosted backfill; any extra or changed recording returns to this planning register for research, rather than being guessed during implementation. The public UAT catalog could not be read anonymously during this planning run, so the 104-record count is explicitly a repository baseline.

Unresolved items remain named gaps. Do not invent a Bandcamp embed from an artist URL, substitute another recording, or claim universal coverage while those gaps remain. Their resolution is content research outside the implementation checklist; it does not require a more elaborate player or schema.

## Risks / Trade-offs

### Approved visual refinement: Fluid five

The user selected the animated five-bar design on September 24. Use the amber treatment shown in the selected prototype, the existing dark face and square geometry, and a minimum 44px compact action. Reuse one static SVG mark across Astro Listen triggers and the React player surface; no hydrated per-card client, timer, dependency or playback detector is needed. CSS runs two short cycles on hover/focus, modal opening and mini-player interaction, then returns to a static silhouette. Reduced-motion preferences disable bar animation. Preserve provider data, current labels, loading feedback, focus and session ownership. Prototype timeout/retry and trigger-label experiments are not part of this visual-only selection.

- **Third-party catalogs differ by edition, region, or time** → Retain exact source evidence and check both artist and recording title. An unsuccessful search is not proof of absence. Recheck only a changed or broken link; no monitoring service.
- **Full-card links conflict with a new button and coverflow** → Use sibling native controls and one focused interaction regression covering click, keyboard, inactive cards, and drag suppression.
- **Changing repository JSON alone does not update the live site** → Use the current accepted-content/CMS workflow for each environment; do not revive bulk recovery imports.
- **Some releases may have no supported public stream** → Keep those explicit in the register and omit misleading controls. They remain outside verified coverage until an exact source is supplied or the user explicitly changes the acceptance scope.

## Migration Plan

1. Implement shared schema/form support and derived player data, then add the existing controls to the missing surfaces. No database migration or new dependency is required.
2. Apply verified register values to local editorial fixtures/records, preserving unrelated content. Exercise save/reload, inert preview, publication, and accepted-snapshot/static rendering locally.
3. Run the focused existing suites, required `pnpm validate` and `pnpm validate:editor`, and relevant local publication/preview checks from `docs/content-publication.md` and `docs/content-workspace.md`. Verify desktop/mobile, keyboard, coverflow, one/two-provider behavior, sold-out listening, session reuse, and section navigation in the native browser.
4. A later authorized code release precedes hosted content publication. Use ordinary CMS edits and reviewed publication batches, respecting the existing maximum of twenty and `docs/cloudflare-free-tier.md`. Review operation allowance before any hosted bulk work; this proposal adds no resources or automatic hosted job.
5. Roll back listening content through the existing draft/review/publication workflow if a link is wrong. Roll back code through the normal retained release process if needed; stock, prices, orders, and original media need no changes.

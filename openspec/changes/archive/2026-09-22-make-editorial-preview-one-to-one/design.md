# Design

## Context

See [proposal.md](proposal.md) for scope. The design is sized for occasional editing on a low-traffic site.

The existing preview imports public Astro pages but removes scripts/iframes and makes controls inert. Ordinary preview loads surrounding native live revisions; the website uses an accepted immutable snapshot. Review already handles saved selections, but publication also resolves Store Item identities for Release/Distro changes. Reusing review unchanged would miss that difference.

The public renderer, `PUBLIC_SITE` binding, native EmDash APIs, `publishedCollection`, shell page loader, cart storage seam, and preview coordinator already exist. Store search reads page markup. These cover the work without a new rendering, search, or CMS framework.

## Goals / Non-Goals

**Goals:** the same public presentation and safe behavior for the same loaded inputs, private unsaved/saved previews, and straightforward recovery.

**Non-goals:** rewriting publication, locking media/catalog/code until publication, supporting large numbers of concurrent editors, adding persistent preview sessions, or replacing the staff UI.

## Decisions

### 1. Reuse EmDash and the existing content projection

Keep native EmDash identity, validation, revisions, references, media, and editor ownership. Use the supported runtime methods already used by review; keep the pinned 0.38.0 dependency and conflict patch.

Native [preview URLs](https://docs.emdashcms.com/guides/preview/) authorize an entry, not unsaved input or an exact reviewed batch. They do not replace this workflow. Do not add another signing/token system or move public pages to live CMS queries.

Compose one accepted baseline with either the selected validated browser record or the existing saved review selection of up to twenty entries. Reuse the current content mapping and extract only duplicated read-only media/catalog preparation. Publication transitions and writes stay where they are.

Release/Distro preview must resolve the same Store Item identities and existing fallbacks as publication, including new entries. Accepted media IDs use their immutable accepted bytes; newly selected IDs use protected native media. Missing references/media produce the current actionable error. Unsaved entries remain transient inputs rather than fabricated saved revisions.

**Scope limit:** retain the existing saved-revision and baseline conflict checks. Add no review fingerprint, publication intent field, media-lock protocol, or migration/compatibility path. A fresh preview loads current inputs. Changes made elsewhere afterward require refreshing/reopening preview; price/stock remain live runtime data. The parity promise applies when the compared inputs are the same, not to a future publication with changed inputs.

### 2. Render with the actual public application

Add one private render operation to the existing public runtime, called through `PUBLIC_SITE` after CMS authorization. Pass the validated preview input and canonical route through the existing request-scoped content reader. Do not save a snapshot or use the public accepted-page cache for preview.

Use the actual public routes and matching compiled assets, retaining Local `/blackbox-records/` and hosted `/`. Return the renderer's existing release identity when available; do not substitute the staff build identity. Ordinary render/asset failure prompts regeneration. No new release registry, Local build nonce, or compatibility negotiation is required.

Check asset ownership rather than blindly forwarding every path: hashed code assets come from the public artifact, while selected images and catalog aliases must resolve to the selected content. The current `public-asset.ts` delegates aliases to retained Pages assets. Reuse that ownership where appropriate; do not allow stale static media or arbitrary `/_image` URLs to bypass the candidate.

Use public URL helpers for all collection destinations: singleton pages, global header/footer content, detail/listing/overlay routes, canonical Store Item URLs, and Terms. Search continues to use rendered catalog markup. No second route registry or search index is needed.

Keep the service-only operation inaccessible through Pages and alternate public routes. It accepts server-resolved data, not arbitrary upstream URLs or browser-supplied internal credentials.

### 3. Keep the interactive page outside staff authority

Retain a separate preview origin on the **same CMS Worker**. Local uses `localhost:8787` alongside staff `127.0.0.1:8787`; verify reachability and the existing Local public-service binding. Hosted origins use the existing Access identity/allowlist with exact configured hostname/audience checks.

This boundary is needed because the preview now executes public application scripts. Traffic volume does not make staff DOM/storage or write-API access appropriate for that document.

Dispatch preview-host requests before staff/commerce/CMS routes. Allow only the frame entry, context-scoped page/media reads, required public assets, and exact shopper GET projections. Reject privileged APIs, checkout creation, form delivery, publication, and unsupported methods. Reuse existing authentication/validation code and its tests.

Use a real iframe `src`. Adapt existing CSP/sandbox policy narrowly for trusted public scripts, assets, and approved music embeds, while blocking staff access, top navigation, popups, and form delivery. Validate bridge messages by origin, source window, and current context/generation. Private responses remain no-store/noindex and send no referrer. Access handles sign-in; add no preview login/session system.

Use the existing public API-origin seam for preview shopper reads, covering direct listing-price callers too. Reuse cart logic with memory-only storage through its current storage seam. Block BlackBox analytics and explain attempted prohibited actions outside the public page layout. Approved players retain their ordinary provider behavior without receiving preview context or credentials.

### 4. Use one disposable context map and the current coordinator

A small map inside `CmsRuntime` holds the verified owner, immutable render input, and expiry for each random handle. The handle is a locator; authorization still runs on private requests. The staff creation response returns the iframe URL directly.

Carry the handle only on preview-origin page/fragment/media requests using existing URL helpers and the shell's `fetchPage` seam. Strip it from metadata and external URLs. Do not patch global fetch or introduce a second router.

Reuse the current preview byte/read/deadline limits. Bound the map to sixteen entries and the existing 8 MiB retained-data ceiling, with fifteen-minute expiry. Prune expired contexts on normal access; reject capacity exhaustion with the existing retry UI. No per-editor quotas, editor-instance registry, background cleanup, keepalive, LRU policy, or durable recovery is needed. Keep the previous successful context until its replacement is ready, then release it.

The existing `ContentPreview` remains responsible for 750 ms typing debounce, immediate open/context/retry, sizes, expand/focus handling, last-good rendering, and stale-response suppression. Replace direct iframe DOM access with only the readiness/scroll/action messages needed across origins.

Each changed input gets a new document, so its shell caches cannot contain another selection. Ordinary navigation within that document reuses the public shell cache without freshness probes on every Back/Forward action. Opening/retrying or returning from a hidden preview creates a fresh rendering; an expired handle is rejected on its next server read. This is a view of the loaded selection, not continuously verified global state.

Readiness covers the matching generation, required initial assets, and hydration. Keep public lazy loading and optional-font behavior. A pending frame must not start audio; replacing or hiding the document stops its player. Normal shell navigation within the active document keeps the player. Preserve existing errors/diagnostics without adding telemetry infrastructure.

### 5. Test the behavior that matters

Extend the current Local/browser checks rather than building a separate parity platform:

- Run the existing render/content smoke for all thirteen collection contexts, including canonical Store Item paths, related references, and selected media.
- Compare public and preview Home, a rich-text Release detail/overlay, and Store listing/detail at mobile and desktop widths in Chromium and Firefox. Use paired screenshots and existing text/DOM/interaction assertions with matching inputs/fonts/viewports. Inspect full layout, artwork/crops, and hydration; do not mask failures.
- Reuse current editor tests for the remaining required widths, 320 px accessibility, keyboard/focus, failure/retry, and generation ordering. Do not multiply every collection by every viewport and failure case.
- Add focused checks for the new boundary: unauthorized/wrong-owner context, denied writes, forged frame messages, and expiry/capacity recovery. Reuse native auth/conflict tests rather than recreating their full matrix.
- Extend one existing isolated Local publication scenario with a related batch containing media and Store Item identity changes. Assert the intended draft differences and compare actual published output while inputs remain unchanged; restore fixtures afterward.

Third-party iframe interiors are outside deterministic pixel comparison; verify player integration and persistence separately. No new pixel-percentage gate, screenshot calibration system, benchmark suite, or load test is required. Use existing latency/read/byte diagnostics if the normal smoke is slow or a limit is reached.

Mandatory repository/editor, no-KV, and relevant content/publication gates remain in [tasks.md](tasks.md). They establish their respective checks; screenshots and browser behavior establish visual parity.

## Risks / Trade-offs

- **Media/catalog/code changes after preview** → refresh preview to inspect those new inputs; retain existing publication revision/baseline checks. Add stronger coordination only if actual concurrent-edit incidents justify it.
- **Temporary context is lost** → regenerate from retained editor input. Persistence is unnecessary for this recoverable view.
- **Asset ownership or absolute API URLs bypass preview** → check the existing callers and verify real routes/assets during the Local smoke.
- **Interactive scripts gain staff privileges** → keep origin separation and server-side read-only routing. This is a correctness/security boundary, not capacity engineering.

## Migration Plan

Follow the dependency order in [tasks.md](tasks.md). Keep the old preview until the new flow works, then remove the inert rewrite, page-import dispatcher, duplicate mapping/cache, and obsolete `appearancePreview` substitutes. Update the workspace docs and reconcile the old unsynced inactive-preview rule without rewriting unrelated history.

Keep the canonical Local launcher and IDE configuration. Hosted work follows `docs/cloudflare-free-tier.md` and `docs/catalog-promotion.md`: configure the protected origin, run a small authorized UAT smoke using the existing budget procedure, then explicitly promote the reviewed candidate. Do not invent another rollout or capacity program.

Rollback uses a fresh compatible UAT candidate built from the last known-good source, followed by the normal promotion procedure. Disable the new preview route if necessary; preserve accepted content and operational data.

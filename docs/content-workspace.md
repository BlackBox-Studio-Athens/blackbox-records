# Staff editorial workspace

News can select an optional Artist to show that Artist's published genre on homepage and News listing cards. Clear Artist leaves general news without a tag. The genre stays on the Artist; private Artist edits do not change public tags until publication. Local startup and every UAT/PRD release prepare this native reference, so existing CMS stores need no manual setup. Review asks for an unpublished linked Artist to be included in the same batch. Retained source fixtures do not overwrite populated CMS records.

Artist forms use searchable ISO country choices (including multiple countries), genre suggestions, and standard link services. Country choices retain the existing slash-separated CMS text format; ISO identities and the shared validator prevent unrecognized or duplicate countries. Service URLs must match their selected provider; Spotify is excluded. Custom services remain an explicit Other choice.

Opening a blank form does not create a draft. The first edit begins autosave. Native creation maps missing image values to EmDash's empty default for older NOT NULL columns; private revisions retain the authored value. Uploading through an image picker selects the uploaded image immediately. Image descriptions use the library description or entry title, with an optional accessibility disclosure for more specific text. Artist photos fit intact inside the existing frames, including the roster's 3:4 frame, where any space left around the photo shows a blurred copy of it; recommend 1800 × 2400 px, minimum 1200 × 1600 px. Original image bytes are preserved.

From an artist, Add upcoming release opens a Release draft linked to that saved artist. The Release owns its cover image throughout its lifetime. Upcoming accepts an unknown date; Released requires a valid calendar date before preview/publication. Existing records without `release_stage` retain date-based behavior. Change the same record to Released when ready. Future prepurchase belongs to a separately linked Store Item; this change adds no price, stock, checkout, or preorder behavior. Legacy artist announcement text is retained for recovery, but new announcements use Release records.

Release editors can add ordered singles with a title and HTTPS listening link, and clips with a title and YouTube URL. These fields work for upcoming and released entries. Empty lists leave no section on the public release page. Releases prepare these native JSON fields; content publication remains a separate review step.

The staff interface is built on EmDash's APIs, not a second CMS or a replacement admin backend. EmDash owns content, private drafts, revision conflict checks, references, media, and the reused Portable Text editor. Label-specific forms and publication review coordinate these APIs with the existing commerce services. The native full admin screens are not the staff navigation foundation.

The staff root and logo open Overview. A 72 px top navigation covers Overview, Catalog, Website, Images, Stock and Orders at widths of at least 1440 px. Catalog and Website have optional 256 px contextual sidebars; smaller screens use a labeled Menu drawer. `/content/` opens named website pages; `?view=footer` groups navigation, social links and newsletter. Existing `?collection=…&id=…` links continue to select their editor. `/items/?variantId=…` resolves the editorial/selling relationship and opens the matching catalog destination.

Private editorial drafts autosave after a 1.5-second typing pause. Incomplete drafts are allowed; unsafe input and invalid supplied references are rejected. Save state is distinct from publication state. Older responses never replace newer typing. Failed saves and conflicts retain input and offer recovery. The editor distinguishes `Discard unsaved changes` (browser-local edits), `Discard saved changes` (the current private draft, returning to the live revision), `Move to trash` (News/social links only), and read-only publication history. Price, stock, wording approval and publication remain explicit operations.

Release editors and imports keep the scalar `data.artist` contract. When EmDash binds that field to a native relation, the CMS translates writes to the native selection and projects reads back to the selected Artist. Publication and snapshot export resolve the selected revision's reference metadata in its locale, never a newer draft's artist selection. Legacy column-backed fields remain supported until migrated.

**Publish changes** saves the current edit, checks its exact revision and publishes that item through the existing publication operation. Its adjacent menu offers **Review before publishing** and **Review all saved changes**. Required linked drafts, conflicts and retained operations open the existing review or recovery interface instead of silently broadening the action. Optional list selection supports up to twenty eligible entries. Existing staged selections are recovered for review, never published automatically. Per-entry On the website state must match its accepted snapshot revision.

Creation remains private until a final publish action. Leaving midway retains the autosaved draft; reopening never publishes or enables buying. For a sale item, **Create and publish** follows confirmed price and starting stock, completes setup, then uses shop publication to publish its content and enable buying. **Keep as draft** is the alternative. A website-only release uses **Publish release** without commerce setup.

At widths of at least 1280 px, editors initially show a resizable public appearance preview; visibility is remembered. Smaller screens use Edit/Preview tabs. Hidden previews do no background work. Images remains one flat library; uploading alone does not publish anything. Alt text belongs to its editorial placement.

The [backoffice design reference](backoffice-design.md) and [staff glossary](../UBIQUITOUS_LANGUAGE.md) own the shared vocabulary and update policy. Implementation acceptance is tracked in [the redesign checklist](../openspec/changes/redesign-staff-workspace/tasks.md).

## Staff startup assets

`pnpm build:staff` runs the route-isolation check and `pnpm performance:bundles --scope=staff`. The performance check bounds eager JavaScript and compressed HTML for Overview, Website, Stock and Orders, and rejects initial project stylesheet requests. Initial project CSS is included in authenticated HTML, which remains private and `no-store`; full document navigations therefore retransmit the extra 12–13 KiB of compressed HTML. With warmed assets, private asset responses near 100 ms and throughput of at least 10 Mbps, the conditional estimate is 50–200 ms faster primary content on routine visits. Hosted results can differ, and this estimate does not cover slow first HTML or API responses.

Release and Distro editors have **Details & photos** and **Price & stock** tabs on the same item. **Publish changes** stays in the item header on both tabs and counts what is not live yet: saved details and photos, and the price draft. A typed price saves as an EmDash draft through the `blackbox-editorial` plugin, visible to every member on any device and in **Review changes**; shoppers keep the live price until it is published. Leaving the item never discards a saved draft; **Undo price change** removes it. The publish review lists the price (old and new), the details and, for items on sale, the automatic shop checkout update, with one live confirmation. It then runs the existing price command first, followed by item publication for items on sale (checkout presentation plus website) or content publication otherwise; each step reports and retries separately. Stock adjustments and counts stay immediate (**Update stock now**) and are not part of publishing. A short status line near the top shows shop availability and the live price; stock history expands when needed. The separate Inventory workspace remains available for stocktake rounds. Secondary music, credits and full-text fields use expandable groups; validation opens them when necessary.

In **Photos**, select multiple JPG, PNG or WebP files (up to 20 MB each). Successful files append in order, without replacing the cover or other edits. Failed filenames remain available for retry; successful uploads are not repeated. Use Move up/Move down for gallery ordering. Save and preview privately, then review and publish; uploading never publishes. Existing CMS instances need the additive `releases.gallery` setup in the CMS application migration command before release gallery editing; it preserves stored content and pending drafts.

The catalogue header trials a monochrome WebGL gradient. It is decorative, pauses when hidden or offscreen and falls back to a static CSS gradient for reduced motion or unavailable WebGL. Inputs retain solid backgrounds. The shared stock controls measured 153,047 compressed JavaScript bytes; their route budget is now 150 KiB (1,008 bytes above the previous budget).

## Editorial text formatting

Catalogue search matches titles, slugs and band names: linked Artists for Releases and artist/label credits for Distro. It uses bounded native content pages and continues through empty search pages. Existing area, format and sort choices remain applied; search does not create a separate catalogue index.

Descriptions, biographies, video descriptions, page introductions and stories, quotations, service details/contact notes, newsletter copy and purchase/privacy wording use the existing EmDash Portable Text editor. Paragraphs, line breaks, inline marks, lists, quotations, alignment and safe links survive preview, publication and cards. Unsupported blocks receive validation feedback.

Names, headings, labels, identifiers, URLs, contact details, image alternatives and operational notes remain plain strings. Multiline plain fields retain their line breaks.

Existing top-level scalar prose has optional native `_rich` companions: artist `bio`, release/distro/news `summary`, and newsletter `description`/`note`. The seed generator and explicit native SchemaRegistry setup add these fields without changing old field types. Hosted setup remains part of the existing release process; local implementation does not prepare hosted schemas.

Present rich content is authoritative, including an empty array (deliberately cleared). Missing/null rich content falls back to the old string. Nested prose accepts either strings or text blocks. Opening an editor does not save a conversion. Old strings and revisions remain untouched; there is no bulk migration or rich/plain synchronization. Shared read-time plain-text conversion serves completeness checks, metadata, search, accessible labels and commerce descriptions.

## Set the first selling price

Open an existing item in **Catalog → Selling**, or follow **Selling** from its selected Stock record. An eligible retained item shows **No price yet** and a blank EUR amount. Choose a physical format only when a Release has none; Distro and Merch use their saved group. Comma and point decimal separators are accepted. Typing saves a price draft; **Publish changes** sets the first price through the existing initial-price command.

Initial pricing retains the same item, stock, movement history and pauses. It does not activate sales unless **Put this item on sale in the shop** is ticked in the same publish review.

A draft carries the operation identity and revisions of its first publish attempt, so a retry on any device resends the identical command. If the live price changed since the draft was typed, publishing stops before any command and asks for a new check. A draft that already matches the live price is discarded on the next read.

If initial pricing is interrupted, reopen Selling with the same authorized account and select **Resume**. The server retains the accepted amount and saved presentation under one operation identity, including after browser state is lost. A newer private draft does not replace that accepted input. Other members cannot resume its input. Existing replacement-price and publication operations retain their own recovery controls. For an unsafe legacy binding or an operation marked for review, give its operation reference to a label administrator; do not recreate the item, clear the journal, reseed stock or adopt provider objects. Binding repair and hosted release/live acceptance require their existing separate authorization.

## Private appearance preview

Staff navigation and common actions use the Design Library's Lucide family through existing named `lucide-react` imports. Icons accompany visible labels, remain decorative to screen readers, and share the current shadcn button sizing. The catalog, website pages, images, stock, orders and review workspace keep one consistent icon vocabulary.

New catalog entries and the changes review read saved revision data, including native artist and media references. Initial empty list fields must not replace a member's saved draft in validation or selection.

The staff header owns the single **Review changes** control, including a compact icon on narrow screens. It finishes autosave and opens the current draft's review even when details are incomplete. **All saved changes** opens the shared list. Missing required details block publication; **Show required details** in preview reveals field errors and focuses the first invalid control.

The review list offers **Discard selected changes** and **Discard all changes**. Confirmation lists the exact entries and outcomes. Published entries discard their private draft; never-published Artists, Releases, News and social links move to native trash. Selling-linked entries and pending publications cannot be discarded. The operation uses each reviewed revision and stops at the first conflict or failure, retaining remaining work. All-change preparation is bounded to 100 entries; larger sets use selections of up to 20. Nothing is permanently deleted or published.

Staff uses native wheel movement through forms and rich-text controls. Returning to a tab or application does not refresh workspace lists. Reconnection and pending-publication status still check the server. The review action uses an adapted MIT-licensed [Cult UI Texture Button](https://www.cult-ui.com/docs/components/texture-button), with staff color tokens and the existing shadcn Button's focus and disabled behavior.

UAT Staff and Preview use the same Access application audience in `apps/backend/cms-resources.json`. Configure both exact hostnames (`staff-uat.blackboxrecordsathens.com` and `preview-uat.blackboxrecordsathens.com`) on **BlackBox Records Staff UAT**, with **Eager redirect cookie** enabled. Cloudflare then sets both authorization cookies during the initial Google sign-in. Keep the Google provider, existing member allowlist and 24-hour application session unchanged. The two browser origins remain separate; the Worker still requires a verified human email and matching preview-context owner. Publication service tokens do not grant draft-preview access.

This requires a coordinated Access configuration change and UAT Worker deployment; a build does not provision Access. Remove the redundant **BlackBox Records Preview UAT** application when transferring its hostname. Retain its configuration in the change evidence before removal. A mismatched audience fails closed until both sides agree. Test from a fresh Staff sign-in without first visiting Preview, then check frame readiness, gallery images, retry and tab switching in Firefox and Chromium. The separate-tab connection recovery is for missing or expired sessions, not the expected daily workflow.

PRD still uses its existing separate audiences. Its consolidation must accompany a separately approved PRD promotion; do not change PRD Access while its Worker expects the old audience. Cloudflare's [multi-domain authorization cookie documentation](https://developers.cloudflare.com/cloudflare-one/access-controls/applications/http-apps/authorization-cookie/#multi-domain-applications) describes the eager redirect flow.

Authenticated `POST /_emdash/preview` selects unsaved editorial input or exact saved review revisions over the accepted snapshot. It returns a private document URL. The existing `PUBLIC_SITE` service renders the actual public routes, shell, components, assets and hydration; preview content never enters accepted-page caches or changes the accepted snapshot. No draft save, revision or publication is created.

Local staff uses `127.0.0.1` and the preview uses `localhost` on the same CMS port. Hosted environments require a separate `preview_hostname` and `preview_access_policy_aud` in their existing CMS resource configuration, with Access configured for that hostname. These values are not provisioned by a build. Preview creation fails closed until configured. Each private page, media and shopper-read request verifies Access and context ownership. Contexts expire after fifteen minutes and are bounded to sixteen contexts and 8 MiB of serialized data per CMS object. Capacity errors offer retry; closing/replacing a frame releases its context. No KV, session store or persistent preview state is added.

Input is capped at 256 KiB and rendered HTML at 4 MiB. The iframe loads a real URL with scripts and same-origin sandbox permissions, on an origin separate from staff. CSP permits public code, protected images, approved fonts and player frames; checkout, delivery, privileged APIs, form delivery and outside connections remain blocked. Shopper GET routes use the existing API clients through a narrow private proxy. Cart state stays in frame memory. Draft media resolves only from the selected content, including immutable accepted images; arbitrary image transforms and upstream URLs are denied. Responses use private no-store, noindex and no-referrer.

Only visible editorial edits wait for a 750 ms typing pause. Opening, changing context and retry start immediately. Validated messages check origin, source window, context and generation. Public hydration, styles and initial images must be ready before the replacement frame becomes visible; failed or superseded replacements retain the last successful rendering. A thirty-second deadline offers retry. Fit fills the pane; Desktop and Mobile use actual 1280 px and 390 px iframe widths. Expand contains keyboard focus and restores it on close. Scroll survives edits; changing context resets it. Hiding the preview panel stops work and releases its context. A temporarily hidden browser tab keeps the last successful frame; returning sends no preview request while its context remains valid and refreshes it as the fifteen-minute server expiry approaches.

Public navigation, overlays, filtering and playback run inside the selected context. Page sections use full pages; artists/releases/news/distro offer detail and listing contexts. Navigation, label details, socials and newsletter use homepage header/footer/newsletter context. New Distro detail uses the projected Store Item URL; a new Release does not acquire an invented buy link. Unrelated drafts remain excluded. Refresh preview loads other changes explicitly. Diagnostics identify the public renderer release.

Run `node --import tsx apps/backend/scripts/smoke-content-preview.mjs --browsers` against Local for all collection destinations and browser asset checks. `PREVIEW_STAFF_ORIGIN=http://127.0.0.1:8799` selects an isolated fixture when another worktree owns the canonical port. Hosted verification requires separate authorization and configured Access; Local evidence does not establish UAT/PRD rollout.

## Publication visibility

The standalone review loads the same preview layout styles as the editor. Responsive images finish loading their selected source before decoding, including when the frame width changes during loading. Returning from another tab or application retains the reviewed revision and Publish action; reconnecting or a confirmed editorial-change event requires fresh review. The server still rejects stale revisions at publication time.

Workspace reads check the accepted R2 pointer on every request. The CMS object retains only one verified manifest, keyed by bucket, environment and checksum (at most 4 MiB of manifest input). A warm match saves one manifest read and parse; drafts, pending publications and commerce still read fresh. Missing pointers remove accepted state; unreadable pointers or invalid new manifests fail the request without stale fallback. Object eviction simply causes a verified reload.

Protected hashed `/_astro/` scripts, styles and fonts with ETags use `private, no-cache, must-revalidate`. Browsers may retain their bytes but must revalidate after authentication before reuse; no freshness TTL or offline reuse is enabled. Staff HTML, APIs, private media, errors and cookie-setting responses remain `private, no-store`. The combined-artifact `test:staff-hosting` smoke checks conditional GET/HEAD and denied access. Rollback restores the asset no-store override and removes the object's manifest slot; no purge or new resource is needed.

## Compact staff thumbnails

EmDash remains the owner of original media. The CMS Worker owns only the private display derivative in the existing `MEDIA` R2 binding:

- Original keys use flat JPEG, PNG or WebP names up to 200 characters. Safe Unicode and punctuation are supported; path separators, control characters and malformed Unicode are rejected. Derivatives use `staff-thumbnails/v1/<original-storage-key>.png`.
- The authenticated route is `/_emdash/api/blackbox/thumbnails/<encoded-original-storage-key>`. It serves private, no-store `image/png` responses at most 96 × 96 pixels and 40 KiB. It has no D1 record, CMS content field, KV binding or public URL.
- Compact Content and Stock rows use this route. Full editor/media previews continue to use the native original route.
- New uploads must include a valid PNG thumbnail. The browser reduces it until it is at most 96 × 96 pixels and 40 KiB; the Worker validates it again. EmDash uses the submitted thumbnail for its low-quality placeholder, while the Worker stores the same bytes as a separate private derivative.
- The original media upload remains successful if the separate derivative write fails. The failure is logged for later backfill. Originals are never replaced or deleted by thumbnail repair.
- The EmDash media audit compares image records in D1 with original and derivative objects in R2. It reports missing originals, unsupported keys, missing thumbnails and invalid thumbnails separately.

The bounded Local audit and preparation commands are:

```sh
pnpm --filter @blackbox/backend exec node --import tsx scripts/prepare-staff-thumbnails.mjs --env local --limit 25
pnpm --filter @blackbox/backend exec node --import tsx scripts/prepare-staff-thumbnails.mjs --env local --limit 25 --apply
pnpm --filter @blackbox/backend exec node --import tsx scripts/prepare-staff-thumbnails.mjs --env local --audit-media --media-limit 25 --hash-originals
```

The default is a dry run. `--limit` and `--media-limit` accept 1–25; `--max-bytes` accepts 1–67,108,864 and defaults to 67,108,864. Use `--start-after <last-key>` to resume an R2 page across separate invocations. This avoids a Local R2 cursor that can repeat an earlier page after a process restarts. The script stops safely if a page does not advance. `--audit-media` reads one bounded D1 page and checks its R2 originals and derivatives without writing; resume with `--media-after <id>`. Add `--hash-originals` to compute SHA-256 values from original bytes for before/after preservation checks; it adds at most 25 original GETs per page and respects `--max-bytes`. The backfill binds only `MEDIA`; the audit binds `CMS_DB` and `MEDIA` for reads only. `--apply` is only for the R2 backfill and adds at most 25 derivative PUTs. Original ETags are checked before source reads, and every write targets the derivative prefix.

Local inventory on 2026-09-25 found 149 image records: 25 already had valid thumbnails and 124 were missing derivatives. All 149 originals existed, with no unsupported keys or invalid derivatives. The bounded repair wrote 124 thumbnails and skipped one non-image R2 object. A second audit found 149 valid thumbnails; all 149 original SHA-256 hashes matched the pre-repair inventory.

Before any UAT or PRD audit/backfill, review account-wide Free-tier usage and headroom. Hosted commands also require `--hosted-budget-reviewed`; an applied page additionally requires the one-run `--apply` flag. Run the bounded audit and backfill in UAT first, then PRD after UAT succeeds. Hosted inventory and writes have not been run by this local implementation.

### Preparation operation worksheet

| Operation                  | Bounded Local/hosted estimate                                                                                                                              |
| -------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| R2 reads per backfill page | 1 LIST + at most 25 derivative HEADs + 25 derivative GETs + 25 original GETs; each source is capped at 20 MiB and 64 MiB cumulative by default             |
| R2 reads per media audit   | At most 25 original HEADs + 25 derivative HEADs + 25 derivative GETs; optional 25 original GETs to hash bytes; one D1 query page (at most 26 rows fetched) |
| R2 writes per applied page | At most 25 derivative PUTs; each derivative is at most 40 KiB                                                                                              |
| Derivative storage         | Existing `MEDIA` storage only; no new bucket, binding, D1 row, KV write or session                                                                         |

## Public image delivery

Accepted snapshot images use the existing public `/media/content/<snapshot-hash>/<media-hash>` route. In UAT and PRD, the `/_image` renderer may request a Cloudflare Images URL transformation from `images.blackboxrecordsathens.com`, using the site's finite existing responsive widths and `format=auto`. Originals stay in environment-owned R2 snapshot storage. The renderer rejects unapproved source hosts, paths and widths and returns the verified original when transformation fails. Local leaves the transformation hostname unset.

Cloudflare Images Free transforms images from R2-backed Pages URLs on demand; it does not store or replace originals. Cloudflare counts one unique source-and-options combination per month, up to 5,000 free transformations. After that limit, new variants can fail, so the public renderer falls back to the original. The transformation zone must allow only `https://blackbox-records-web-uat.pages.dev` and `https://blackbox-records-web.pages.dev` as source origins, restricted to the `/media/content/` path where the dashboard supports a path restriction. Configure the `images.blackboxrecordsathens.com` hostname and those origins in the Cloudflare Images Transformations settings before hosted rollout. See [Images pricing](https://developers.cloudflare.com/images/pricing/) and [source origins](https://developers.cloudflare.com/images/optimization/transformations/sources/).

Workers Caching is enabled only for the named public image entrypoint. The default renderer stays uncached, and accepted image responses use immutable content-addressed URLs with `Vary: Accept`. HTML, previews, errors, staff media and the CMS Worker keep their existing no-store behavior. The Cloudflare Workers Free limit is 100,000 incoming requests per day; cache hits still count as Worker requests. Static repository images continue through Astro and Pages. See [Workers caching configuration](https://developers.cloudflare.com/workers/cache/configuration/) and [Workers limits](https://developers.cloudflare.com/workers/platform/limits/).
| Backup overhead | CMS media backups that include `MEDIA` must budget each retained derivative blob and its manifest/blob metadata in addition to existing originals; do not run a backup as part of preparation |
| Hosted gate | Current account-wide Free-tier usage, ordinary-service headroom, remote proxy/background overhead, and explicit one-run authorization are required before UAT/PRD |

Rollback is a code change, not an original-media operation: restore the previous staff bundle/Worker route and compact rows return to their prior original-media behavior. Leave already-created `staff-thumbnails/v1/` objects untouched unless a separately authorized storage cleanup has an inventory and budget; never delete the native originals as rollback.

The top status control opens recent history in a desktop Popover or mobile Sheet. A contextual Check status action recovers a failed or timed-out check. Pending requests poll every two seconds for the first minute, then every thirty seconds while visible, up to thirty minutes. Returning to the page checks immediately. Checks share one in-flight request. Accepted requests never imply the site is live.

Publication review retains selected saved entries with their exact revisions and a browser-retained request ID. `Publish changes` journals that selection, prepares an immutable snapshot replacing only those entries, validates it through the public renderer, and atomically activates it. The API remains atomic for a maximum batch of twenty; failed operations retain their identity for recovery. New typing and unrelated drafts stay private. Existing staged selections are carried into review without publishing automatically. Images already in the accepted snapshot are reused. A Durable Object alarm resumes interrupted work. On the website means the accepted snapshot contains that entry's reviewed revision. No GitHub build or deployment runs for content publication. Shop publication remains an explicit, safety-gated Catalog action.

Code releases still use the reviewed UAT candidate and retained PRD artifact. See [publication operation and recovery](content-publication.md) for budgets, failure behavior and Local checks.

## Component sources

- Official [shadcn New York registry](https://ui.shadcn.com/docs/components): Sidebar, Table, InputGroup, Breadcrumb, ButtonGroup, Field, NativeSelect, Checkbox, Command/Popover combobox, DropdownMenu, AlertDialog, Alert, Sheet, AspectRatio, Tooltip, Skeleton, Empty, ScrollArea, ToggleGroup, Collapsible, Accordion and supporting components.
- [blocks.so File Upload Simple](https://blocks.so/file-upload/file-upload-02): adapted native file input, label and help presentation. Uploads call the existing `uploadArtwork` helper.
- EmDash 0.38's existing Portable Text editor remains the rich-text engine.

MIT notices are retained alongside the copied components. Staff registry configuration lives in `apps/staff/components.json`; the `cn` utility the components share sits beside them at `apps/staff/src/components/ui/utils.ts`. Generated imports use relative paths to avoid the repository-wide lint resolver confusing the staff and public `@/` aliases.

Local adaptations: 1440 px navigation breakpoint, no global sidebar keyboard shortcut, staff touch targets, strict TypeScript compatibility and existing dark tokens. EmDash CSS is loaded into a lower-priority cascade layer so its bundled utility classes cannot override the staff app's responsive classes.

Pages and catalog browsing load editing, selling, preview and publication-review features only when opened. Rich-text and image-library styles travel inside their lazy feature, with loading and failure feedback. Initial content navigation shows loading until its destination and results are known; an unavailable first read does not claim an empty collection.

Overview requests `blackbox/workspace?view=overview`. It reads five recent candidates per collection through the native content repository, checks current accepted revisions and pending publications, and returns up to twenty unpublished entries without commerce or general list enrichment. Review changes remains the complete paginated discovery view. Each Overview panel shares concurrent initial/retry/refresh reads and retains settled results, including empty results, while checking for updates or reporting a refresh failure.

Stock resolves URL and recovery state before its first inventory read. Entry, filter and page reads start immediately; only text typing waits for the existing 300 ms debounce. Hidden/offline pauses, stale-response guards and unfinished count protection still apply. Local regression results do not establish hosted navigation latency; UAT smoke and the separately approved PRD sample remain release acceptance.

## Verification

Run the normal unit, check and build gates. For the focused browser regression:

```sh
pnpm build:staff
node scripts/test-preview-policy.mjs
node scripts/test-content-workspace.mjs
node scripts/test-content-workspace.mjs --firefox
node --import tsx scripts/test-content-workspace.mjs --selling
```

This serves the built staff app with in-memory API fixtures on loopback, uses the existing Playwright dependency, and writes screenshots to ignored `.codex-artifacts/content-workspace/`. It never contacts hosted CMS, D1, R2, Stripe or publication workflows. It tests frontend integration; existing backend tests remain responsible for provider and publication contracts.

For manual browser inspection, run `node scripts/test-content-workspace.mjs --serve` and open `http://127.0.0.1:4399/content/`. Add `--selling` for the retained-item fixture; set `BLACKBOX_FIXTURE_PORT` when another worktree owns 4399. Fixture writes last only until the process stops.

For real-renderer verification, build the CMS and public runtime, run the Local stack, then run `node --import tsx apps/backend/scripts/smoke-content-preview.mjs`. This loopback-only smoke previews every seeded collection, checks protected images, denied writes and released contexts, reports latency/bytes, and verifies drafts and publication history remain unchanged. Add `--browsers` for Chromium/Firefox rendering, paired public/preview screenshots and editor autosave. That UI phase restores its original newsletter draft and never publishes it. The CMS build validates source and generated no-KV configuration. Hosted verification remains separate.

## Failure diagnostics

The preview document carries the production CSP as a response header. Its frame-ancestors directive names the validated staff origin, including the Local port. Both browser fixtures use this policy with real cross-origin documents. Public scripts and approved player frames run on the isolated origin; real writes and outside connections remain denied.

Creation responses include `X-Preview-Request-Id` and a validated `X-Preview-Generation`. Document responses and readiness messages identify the public renderer with `X-Release-SHA`. In Worker Observability, filter `event` to `preview_render` or `preview_browser_failure`, then `requestId` to the copied reference. Render logs include status, milliseconds, generation and renderer release. Browser failures identify requested/displayed generations, readiness and the failed stage without editorial data. A successful render log alone does not establish successful browser rendering.

The displayed frame must match current editor inputs before reporting Preview up to date. Public fonts explicitly configured with `font-display: optional` may use their normal fallback after Firefox's display deadline; that does not invalidate the rendering. Required fonts, styles and images still gate readiness. Neither CSP nor public font configuration is broadened for this behavior.

Authenticated `POST /_emdash/preview-diagnostics` requires editor role, same-origin and `X-EmDash-Request: 1`. Strict 4 KB input; ten reports per minute/member; a bounded 1000-entry in-memory map resets on eviction/restart. No retry, KV, database write or new service. Reports exclude content, HTML, private media names, URL queries and credentials. Copy diagnostic details appears only with errors. Reporting failures do not affect editing. Cloudflare retention and account log allowances apply; do not promise permanent history.

Before mounting a replacement iframe, the editor checks `/_preview/session` on the isolated preview origin with credentials, redirects rejected, and an eight-second deadline. The authenticated response permits CORS only for the configured staff origin. If access or the connection fails, the editor offers **Sign in to preview (new tab)** and **Retry preview**, retains the previous rendering, and reports `stage: access`. The sign-in tab contains no draft content and instructs the member to return and retry. This avoids attempting to embed Cloudflare's login page, whose `frame-ancestors 'none'` policy is preserved. Find these reports in **Compute → Observability**; the separate paid Log Explorer is not required.

Staff `/` and the logo lead to Overview. UAT has one Test environment badge; preview limitations live in About preview. Save state appears once and remains distinct from publication status. Essential image, stock, order and publication handoff guidance remains visible.

The [living backoffice design reference](backoffice-design.md) owns shared patterns and the proposed next improvements for Content, Images, Items, Stock and Orders.

## Growing catalog and stocktakes

Distro & merch uses EmDash field filtering and cursor pagination: All, Distro, Merch and existing format groups, with title/recently edited sorting and 25-entry pages. Filters apply before pagination. No new taxonomy or public category is created.

Catalog paging appears above and below the results. Previous and Next change the batch; `Back to <destination>` leaves the task. A successful page change brings the results heading into view and focuses it. Position text describes the current page, never a scanned total. A copied cursor URL cannot establish its page number or predecessor, so it offers First page instead of an invented Previous destination. Failed reads retain the last successful batch and offer Retry page; empty filters offer Reset filters.

Browser Back/Forward and same-tab reload retain the addressable criteria and known cursor trail. Editor Back prefers the originating list or Review changes and restores its row and scroll position. Direct editor links have named collection or Website parents; workspace roots fall back to Overview. Return metadata is navigation-only, same-origin, bounded, and optional. It is not forwarded to workspace APIs or used as content, stock, or order authority.

Back waits for the latest editorial autosave, including typing made during a save. Failed or conflicting saves retain the editor and recovery options. Unfinished stock inputs still use their existing leave prompt; uncertain operations keep their recovery identities. Closing Images or Publication history panels and moving to the previous setup step remain local actions, separate from leaving the task.

Stock uses the available width for thumbnail rows and quantities. Selection opens a 420 px task panel at 1280 px and above; smaller screens open a focused task with Back to inventory. Search and filters operate on the complete operational result set. Legacy CD/Tape labels remain stored unchanged and match CDs/Tapes filters.

Start stocktake captures a fixed sequence from the selected group using bounded inventory pages. Record count and next confirms one existing revision-protected stock count at a time. Previous, Skip for now and Finish stocktake retain explicit control. Same-tab session storage remembers progress, not authoritative stock. Unconfirmed counts preserve their baseline and entered values for recovery; a changed baseline requires reassessment. New arrivals enter the next stocktake.

EmDash's exported ContentRepository resolves editorial links in batches. Stock remains authoritative in the commerce repository. Artwork enrichment failure must not hide inventory. Browsing adds no schema writes: an administrator-only, same-origin POST to `/_emdash/api/blackbox/catalog-schema` prepares optional Distro Bandcamp/Tidal URL fields, the Distro group index, and title sorting through EmDash SchemaRegistry. Local startup performs this idempotent setup; UAT and PRD releases run the same setup with `cms:catalog-schema` after EmDash core migrations and before deploying the CMS. New databases receive the fields through the seed schema.

Acceptance includes 250+ entries, real Local EmDash reads and Chromium/Firefox checks. Hosted validation and rollout remain separate.

## Website changes review (September 2026 refinement)

Staff utilities and Overview open `/review/`. This supersedes the list-checkbox publication queue. Review discovers saved unpublished Website and Catalog entries through the EmDash workspace adapter, with search, area filters and up to 25 entries per page. Selection persists in the same tab, up to 20 entries across pages. Incomplete drafts remain visible with editing links. A final review checks saved versions; a changed version requires renewed review. The editor's Review changes shortcut finishes autosave and opens an individual review without replacing grouped selection. One selected entry uses Publish change; several use Publish N changes.

Batch publication includes selling-linked entries but does not activate the shop, apply price drafts, or change stock. Entries with a price draft show it and link to the item, whose own publish review applies the price, the checkout presentation and a first sale. Pending request identities survive response loss; failed operations require a fresh review. The batch service accepts all reviewed entries in one website update.

Count stock and Finish counting replace visible Stocktake wording; internal storage identities remain compatible. Quantities read Available to buy online, with copies for music and units for merchandise. The online quantity is how many customers may buy through the website.

Review discovery uses bounded native EmDash cursor reads and existing accepted-snapshot comparisons, never private CMS table queries. The client follows sparse continuations until its page fills or reaches the end, cancelling stale searches. It does not load the entire library into browser memory or poll a global draft count. Hosted rollout still requires a Free-tier cost preflight.

## Guided publication review

The approved B direction uses Select → Review → Publish. Individual Review changes finishes autosave and stays inside the editor; Back to editing preserves its buffer and the separate grouped selection. Group selection at `/review/` retains search, area filters, pagination and the twenty-entry limit. Incomplete entries keep editing links and validation messages.

Expandable entry comparisons label On the website and After publishing, with readable text, formatted content, images, descriptions, links and ordered lists. New entries say Not yet published. Explicitly include required unpublished references and review again. Already-published references use accepted website content even when newer drafts exist.

At 1280px and above, comparisons sit beside the private interactive preview from the public renderer. Opening one comparison entry controls the preview target; the preview selector is removed. Shared website changes preview the homepage. Smaller widths use keyboard-accessible Changes/Preview tabs. The existing staff header, branding, tokens and shadcn controls remain; a blue Review changes action with an icon and 44px targets identify the primary path. Publication history opens from the staff menu in a right-side panel with readable status badges, requested time and expandable details. A sticky action bar shows destination, count and Publish change/Publish N changes without another confirmation dialog.

Preparing, Checking website and Confirming publication reflect backend stages. Only confirmed public content says On the website. Check status recovers uncertain outcomes; terminal preparation failures return to review. A failed visual preview can be retried or explicitly bypassed, while mandatory server checks remain. Read-only history supports older pages and entry filtering, with unavailable legacy details labeled honestly.

Price, stock, shop activation and launch approvals keep their existing ownership. There is no scheduling, undo, restoration or approval-role workflow. Hosted rollout requires the existing Cloudflare Free-tier preflight and separately authorized bounded UAT acceptance.

## Optional tracklists

Release and Distro editors offer a structured Tracklist field. Choose the physical edition: vinyl/cassette uses ordered sides with A–Z side letters; CD uses ordered discs. Add tracks with a title and optional minutes:seconds duration, then use the move buttons to order tracks and groups. Track positions are generated (A1/B1 or disc/track numbers). Changing format keeps all tracks in the first side or disc for review. Remove tracklist clears the optional value.

Incomplete tracks can be saved privately; publication requires valid titles, durations and unique side letters. Empty or absent tracklists render no public section. The Store Item displays a tracklist only when its physical format matches. Tracklists are embedded editorial JSON, outside stock, price and checkout authority. Existing content and snapshots remain valid without them. Explicit Local catalogue-schema setup adds the native JSON fields and is safe to repeat; hosted setup follows the existing separately authorized workflow.

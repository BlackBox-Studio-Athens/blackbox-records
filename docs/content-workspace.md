# Staff editorial workspace

The staff interface is built on EmDash's APIs, not a second CMS or a replacement admin backend. EmDash owns content, private drafts, revision conflict checks, references, media, and the reused Portable Text editor. Label-specific forms and publication review coordinate these APIs with the existing commerce services. The native full admin screens are not the staff navigation foundation.

The staff root and logo open Overview. A 72 px top navigation covers Overview, Catalog, Website, Images, Stock and Orders at widths of at least 1440 px. Catalog and Website have optional 256 px contextual sidebars; smaller screens use a labeled Menu drawer. `/content/` opens named website pages; `?view=footer` groups navigation, social links and newsletter. Existing `?collection=…&id=…` links continue to select their editor. `/items/?variantId=…` resolves the editorial/selling relationship and opens the matching catalog destination.

Private editorial drafts autosave after a 1.5-second typing pause. Incomplete drafts are allowed; unsafe input and invalid supplied references are rejected. Save state is distinct from publication state. Older responses never replace newer typing. Failed saves and conflicts retain input and offer recovery. The editor distinguishes `Discard unsaved changes` (browser-local edits), `Discard saved changes` (the current private draft, returning to the live revision), `Move to trash` (News/social links only), and read-only publication history. Price, stock, wording approval and publication remain explicit operations.

Publish changes opens a review of the exact saved version. Optional list selection supports up to twenty eligible entries. Existing staged selections are recovered for review, never published automatically. The old persistent staging toolbar, Edit → Stage → Publish landing panel and routine Refresh controls are superseded. Per-entry On the website state must match its accepted snapshot revision.

At widths of at least 1280 px, editors initially show a resizable public appearance preview; visibility is remembered. Smaller screens use Edit/Preview tabs. Hidden previews do no background work. Images remains one flat library; uploading alone does not publish anything. Alt text belongs to its editorial placement.

The [backoffice design reference](backoffice-design.md) and [staff glossary](../UBIQUITOUS_LANGUAGE.md) own the shared vocabulary and update policy. Implementation acceptance is tracked in [the redesign checklist](../openspec/changes/redesign-staff-workspace/tasks.md).

For Distro items, order **More images** with the existing Move up/Move down controls. The first extra photo different from the main image appears on hover or keyboard focus. All gallery photos appear on the item page. Save and preview privately, then review and publish to update the public order; the main image stays unchanged.

## Editorial text formatting

Descriptions, biographies, video descriptions, page introductions and stories, quotations, service details/contact notes, newsletter copy and purchase/privacy wording use the existing EmDash Portable Text editor. Paragraphs, line breaks, inline marks, lists, quotations, alignment and safe links survive preview, publication and cards. Unsupported blocks receive validation feedback.

Names, headings, labels, identifiers, URLs, contact details, image alternatives and operational notes remain plain strings. Multiline plain fields retain their line breaks.

Existing top-level scalar prose has optional native `_rich` companions: artist `bio`, release/distro/news `summary`, and newsletter `description`/`note`. The seed generator and explicit native SchemaRegistry setup add these fields without changing old field types. Hosted setup remains part of the existing release process; local implementation does not prepare hosted schemas.

Present rich content is authoritative, including an empty array (deliberately cleared). Missing/null rich content falls back to the old string. Nested prose accepts either strings or text blocks. Opening an editor does not save a conversion. Old strings and revisions remain untouched; there is no bulk migration or rich/plain synchronization. Shared read-time plain-text conversion serves completeness checks, metadata, search, accessible labels and commerce descriptions.

## Set the first selling price

Open an existing item in **Catalog → Selling**, or follow **Selling** from its selected Stock record. An eligible retained item shows **No price set**, a blank EUR amount and **Set price**. Choose a physical format only when a Release has none; Distro and Merch use their saved group. Comma and point decimal separators are accepted. Save missing editorial details in Details first. Configured items keep **Change price**, even while an unrelated private draft is incomplete.

Initial pricing retains the same item, stock, movement history and pauses. It does not publish content or activate sales. Complete price setup before the separate **Publish item** step; ordinary editorial **Review changes** remains independent.

On a conflict, the entered amount and reviewed version stay in the form. **Refresh** asks before discarding unsaved values. After confirmation, **Price saved** remains visible even if the follow-up read fails; use Refresh rather than submitting again. Unsent amounts are not retained across navigation or reloads.

If initial pricing is interrupted, reopen Selling with the same authorized account and select **Resume**. The server retains the accepted amount and saved presentation under one operation identity, including after browser state is lost. A newer private draft does not replace that accepted input. Other members cannot resume its input. Existing replacement-price and publication operations retain their own recovery controls. For an unsafe legacy binding or an operation marked for review, give its operation reference to a label administrator; do not recreate the item, clear the journal, reseed stock or adopt provider objects. Binding repair and hosted release/live acceptance require their existing separate authorization.

## Private appearance preview

Authenticated `POST /_emdash/preview` selects unsaved editorial input or exact saved review revisions over the accepted snapshot. It returns a private document URL. The existing `PUBLIC_SITE` service renders the actual public routes, shell, components, assets and hydration; preview content never enters accepted-page caches or changes the accepted snapshot. No draft save, revision or publication is created.

Local staff uses `127.0.0.1` and the preview uses `localhost` on the same CMS port. Hosted environments require a separate `preview_hostname` and `preview_access_policy_aud` in their existing CMS resource configuration, with Access configured for that hostname. These values are not provisioned by a build. Preview creation fails closed until configured. Each private page, media and shopper-read request verifies Access and context ownership. Contexts expire after fifteen minutes and are bounded to sixteen contexts and 8 MiB of serialized data per CMS object. Capacity errors offer retry; closing/replacing a frame releases its context. No KV, session store or persistent preview state is added.

Input is capped at 256 KiB and rendered HTML at 4 MiB. The iframe loads a real URL with scripts and same-origin sandbox permissions, on an origin separate from staff. CSP permits public code, protected images, approved fonts and player frames; checkout, delivery, privileged APIs, form delivery and outside connections remain blocked. Shopper GET routes use the existing API clients through a narrow private proxy. Cart state stays in frame memory. Draft media resolves only from the selected content, including immutable accepted images; arbitrary image transforms and upstream URLs are denied. Responses use private no-store, noindex and no-referrer.

Only visible editorial edits wait for a 750 ms typing pause. Opening, changing context and retry start immediately. Validated messages check origin, source window, context and generation. Public hydration, styles and initial images must be ready before the replacement frame becomes visible; failed or superseded replacements retain the last successful rendering. A thirty-second deadline offers retry. Fit fills the pane; Desktop and Mobile use actual 1280 px and 390 px iframe widths. Expand contains keyboard focus and restores it on close. Scroll survives edits; changing context resets it. Hidden frames stop work and release their contexts.

Public navigation, overlays, filtering and playback run inside the selected context. Page sections use full pages; artists/releases/news/distro offer detail and listing contexts. Navigation, label details, socials and newsletter use homepage header/footer/newsletter context. New Distro detail uses the projected Store Item URL; a new Release does not acquire an invented buy link. Unrelated drafts remain excluded. Refresh preview loads other changes explicitly. Diagnostics identify the public renderer release.

Run `node --import tsx apps/backend/scripts/smoke-content-preview.mjs --browsers` against Local for all collection destinations and browser asset checks. `PREVIEW_STAFF_ORIGIN=http://127.0.0.1:8799` selects an isolated fixture when another worktree owns the canonical port. Hosted verification requires separate authorization and configured Access; Local evidence does not establish UAT/PRD rollout.

## Publication visibility

Workspace reads check the accepted R2 pointer on every request. The CMS object retains only one verified manifest, keyed by bucket, environment and checksum (at most 4 MiB of manifest input). A warm match saves one manifest read and parse; drafts, pending publications and commerce still read fresh. Missing pointers remove accepted state; unreadable pointers or invalid new manifests fail the request without stale fallback. Object eviction simply causes a verified reload.

Protected hashed `/_astro/` scripts, styles and fonts with ETags use `private, no-cache, must-revalidate`. Browsers may retain their bytes but must revalidate after authentication before reuse; no freshness TTL or offline reuse is enabled. Staff HTML, APIs, private media, errors and cookie-setting responses remain `private, no-store`. The combined-artifact `test:staff-hosting` smoke checks conditional GET/HEAD and denied access. Rollback restores the asset no-store override and removes the object's manifest slot; no purge or new resource is needed.

## Compact staff thumbnails

EmDash remains the owner of original media. The CMS Worker owns only the private display derivative in the existing `MEDIA` R2 binding:

- Original keys are flat native media filenames. Derivatives use `staff-thumbnails/v1/<original-storage-key>.png`.
- The authenticated route is `/_emdash/api/blackbox/thumbnails/<encoded-original-storage-key>`. It serves private, no-store `image/png` responses at most 96 × 96 pixels and 40 KiB. It has no D1 record, CMS content field, KV binding or public URL.
- Compact Content and Stock rows use this route. Full editor/media previews continue to use the native original route.
- A missing or invalid derivative shows the existing fixed-size placeholder and does not retry or request the original. An upload keeps the native POST status/body; its validated optional thumbnail is stored only after the native write succeeds, and a derivative write failure does not undo the original upload.

The bounded Local preparation commands are:

```sh
pnpm --filter @blackbox/backend exec node --import tsx scripts/prepare-staff-thumbnails.mjs --env local --limit 25
pnpm --filter @blackbox/backend exec node --import tsx scripts/prepare-staff-thumbnails.mjs --env local --limit 25 --apply
```

The default is a dry run. `--limit` accepts 1–25, `--max-bytes` accepts 1–67,108,864 and defaults to 67,108,864, and `--cursor` resumes one opaque R2 list page. Every invocation performs one list page only. Hosted UAT/PRD preparation must use the same bounded commands with `--env uat|prd` plus `--hosted-budget-reviewed`; review the account-wide Free-tier worksheet before any hosted run. `--apply` adds at most 25 derivative PUTs. The script binds only `MEDIA`, never executes backups or SQL, compares each original ETag before reading, and retains the input cursor when a page is interrupted.

### Preparation operation worksheet

| Operation                  | Bounded Local/hosted estimate                                                                                                                                                                 |
| -------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| R2 reads per page          | 1 LIST + at most 25 derivative HEADs + 25 original GETs; original reads are capped at 20 MiB each and 64 MiB cumulative by default                                                            |
| R2 writes per applied page | At most 25 derivative PUTs; each derivative is at most 40 KiB                                                                                                                                 |
| Derivative storage         | Existing `MEDIA` storage only; no new bucket, binding, D1 row, KV write or session                                                                                                            |
| Backup overhead            | CMS media backups that include `MEDIA` must budget each retained derivative blob and its manifest/blob metadata in addition to existing originals; do not run a backup as part of preparation |
| Hosted gate                | Current account-wide Free-tier usage, ordinary-service headroom, remote proxy/background overhead, and explicit one-run authorization are required before UAT/PRD                             |

Rollback is a code change, not an original-media operation: restore the previous staff bundle/Worker route and compact rows return to their prior original-media behavior. Leave already-created `staff-thumbnails/v1/` objects untouched unless a separately authorized storage cleanup has an inventory and budget; never delete the native originals as rollback.

The top status control opens recent history in a desktop Popover or mobile Sheet. A contextual Check status action recovers a failed or timed-out check. Pending requests poll every two seconds for the first minute, then every thirty seconds while visible, up to thirty minutes. Returning to the page checks immediately. Checks share one in-flight request. Accepted requests never imply the site is live.

Publication review retains selected saved entries with their exact revisions and a browser-retained request ID. `Publish changes` journals that selection, prepares an immutable snapshot replacing only those entries, validates it through the public renderer, and atomically activates it. The API remains atomic for a maximum batch of twenty; failed operations retain their identity for recovery. New typing and unrelated drafts stay private. Existing staged selections are carried into review without publishing automatically. Images already in the accepted snapshot are reused. A Durable Object alarm resumes interrupted work. On the website means the accepted snapshot contains that entry's reviewed revision. No GitHub build or deployment runs for content publication. Shop publication remains an explicit, safety-gated Catalog action.

Code releases still use the reviewed UAT candidate and retained PRD artifact. See [publication operation and recovery](content-publication.md) for budgets, failure behavior and Local checks.

## Component sources

- Official [shadcn New York registry](https://ui.shadcn.com/docs/components): Sidebar, Table, InputGroup, Breadcrumb, ButtonGroup, Field, NativeSelect, Checkbox, Command/Popover combobox, DropdownMenu, AlertDialog, Alert, Sheet, AspectRatio, Tooltip, Skeleton, Empty, ScrollArea, ToggleGroup, Collapsible, Accordion and supporting components.
- [blocks.so File Upload Simple](https://blocks.so/file-upload/file-upload-02): adapted native file input, label and help presentation. Uploads call the existing `uploadArtwork` helper.
- EmDash 0.38's existing Portable Text editor remains the rich-text engine.

MIT notices are retained alongside the copied components. Staff registry configuration lives in `apps/staff/components.json`. Generated imports use relative paths to avoid the repository-wide lint resolver confusing the staff and public `@/` aliases.

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

Staff `/` and the logo lead to Overview. UAT has one Test environment badge; preview limitations live in About preview. Save state appears once and remains distinct from publication status. Essential image, stock, order and publication handoff guidance remains visible.

The [living backoffice design reference](backoffice-design.md) owns shared patterns and the proposed next improvements for Content, Images, Items, Stock and Orders.

## Growing catalog and stocktakes

Distro & merch uses EmDash field filtering and cursor pagination: All, Distro, Merch and existing format groups, with title/recently edited sorting and 25-entry pages. Filters apply before pagination. No new taxonomy or public category is created.

Stock uses the available width for thumbnail rows and quantities. Selection opens a 420 px task panel at 1280 px and above; smaller screens open a focused task with Back to inventory. Search and filters operate on the complete operational result set. Legacy CD/Tape labels remain stored unchanged and match CDs/Tapes filters.

Start stocktake captures a fixed sequence from the selected group using bounded inventory pages. Record count and next confirms one existing revision-protected stock count at a time. Previous, Skip for now and Finish stocktake retain explicit control. Same-tab session storage remembers progress, not authoritative stock. Unconfirmed counts preserve their baseline and entered values for recovery; a changed baseline requires reassessment. New arrivals enter the next stocktake.

EmDash's exported ContentRepository resolves editorial links in batches. Stock remains authoritative in the commerce repository. Artwork enrichment failure must not hide inventory. Browsing adds no schema writes: an administrator-only, same-origin POST to `/_emdash/api/blackbox/catalog-schema` prepares the distro group index and title sorting through EmDash SchemaRegistry. Local startup performs this idempotent setup; hosted invocation requires the separate Free-tier preflight and UAT approval. New databases receive the settings through the seed schema.

Acceptance includes 250+ entries, real Local EmDash reads and Chromium/Firefox checks. Hosted validation and rollout remain separate.

## Website changes review (September 2026 refinement)

Staff utilities and Overview open `/review/`. This supersedes the list-checkbox publication queue. Review discovers saved unpublished Website and Catalog entries through the EmDash workspace adapter, with search, area filters and up to 25 entries per page. Selection persists in the same tab, up to 20 entries across pages. Incomplete drafts remain visible with editing links. A final review checks saved versions; a changed version requires renewed review. The editor's Review changes shortcut finishes autosave and opens an individual review without replacing grouped selection. One selected entry uses Publish change; several use Publish N changes.

Editorial publication includes selling-linked entries but does not activate the shop, change price, or change stock. Selling retains its activation approvals and native lifecycle guard. Pending request identities survive response loss; failed operations require a fresh review. The batch service accepts all reviewed entries in one website update.

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

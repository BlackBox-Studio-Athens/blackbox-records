# Staff editorial workspace

The staff interface is built on EmDash's APIs, not a second CMS or a replacement admin backend. EmDash owns content, private drafts, revision conflict checks, references, media, and the reused Portable Text editor. Label-specific forms and publication review coordinate these APIs with the existing commerce services. The native full admin screens are not the staff navigation foundation.

The staff root and logo open Overview. A 72 px top navigation covers Overview, Catalog, Website, Images, Stock and Orders at widths of at least 1440 px. Catalog and Website have optional 256 px contextual sidebars; smaller screens use a labeled Menu drawer. `/content/` opens named website pages; `?view=footer` groups navigation, social links and newsletter. Existing `?collection=…&id=…` links continue to select their editor. `/items/?variantId=…` resolves the editorial/selling relationship and opens the matching catalog destination.

Private editorial drafts autosave after a 1.5-second typing pause. Incomplete drafts are allowed; unsafe input and invalid supplied references are rejected. Save state is distinct from publication state. Older responses never replace newer typing. Failed saves and conflicts retain input and offer recovery. Price, stock, wording approval and publication remain explicit operations.

Publish changes opens a review of the exact saved version. Optional list selection supports up to twenty eligible entries. Existing staged selections are recovered for review, never published automatically. The old persistent staging toolbar, Edit → Stage → Publish landing panel and routine Refresh controls are superseded. Per-entry On the website state must match its accepted snapshot revision.

At widths of at least 1280 px, editors initially show a resizable public appearance preview; visibility is remembered. Smaller screens use Edit/Preview tabs. Hidden previews do no background work. Images remains one flat library; uploading alone does not publish anything. Alt text belongs to its editorial placement.

The [backoffice design reference](backoffice-design.md) and [staff glossary](../UBIQUITOUS_LANGUAGE.md) own the shared vocabulary and update policy. Implementation acceptance is tracked in [the redesign checklist](../openspec/changes/redesign-staff-workspace/tasks.md).

## Private appearance preview

The CMS build registers an authenticated `POST /_emdash/preview` Astro route. The public `content-reader` seam keeps normal static collection reads; the CMS aliases it to request-scoped published revision reads plus the selected unsaved record. Public page components, rich-text rendering, styles, fonts and crop rules are shared. No preview record, draft save or publication is created. Public Pages serve assets and forward public reads to the accepted-snapshot renderer. Private previews never change that snapshot.

The request accepts collection, identity, slug and editorial data only. Existing schemas and Access permissions apply. Requests require the same Origin and CMS request header. Input is capped at 256 KiB, response HTML at 4 MiB, and context reads at 512; surrounding responses have a 30-second cache in the existing CMS object, bounded to 512 responses and 8 MiB of serialized text. No KV or Astro sessions are enabled. Protected original images retain public layout dimensions without using public image-transform endpoints.

Only editorial changes wait for a 750 ms editing pause while the preview and document are visible. Opening a preview, changing its context and contextual retry start immediately. Each successful HTML response loads a new iframe generation, even when unchanged. Stylesheets and images must load before it replaces the previous successful rendering; failed replacements retain that rendering with an explanation. Preview images load eagerly so a hidden replacement can be checked. Superseded requests and asset completions are ignored, and a 30-second deadline offers manual retry. Fit fills the pane; Desktop and Mobile set actual 1280 px and 390 px iframe widths. Expand contains keyboard focus and restores it on close. Scroll survives edits; changing context resets it.

Published revision and media reads run concurrently with a request-wide maximum of four active reads. Identical paths share a promise only within the request; fresh authorization and selected-record validation remain required. Direct lookups of the selected record resolve its validated input without scanning unrelated collection entries; listing queries still resolve the complete published collection. Catalog owns guided setup and coordinates existing price and item publication operations, with a read-only stock summary and a `Manage stock` handoff to `/stock/?variantId=…`. Stock owns adjustments, counts and ledger history. The two workspaces load search, current stock and history independently; history/search failures do not hide fresh stock, and stock mutations retain fresh-record revision/conflict checks.

The iframe is visual-only: scripts and embedded players are removed, links/controls are inert, CSP blocks scripts, connections, frames and forms, and the iframe sandbox permits same-origin access only for private assets and scroll preservation. Page sections use full pages; artists/releases/news/distro offer detail and listing contexts. Navigation, label details, socials and newsletter use the homepage header/footer/newsletter context. Metadata-only settings are identified. The environment label refers to CMS code; an earlier public deployment may differ.

## Publication visibility

Workspace reads check the accepted R2 pointer on every request. The CMS object retains only one verified manifest, keyed by bucket, environment and checksum (at most 4 MiB of manifest input). A warm match saves one manifest read and parse; drafts, pending publications and commerce still read fresh. Missing pointers remove accepted state; unreadable pointers or invalid new manifests fail the request without stale fallback. Object eviction simply causes a verified reload.

Protected hashed `/_astro/` scripts, styles and fonts with ETags use `private, no-cache, must-revalidate`. Browsers may retain their bytes but must revalidate after authentication before reuse; no freshness TTL or offline reuse is enabled. Staff HTML, APIs, private media, errors and cookie-setting responses remain `private, no-store`. The combined-artifact `test:staff-hosting` smoke checks conditional GET/HEAD and denied access. Rollback restores the asset no-store override and removes the object's manifest slot; no purge or new resource is needed.

The top status control opens recent history in a desktop Popover or mobile Sheet. A contextual Check status action recovers a failed or timed-out check. Pending requests poll every two seconds for the first minute, then every thirty seconds while visible, up to thirty minutes. Returning to the page checks immediately. Checks share one in-flight request. Accepted requests never imply the site is live.

Publication review retains selected saved entries with their exact revisions and a browser-retained request ID. `Publish changes` journals that selection, prepares an immutable snapshot replacing only those entries, validates it through the public renderer, and atomically activates it. The API remains atomic for a maximum batch of twenty; failed operations retain their identity for recovery. New typing and unrelated drafts stay private. Existing staged selections are carried into review without publishing automatically. Images already in the accepted snapshot are reused. A Durable Object alarm resumes interrupted work. On the website means the accepted snapshot contains that entry's reviewed revision. No GitHub build or deployment runs for content publication. Shop publication remains an explicit, safety-gated Catalog action.

Code releases still use the reviewed UAT candidate and retained PRD artifact. See [publication operation and recovery](content-publication.md) for budgets, failure behavior and Local checks.

## Component sources

- Official [shadcn New York registry](https://ui.shadcn.com/docs/components): Sidebar, Table, InputGroup, Breadcrumb, ButtonGroup, Field, NativeSelect, Checkbox, Command/Popover combobox, DropdownMenu, AlertDialog, Alert, Sheet, AspectRatio, Tooltip, Skeleton, Empty, ScrollArea, ToggleGroup, Collapsible, Accordion and supporting components.
- [blocks.so File Upload Simple](https://blocks.so/file-upload/file-upload-02): adapted native file input, label and help presentation. Uploads call the existing `uploadArtwork` helper.
- EmDash 0.38's existing Portable Text editor remains the rich-text engine.

MIT notices are retained alongside the copied components. Staff registry configuration lives in `apps/staff/components.json`. Generated imports use relative paths to avoid the repository-wide lint resolver confusing the staff and public `@/` aliases.

Local adaptations: 1440 px navigation breakpoint, no global sidebar keyboard shortcut, staff touch targets, strict TypeScript compatibility and existing dark tokens. EmDash CSS is loaded into a lower-priority cascade layer so its bundled utility classes cannot override the staff app's responsive classes.

## Verification

Run the normal unit, check and build gates. For the focused browser regression:

```sh
pnpm build:staff
node scripts/test-preview-policy.mjs
node scripts/test-content-workspace.mjs
node scripts/test-content-workspace.mjs --firefox
```

This serves the built staff app with in-memory API fixtures on loopback, uses the existing Playwright dependency, and writes screenshots to ignored `.codex-artifacts/content-workspace/`. It never contacts hosted CMS, D1, R2, Stripe or publication workflows. It tests frontend integration; existing backend tests remain responsible for provider and publication contracts.

For manual browser inspection, run `node scripts/test-content-workspace.mjs --serve` and open `http://127.0.0.1:4399/content/`. Fixture writes last only until the process stops.

For real shared-template verification, build the canonical CMS with `pnpm --filter @blackbox/backend build:cms`, run the normal Local stack, then run `node --import tsx apps/backend/scripts/smoke-content-preview.mjs`. This loopback-only smoke previews every seeded collection, checks visual-only HTML and cross-origin rejection, reports latency/bytes/read counts, and verifies preview API calls leave drafts and publication history unchanged. Add `--browsers` to verify real rendering in Chromium and Firefox and editor autosave; that UI phase restores its original Local newsletter draft afterwards and never publishes it. The CMS build validates both source and generated no-KV configuration. Hosted verification requires the Free-tier preflight and is separate from local evidence.

## Failure diagnostics

The preview meta CSP explicitly names the validated CMS origin, including scheme and Local port. Firefox does not reliably match meta-policy `self` in `about:srcdoc`; header-only tests do not cover this boundary. Both browser fixtures use the production policy. Scripts/forms/frames/connections remain disabled.

Preview responses include `X-Preview-Request-Id`, `X-Release-SHA`, and an echoed, validated `X-Preview-Generation` when supplied. In Cloudflare, open Workers & Pages → the target backend Worker → Observability, filter `event` to `preview_render` or `preview_browser_failure`, then filter `requestId` to the copied reference. Render logs include outcome, milliseconds, view, read counts and numeric generation. Browser failures include requested/displayed generations, failed readiness and sanitized asset location; CSP directives appear only when observed, not inferred. Early pre-load CSP events may be absent. A successful render log alone does not establish successful browser rendering.

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

Staff utilities and Overview open `/review/`. This supersedes the list-checkbox publication queue. Review discovers saved unpublished Website and Catalog entries through the EmDash workspace adapter, with search, area filters and up to 25 entries per page. Selection persists in the same tab, up to 20 entries across pages. Incomplete drafts remain visible with editing links. A final review checks saved versions; a changed version requires renewed review. The editor's Publish changes shortcut finishes autosave and selects only that entry. One selected entry uses Publish change; several use Publish selected changes.

Editorial publication includes selling-linked entries but does not activate the shop, change price, or change stock. Selling retains its activation approvals and native lifecycle guard. Pending request identities survive response loss; failed operations require a fresh review. The batch service accepts all reviewed entries in one website update.

Count stock and Finish counting replace visible Stocktake wording; internal storage identities remain compatible. Quantities read Available to buy online, with copies for music and units for merchandise. The online quantity is how many customers may buy through the website.

Review discovery uses bounded native EmDash cursor reads and existing accepted-snapshot comparisons, never private CMS table queries. The client follows sparse continuations until its page fills or reaches the end, cancelling stale searches. It does not load the entire library into browser memory or poll a global draft count. Hosted rollout still requires a Free-tier cost preflight.

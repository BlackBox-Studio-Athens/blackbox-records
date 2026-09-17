# Content workspace

`/content/` is **Website content**: grouped section navigation, with collection sections opening a searchable record list and singleton pages/settings opening their only editable record directly. Existing `?collection=…&id=…` links remain supported. `/content/?view=media` opens **Images**. Collection editors retain the compact record selector and Back to records action; singleton editors show the record title without collection-only controls.

Desktop preview starts closed. Show preview opens the approved Layout A 45/55 grid from 1100 px; Hide preview returns space to the editor. The desktop preference is remembered per browser, with storage failure tolerated. Hidden previews cancel work and do not request updates. Smaller screens use Edit/Preview tabs with both surfaces mounted to preserve edits. The image picker returns to the current field without losing edits; switching records, collections, or the full Images workspace requires saving or discarding changes. The sticky editor toolbar carries the selected title, draft state, save action and the visible `Add to publication` action when eligible. A persistent top-bar queue exposes `Staged changes (N)` and `Publish changes (N)` for website editorial records; the queue uses a desktop Popover and mobile Sheet, survives reload, and accepts at most twenty records. Releases and distro show an explicit `Publish from Items` handoff.

When no record is selected, the editor is a compact workspace dashboard rather than an empty canvas. It shows the current collection, staged count, public status, the Edit → Stage → Publish sequence, and shortcuts to the first record, queue and history. The More draft actions menu remains populated with queue, history and contextual navigation/trash actions.

Use blue for actions and selection, amber for unsaved/pending, green for confirmed live, and red for failures. Every status includes words or an icon. Enabled actions use a pointer; fields retain editing cursors. Optional fields are labelled, validation remains beside fields, and artist images explain the public 3:4 crop.

## Private appearance preview

The CMS build registers an authenticated `POST /_emdash/preview` Astro route. The public `content-reader` seam keeps normal static collection reads; the CMS aliases it to request-scoped published revision reads plus the selected unsaved record. Public page components, rich-text rendering, styles, fonts and crop rules are shared. No preview record, draft save or publication is created. Public Pages serve assets and forward public reads to the accepted-snapshot renderer. Private previews never change that snapshot.

The request accepts collection, identity, slug and editorial data only. Existing schemas and Access permissions apply. Requests require the same Origin and CMS request header. Input is capped at 256 KiB, response HTML at 4 MiB, and context reads at 512; surrounding responses have a 30-second cache in the existing CMS object, bounded to 512 responses and 8 MiB of serialized text. No KV or Astro sessions are enabled. Protected original images retain public layout dimensions without using public image-transform endpoints.

Only editorial changes wait for a 750 ms editing pause while the preview and document are visible. Opening a preview, changing its context and manual refresh start immediately. Each successful HTML response loads a new iframe generation, even when unchanged. Stylesheets and images must load before it replaces the previous successful rendering; failed replacements retain that rendering with an explanation. Preview images load eagerly so a hidden replacement can be checked. Superseded requests and asset completions are ignored, and a 30-second deadline offers manual retry. Fit fills the pane; Desktop and Mobile set actual 1280 px and 390 px iframe widths. Expand contains keyboard focus and restores it on close. Scroll survives edits; changing context resets it.

Published revision and media reads run concurrently with a request-wide maximum of four active reads. Identical paths share a promise only within the request; fresh authorization and selected-record validation remain required. Direct lookups of the selected record resolve its validated input without scanning unrelated collection entries; listing queries still resolve the complete published collection. Items owns catalog setup, prices and item publication, with a read-only stock summary and a `Manage stock` handoff to `/stock/?variantId=…`. Stock owns adjustments, counts and ledger history. The two workspaces load search, current stock and history independently; history/search failures do not hide fresh stock, and stock mutations retain fresh-record revision/conflict checks.

The iframe is visual-only: scripts and embedded players are removed, links/controls are inert, CSP blocks scripts, connections, frames and forms, and the iframe sandbox permits same-origin access only for private assets and scroll preservation. Page sections use full pages; artists/releases/news/distro offer detail and listing contexts. Navigation, label details, socials and newsletter use the homepage header/footer/newsletter context. Metadata-only settings are identified. The environment label refers to CMS code; an earlier public deployment may differ.

## Publication visibility

The top status control opens recent history in a desktop Popover or mobile Sheet. Refresh checks immediately. Pending requests poll every two seconds for the first minute, then every thirty seconds while visible, up to thirty minutes. Returning to the page checks immediately. Checks share one in-flight request. Accepted requests never imply the site is live.

The queue stages saved records with their revisions and a browser-retained request ID. Saving a record removes its staged entry, so the new revision must be added again. `Publish changes (N)` journals the selected records, prepares an immutable snapshot by replacing only those records, validates it through the public renderer, and atomically activates the snapshot. The API remains atomic for a maximum batch of twenty; a failed batch stays staged for retry. Other drafts stay private. Images already in the accepted snapshot are reused. A Durable Object alarm resumes interrupted work. Live means the public origin has confirmed the selected snapshot. No GitHub build or deployment runs for content publication. Commerce item publication remains an explicit, safety-gated Items action.

Code releases still use the reviewed UAT candidate and retained PRD artifact. See [publication operation and recovery](content-publication.md) for budgets, failure behavior and Local checks.

## Component sources

- Official [shadcn New York registry](https://ui.shadcn.com/docs/components): Sidebar, Table, InputGroup, Breadcrumb, ButtonGroup, Field, NativeSelect, Checkbox, Command/Popover combobox, DropdownMenu, AlertDialog, Alert, Sheet, AspectRatio, Tooltip, Skeleton, Empty, ScrollArea and supporting components.
- [blocks.so File Upload Simple](https://blocks.so/file-upload/file-upload-02): adapted native file input, label and help presentation. Uploads call the existing `uploadArtwork` helper.
- EmDash 0.38's existing Portable Text editor remains the rich-text engine.

MIT notices are retained alongside the copied components. Staff registry configuration lives in `apps/staff/components.json`. Generated imports use relative paths to avoid the repository-wide lint resolver confusing the staff and public `@/` aliases.

Local adaptations: 1024px navigation breakpoint, no global sidebar keyboard shortcut, staff touch targets, strict TypeScript compatibility and existing dark tokens. EmDash CSS is loaded into a lower-priority cascade layer so its bundled utility classes cannot override the staff app's responsive classes.

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

For real shared-template verification, build the canonical CMS with `pnpm --filter @blackbox/backend build:cms`, run the normal Local stack, then run `node --import tsx apps/backend/scripts/smoke-content-preview.mjs`. This loopback-only smoke previews every seeded collection, checks visual-only HTML and cross-origin rejection, reports latency/bytes/read counts, and verifies drafts and publication history are unchanged. The CMS build validates both source and generated no-KV configuration. Hosted verification requires the Free-tier preflight and is separate from local evidence.

## Failure diagnostics

The preview meta CSP explicitly names the validated CMS origin, including scheme and Local port. Firefox does not reliably match meta-policy `self` in `about:srcdoc`; header-only tests do not cover this boundary. Both browser fixtures use the production policy. Scripts/forms/frames/connections remain disabled.

Preview responses include `X-Preview-Request-Id`, `X-Release-SHA`, and an echoed, validated `X-Preview-Generation` when supplied. In Cloudflare, open Workers & Pages → the target backend Worker → Observability, filter `event` to `preview_render` or `preview_browser_failure`, then filter `requestId` to the copied reference. Render logs include outcome, milliseconds, view, read counts and numeric generation. Browser failures include requested/displayed generations, failed readiness and sanitized asset location; CSP directives appear only when observed, not inferred. Early pre-load CSP events may be absent. A successful render log alone does not establish successful browser rendering.

The displayed frame must match current editor inputs before reporting Preview up to date. Public fonts explicitly configured with `font-display: optional` may use their normal fallback after Firefox's display deadline; that does not invalidate the rendering. Required fonts, styles and images still gate readiness. Neither CSP nor public font configuration is broadened for this behavior.

Authenticated `POST /_emdash/preview-diagnostics` requires editor role, same-origin and `X-EmDash-Request: 1`. Strict 4 KB input; ten reports per minute/member; a bounded 1000-entry in-memory map resets on eviction/restart. No retry, KV, database write or new service. Reports exclude content, HTML, private media names, URL queries and credentials. Copy diagnostic details appears only with errors. Reporting failures do not affect editing. Cloudflare retention and account log allowances apply; do not promise permanent history.

Staff `/` and the logo lead to Content. UAT has one Test environment badge; preview limitations live in About preview. Save state appears once and remains distinct from publication status. Essential image, stock, order and publication handoff guidance remains visible.

The [living backoffice design reference](backoffice-design.md) owns shared patterns and the proposed next improvements for Content, Images, Items, Stock and Orders.

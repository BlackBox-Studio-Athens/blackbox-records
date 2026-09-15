# Content workspace

`/content/` is **Website content**: grouped section navigation, a searchable collection list, then a compact content selector above the editor. Existing `?collection=…&id=…` links remain supported. `/content/?view=media` opens **Images**.

The approved Layout A uses a 45/55 editor/preview grid from 1100 px. Smaller screens use Edit/Preview tabs with both surfaces mounted to preserve edits. The image picker returns to the current field without losing edits; switching records, collections, or the full Images workspace requires saving or discarding changes. The sticky editor toolbar carries the selected title, draft state, save and publication actions. Releases and distro publish through Items.

Use blue for actions and selection, amber for unsaved/pending, green for confirmed live, and red for failures. Every status includes words or an icon. Enabled actions use a pointer; fields retain editing cursors. Optional fields are labelled, validation remains beside fields, and artist images explain the public 3:4 crop.

## Private appearance preview

The CMS build registers an authenticated `POST /_emdash/preview` Astro route. The public `content-reader` seam keeps normal static collection reads; the CMS aliases it to request-scoped published revision reads plus the selected unsaved record. Public page components, rich-text rendering, styles, fonts and crop rules are shared. No preview record, draft save or publication is created. Public Pages remain static.

The request accepts collection, identity, slug and editorial data only. Existing schemas and Access permissions apply. Requests require the same Origin and CMS request header. Input is capped at 256 KiB, response HTML at 4 MiB, and context reads at 512; surrounding responses have a 30-second cache in the existing CMS object, bounded to 512 responses and 8 MiB of serialized text. No KV or Astro sessions are enabled. Protected original images retain public layout dimensions without using public image-transform endpoints.

Only editorial changes wait for a 750 ms editing pause while the preview and document are visible. Opening a preview, changing its context and manual refresh start immediately. Each successful HTML response loads a new iframe generation, even when unchanged. Stylesheets and images must load before it replaces the previous successful rendering; failed replacements retain that rendering with an explanation. Preview images load eagerly so a hidden replacement can be checked. Superseded requests and asset completions are ignored, and a 30-second deadline offers manual retry. Fit fills the pane; Desktop and Mobile set actual 1280 px and 390 px iframe widths. Expand contains keyboard focus and restores it on close. Scroll survives edits; changing context resets it.

Published revision and media reads run concurrently with a request-wide maximum of four active reads. Identical paths share a promise only within the request; fresh authorization and selected-record validation remain required. Direct lookups of the selected record resolve its validated input without scanning unrelated collection entries; listing queries still resolve the complete published collection. Items and Stock load search, current stock and history independently. History/search failures do not hide fresh stock; stock mutations require a fresh matching record and retain revision/conflict checks.

The iframe is visual-only: scripts and embedded players are removed, links/controls are inert, CSP blocks scripts, connections, frames and forms, and the iframe sandbox permits same-origin access only for private assets and scroll preservation. Page sections use full pages; artists/releases/news/distro offer detail and listing contexts. Navigation, label details, socials and newsletter use the homepage header/footer/newsletter context. Metadata-only settings are identified. The environment label refers to CMS code; an earlier public deployment may differ.

## Publication visibility

The top status control opens recent history in a desktop Popover or mobile Sheet. History uses only the existing status and request time contract. Pending status polls every 15 seconds while the document is visible, for at most two minutes per pending set. Manual refresh remains available. An unresolved failure stays in the top status until a newer publication is confirmed live; older failures remain in history. Accepted requests never imply the site is live.

## Component sources

- Official [shadcn New York registry](https://ui.shadcn.com/docs/components): Sidebar, Table, InputGroup, Breadcrumb, ButtonGroup, Field, NativeSelect, Checkbox, Command/Popover combobox, DropdownMenu, AlertDialog, Alert, Sheet, AspectRatio, Tooltip, Skeleton and supporting components.
- [blocks.so File Upload Simple](https://blocks.so/file-upload/file-upload-02): adapted native file input, label and help presentation. Uploads call the existing `uploadArtwork` helper.
- EmDash 0.38's existing Portable Text editor remains the rich-text engine.

MIT notices are retained alongside the copied components. Staff registry configuration lives in `apps/staff/components.json`. Generated imports use relative paths to avoid the repository-wide lint resolver confusing the staff and public `@/` aliases.

Local adaptations: 1024px navigation breakpoint, no global sidebar keyboard shortcut, staff touch targets, strict TypeScript compatibility and existing dark tokens. EmDash CSS is loaded into a lower-priority cascade layer so its bundled utility classes cannot override the staff app's responsive classes.

## Verification

Run the normal unit, check and build gates. For the focused browser regression:

```sh
pnpm build:staff
node scripts/test-content-workspace.mjs
```

This serves the built staff app with in-memory API fixtures on loopback, uses the existing Playwright dependency, and writes screenshots to ignored `.codex-artifacts/content-workspace/`. It never contacts hosted CMS, D1, R2, Stripe or publication workflows. It tests frontend integration; existing backend tests remain responsible for provider and publication contracts.

For manual browser inspection, run `node scripts/test-content-workspace.mjs --serve` and open `http://127.0.0.1:4399/content/`. Fixture writes last only until the process stops.

For real shared-template verification, build the canonical CMS with `pnpm --filter @blackbox/backend build:cms`, run the normal Local stack, then run `node --import tsx apps/backend/scripts/smoke-content-preview.mjs`. This loopback-only smoke previews every seeded collection, checks visual-only HTML and cross-origin rejection, reports latency/bytes/read counts, and verifies drafts and publication history are unchanged. The CMS build validates both source and generated no-KV configuration. Hosted verification requires the Free-tier preflight and is separate from local evidence.

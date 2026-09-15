# Content workspace

`/content/` uses a collection sidebar, searchable record list and editor. `/content/?view=media` opens the image library. Existing `?collection=…&id=…` links remain supported.

Draft state stays mounted when opening Media. Returning to the draft preserves unsaved fields and rich text. Changing records still requires saving or discarding changes. Save, Preview, publication history and linked-item publication retain their existing backend contracts.

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

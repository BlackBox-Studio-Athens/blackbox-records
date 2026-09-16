## Context

The staff Content header currently receives ordered publication history but derives its warning from any failed row newer than the latest live row. That makes an older failure override a newer pending request. `ContentApp` also communicates request progress through a general message string, so the status component cannot distinguish a new request from a failed status read.

The staff application already has the required UI primitives, Lucide icons, responsive layout hooks, protected API clients, and independent read flows. The publication journal is the authoritative retained history and already returns newest rows first. See `proposal.md` and the two delta specs for the user-visible contract.

## Goals / Non-Goals

**Goals:**

- Make the prominent publication state describe the active or newest request while keeping historical failures visible.
- Keep refresh and bounded pending polling reliable, explicit, and accessible.
- Give Content, Images, Items, Stock, and Orders one recognizable operator workspace rhythm.
- Improve scanability, focus, loading, error, and responsive states using existing dependencies.
- Preserve current data ownership, permissions, journal behavior, commerce safeguards, and public rendering.

**Non-Goals:**

- Do not delete or rewrite publication history.
- Do not change dispatch, deployment, reconciliation, or publication retry semantics.
- Do not add a new endpoint, database field, dependency, autosave, interactive preview browsing, or commerce operation.
- Do not make a newest failed request look successful.

## Decisions

### 1. Derive current status from request order and explicit client state

Add a pure status summarizer beside `PublicationStatus`. It receives the newest-first `ContentPublication[]`, an explicit `requesting` flag, and a separate status-read error. Its result has one of `requesting`, `pending`, `failed`, `live`, `unavailable`, or `empty`, plus the user-facing label and whether the known state is stale.

`ContentApp` sets `requesting` before it starts the publication flow and clears it when the flow settles. A successful status read replaces the retained rows and clears the status-read error. A failed status read retains the last successful rows and sets the error separately. The component never parses operation feedback text to infer state.

Priority is requesting, newest pending, newest failed, newest live, unavailable, then empty. When a status read fails with a known current row, retain that row and expose a stale/status-unavailable secondary message; when no current row is trustworthy, show the unavailable summary. This avoids a false Live result while keeping useful context.

The direct refresh button remains a sibling of the history trigger. It uses the existing in-flight guard and polling function, has an accessible name and tooltip, and exposes a text label at wide widths for discoverability.

### 2. Treat history as immutable evidence

The history popover/Sheet keeps all returned rows and their status, request time, failure guidance, and diagnostic identifier. The newest row is marked Current; older rows are labeled as history. No title, author, or publication outcome is inferred from the row.

### 3. Use existing primitives and CSS tokens for the visual pass

Use the existing Button, ButtonGroup, Badge, Card, Alert, Field, Separator, Sheet, Popover, Skeleton, Tooltip, Command, and Lucide icons. Use CSS classes and current Tailwind tokens for shared rhythm instead of adding a component library or a speculative design-system package.

Staff pages use Inter/system sans for headings and controls. Display typography remains available to the public preview only. Shared workspace rules are compact headings, 16–24 px group rhythm, 44 px primary targets, blue actions/selections, amber pending states, green confirmed states, red failures, and visible focus.

The five workspace passes are deliberately visual and data-preserving:

- Content gets the current publication marker, denser history, and a clearer action/status toolbar.
- Images gets a compact grid/list choice, stronger selected/error states, and existing dimensions/crop metadata in the picker.
- Items gets grouped setup sections, a derived readiness strip, and clearer Content/Stock handoffs.
- Stock gets explicit Adjust/Count modes, advisory before/after quantities, and a compact history treatment.
- Orders gets quick filters, clearer row status identity, and grouped payment/delivery/notification facts.

Where a workspace already has authoritative data, the visual treatment uses it. It does not add fabricated metadata or new reads merely to fill a card.

### 4. Keep responsive behavior structural

At narrow widths, stack toolbars and use existing sheet or segmented-control patterns; do not scale desktop panels into phone-sized targets. At wide widths, keep predictable content widths and align action/status areas. Avoid layout animation and preserve reduced-motion behavior.

### 5. Validate the state machine before hosted verification

Unit tests cover the pure status summarizer and rendered states. The existing Content browser fixture runs the old-failure/new-pending sequence in Chromium and Firefox, then confirms live and newest-failure behavior. Visual checks cover all five workspaces at the repository's required widths and preserve direct links and protected data boundaries.

## Risks / Trade-offs

- [A status-read error can leave a stale current row visible] → retain the row but add an explicit unavailable/stale state and keep manual refresh available; never claim Live.
- [Using newest-first history couples the summarizer to the journal ordering contract] → preserve the existing API ordering and add tests with representative timestamps/order; do not silently reinterpret unordered data.
- [A broad visual pass can introduce unrelated behavior changes] → keep API clients and mutation handlers unchanged, use existing data only, and verify current item, stock, order, and publication flows.
- [Different workspaces have separate CSS and component structures] → share tokens and interaction rules first; extract a component only where the same visible pattern is already used across the staff surface.

## Migration Plan

1. Add the new OpenSpec delta and implementation tests.
2. Fix publication state derivation and extend the Content fixture.
3. Apply the visual changes workspace by workspace, preserving existing handlers and API contracts.
4. Run the required unit, check, build, browser, and OpenSpec validation commands.
5. Deploy the exact passing tree to UAT, verify pending, retained history, newest failure, refresh, and live states in Chromium and Firefox.
6. Roll back by reverting the frontend change if UAT verification fails. No data migration or journal rollback is needed.

## Open Questions

None. The workspace scope, state priority, dependency constraints, and rollout gate are fixed by the proposal and specs.

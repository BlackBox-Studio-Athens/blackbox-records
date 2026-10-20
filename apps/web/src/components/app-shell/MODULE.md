# app-shell

## Scope and start

Owns persistent public shell state, section navigation, overlays and player coordination. Start at [AppShellRoot.tsx](AppShellRoot.tsx) and [routing.ts](routing.ts). The module's [project.json](project.json) owns public exports, allowed dependencies and test inputs; Nx dependencies describe structure, not import permission.

## Do not break

Preserve playback across shell navigation. Player close/minimize/Stop have different lifetimes: closing before actual embed interaction destroys the session; minimizing after interaction retains it; Stop destroys it. Browser/device Back closes the player history entry without routing the page. Full document reloads cannot preserve third-party iframe playback. Preserve scroll/focus reset, overlay return focus and cancellation/order of side effects.

## Contracts and decisions

Read [shell/player spec](../../../../../openspec/specs/app-shell-and-player/spec.md), [frontend contracts](../../../../../docs/frontend-agent-contracts.md) and current change acceptance. The shell-mounted listing price projection is presentation; Worker reads retain commerce authority.

## Verification and work split

From repository root run `pnpm test app-shell` while editing, then required `pnpm validate`. Select affected browser behavior through [acceptance](../../../../../docs/agent-acceptance.md); local unit passes do not certify focus, phone navigation or playback continuity. Claude implements presentation, interaction and UI tests. Codex implements non-visual lifecycle/domain coordination and corresponding tests. Agree callbacks/state contracts; sequence edits if both need the same file. Prompt overrides remain task-scoped.

## Decision

Implement the owner's approved interaction directly in `PreorderChapter`. An empty native button covers only the media layer. Text and sibling controls remain outside the button and above its hit area. Pointer movement beyond eight CSS pixels, leaving the target, or cancellation disqualifies the gesture. Native clicks provide keyboard Enter/Space behavior without custom key handling or captured scrolling.

Manual pause is keyed by clip within the existing slug-keyed chapter. It persists across visibility, listening sessions, full-video viewing and responsive source selection, and clears naturally when the chapter is removed. Changing the active clip does not inherit another clip's pause. A played-frame marker preserves a frozen frame only for that clip and clears on empty/error. Existing automatic eligibility still controls all starts; reduced-motion/data-saving or failed/refused media disable the toggle. Hover/focus never start media.

## Approved Scope

User explicitly approved Codex UI implementation in a separate managed worktree and rejected even a 14px pause icon. No new visible icon, caption, persistent control, redesign, hero/controller edit, full-video-provider edit, merge, push or deployment. This approval supersedes the historical DESIGN.md statement that tapping the pre-order film does nothing; all other composition rules stay applicable.

## Verification

Use real local fixture footage and stub provider documents. Check advancing/frozen frames, pointer and keyboard input, selectable text and child-action isolation, drag/cancel and native touch scrolling, automatic suspension persistence, per-clip intent, loading/error/no-film and reduced-motion behavior at desktop and 390px. Reuse the existing Home media lifecycle suite and run repository validation against an unchanged source fingerprint.

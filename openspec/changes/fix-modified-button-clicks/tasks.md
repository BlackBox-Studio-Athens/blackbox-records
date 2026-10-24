# Tasks

## 1. Diagnosis

- [x] 1.1 Reproduce: a temporary WebKit spec tapped the first Store Listen trigger after a settled scroll and waited 10 s for the player iframe, against `astro preview`. Misses: 3/140 earlier and 9/400 with click-property logging.
- [x] 1.2 Rule out: in every miss the shell's capture click listener was attached (`addEventListener` count 1). The trigger was enabled, idle and carried its Bandcamp URL, there was no page error, and the click target was the Listen button.
- [x] 1.3 Root cause: 9/9 misses had modifier flags on the click (Shift 5, Ctrl 2, Shift+Alt 1, Ctrl+Shift 1); 8/8 sampled passes had none. `handleDocumentClick` returned `ignored` for any modified click before resolving the intent, so a button press with a held key did nothing. The test pressed no key. Playwright's Windows WebKit build appears to take the host's live modifier state for synthesized taps while the desktop is in use.

## 2. Fix

- [x] 2.1 Apply `isModifiedEvent` only when an anchor is involved (anchor intents and link scroll targets); keep the `defaultPrevented` short-circuit for all intents.
- [x] 2.2 Unit tests in `shell-document-event-routing.test.ts`: player trigger with each modifier; modified anchor and scroll-target-link clicks stay with the browser.
- [x] 2.3 E2E `player-continuity.spec.ts` "Listen opens the player while Shift or Ctrl is held": fails without the fix (no dialog), passes with it in chromium-desktop and chromium-mobile.

## 3. Proof

- [x] 3.1 WebKit, rebuilt preview bundle: 300/300 plain taps opened the player (15.5 min).
- [x] 3.2 WebKit, explicit modified clicks: 20 Shift (`mods=0010`) and 20 Ctrl (`mods=0100`) were all handled (`defaultPrevented=true`) and opened the player, 40/40. Playwright's `tap({ modifiers })` does not carry modifiers into WebKit's click, so `click({ modifiers })` was used.
- [x] 3.3 `store-cart`, `player-continuity` and `shell-navigation` across projects: 143 passed, 26 skipped by project rules, 0 failed. Existing native modified-link tests (`release-merchandising.spec.ts:951`, `home-preorders.spec.ts:808`) pass in Chromium and Firefox, 4/4.
- [x] 3.4 `pnpm validate` passed (`.codex-artifacts/validation/2026-10-24T00-07-59-306Z-30448-0cff87/summary.json`); strict OpenSpec validation passed.

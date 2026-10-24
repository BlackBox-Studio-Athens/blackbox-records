# Proposal

## Why

The shell's document click routing ignored every click with Shift, Ctrl, Alt or Meta held, or with a non-primary button. That is right for links, where the browser opens a new tab or window. It is wrong for buttons, which have no modified-click behaviour of their own. A Listen, Menu, mini-player or dismiss press made while a modifier key is held therefore did nothing.

The same defect caused the rare WebKit failure in `e2e/store-cart.spec.ts` and the Listen diagnostics. In 9 of 9 misses (out of 400 taps) the tap's click arrived with `shiftKey` and/or `ctrlKey`/`altKey` set, though the test pressed no key. In all sampled passes no modifier was set. Playwright's Windows WebKit build appears to take the host's live keyboard state for synthesized taps, and the machine was in use (one miss carried Shift+Alt, the Windows input-language shortcut). The shell's capture listener was attached and the trigger was enabled with its provider data in every miss.

## What Changes

- `handleDocumentClick` still ignores clicks another handler already prevented. The modifier and button check now applies only when an anchor is involved (anchor intents and scroll targets that are links). Button intents act regardless of held keys.
- Unit tests: a player trigger opens with each modifier held, and modified link and scroll-target-link clicks stay with the browser.
- E2E: `player-continuity.spec.ts` "Listen opens the player while Shift or Ctrl is held". It fails without the fix (no dialog) and passes with it.

## Capabilities

None changed; `skip_specs: true`. Link behaviour is unchanged.

## Impact

`apps/web/src/components/app-shell/dom/shell-document-event-routing.ts` and its test, `e2e/player-continuity.spec.ts`. Local only; no commit, push or release.

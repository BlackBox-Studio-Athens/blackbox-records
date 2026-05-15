import type { PlayerProvider } from './player-provider-data';

const MOBILE_NAVIGATION_TRIGGER_SELECTOR = '[data-app-shell-mobile-navigation-trigger]';
const PLAYER_MODAL_DISMISS_SELECTOR = '[data-music-streaming-service-embedded-player-modal-dismiss]';
const MINI_PLAYER_OPEN_SELECTOR = '[data-music-streaming-service-embedded-player-mini-player-open]';
const MINI_PLAYER_STOP_SELECTOR = '[data-music-streaming-service-embedded-player-mini-player-stop]';
const PLAYER_TRIGGER_SELECTOR = '[data-music-streaming-service-embedded-player-trigger]';
const PLAYER_CARD_SELECTOR = '[data-music-streaming-service-embedded-player-card]';
const SCROLL_TARGET_SELECTOR = '[data-scroll-to-target]';

type ClosestCapableTarget = {
  closest: <T>(selector: string) => T | null;
};

type ShellDocumentClickIntentOptions = {
  readPlayerProvidersFromElement: (playerElement: HTMLElement) => PlayerProvider[];
};

export type ShellDocumentClickIntent =
  | { kind: 'anchor'; anchorElement: HTMLAnchorElement }
  | { kind: 'mini-player-open' }
  | { kind: 'mini-player-stop' }
  | { kind: 'mobile-navigation-trigger' }
  | { kind: 'none' }
  | { kind: 'player-modal-dismiss' }
  | { kind: 'player-trigger'; playerElement: HTMLElement; triggerElement: HTMLElement }
  | { kind: 'player-trigger-without-providers' }
  | {
      anchorElement: HTMLAnchorElement | null;
      kind: 'scroll-target';
      targetId: string;
      triggerElement: HTMLElement;
    };

export function resolveShellDocumentClickIntent(
  eventTarget: EventTarget | null,
  { readPlayerProvidersFromElement }: ShellDocumentClickIntentOptions,
): ShellDocumentClickIntent {
  if (!canResolveClosest(eventTarget)) return { kind: 'none' };

  const mobileNavigationTrigger = eventTarget.closest<HTMLElement>(MOBILE_NAVIGATION_TRIGGER_SELECTOR);
  if (mobileNavigationTrigger) return { kind: 'mobile-navigation-trigger' };

  const playerModalDismissTrigger = eventTarget.closest<HTMLElement>(PLAYER_MODAL_DISMISS_SELECTOR);
  if (playerModalDismissTrigger) return { kind: 'player-modal-dismiss' };

  const miniPlayerOpenTrigger = eventTarget.closest<HTMLElement>(MINI_PLAYER_OPEN_SELECTOR);
  if (miniPlayerOpenTrigger) return { kind: 'mini-player-open' };

  const miniPlayerStopTrigger = eventTarget.closest<HTMLElement>(MINI_PLAYER_STOP_SELECTOR);
  if (miniPlayerStopTrigger) return { kind: 'mini-player-stop' };

  const playerTriggerElement = eventTarget.closest<HTMLElement>(PLAYER_TRIGGER_SELECTOR);
  if (playerTriggerElement) {
    const playerElement = playerTriggerElement.closest<HTMLElement>(PLAYER_CARD_SELECTOR) || playerTriggerElement;
    if (readPlayerProvidersFromElement(playerElement).length > 0) {
      return {
        kind: 'player-trigger',
        playerElement,
        triggerElement: playerTriggerElement,
      };
    }

    return { kind: 'player-trigger-without-providers' };
  }

  const anchorElement = eventTarget.closest<HTMLAnchorElement>('a[href]');
  const scrollTargetTrigger = eventTarget.closest<HTMLElement>(SCROLL_TARGET_SELECTOR);
  const targetId = scrollTargetTrigger?.dataset.scrollToTarget;
  if (scrollTargetTrigger && targetId) {
    return {
      anchorElement,
      kind: 'scroll-target',
      targetId,
      triggerElement: scrollTargetTrigger,
    };
  }

  if (anchorElement) return { kind: 'anchor', anchorElement };

  return { kind: 'none' };
}

function canResolveClosest(eventTarget: EventTarget | null): eventTarget is EventTarget & ClosestCapableTarget {
  return (
    eventTarget !== null &&
    typeof eventTarget === 'object' &&
    'closest' in eventTarget &&
    typeof eventTarget.closest === 'function'
  );
}

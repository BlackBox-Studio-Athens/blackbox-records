import { describe, expect, it, vi } from 'vitest';

import { resolveShellDocumentClickIntent } from './shell-document-click-intent';
import type { PlayerProvider } from '../player-provider-data';

const selectors = {
  anchor: 'a[href]',
  miniOpen: '[data-music-streaming-service-embedded-player-mini-player-open]',
  miniStop: '[data-music-streaming-service-embedded-player-mini-player-stop]',
  mobile: '[data-app-shell-mobile-navigation-trigger]',
  playerCard: '[data-music-streaming-service-embedded-player-card]',
  playerDismiss: '[data-music-streaming-service-embedded-player-modal-dismiss]',
  playerTrigger: '[data-music-streaming-service-embedded-player-trigger]',
  scrollTarget: '[data-scroll-to-target]',
} as const;

function createClosestTarget(matches: Record<string, unknown>) {
  return {
    closest: vi.fn((selector: string) => matches[selector] ?? null),
  } as unknown as EventTarget;
}

function createOptions(providers: PlayerProvider[] = []) {
  return {
    readPlayerProvidersFromElement: vi.fn(() => providers),
  };
}

describe('shell document click intent', () => {
  it('ignores targets that cannot resolve closest shell elements', () => {
    const options = createOptions();

    expect(resolveShellDocumentClickIntent(null, options)).toEqual({ kind: 'none' });
    expect(resolveShellDocumentClickIntent({} as EventTarget, options)).toEqual({ kind: 'none' });
  });

  it('gives mobile navigation trigger priority over lower-priority anchors', () => {
    const anchorElement = {};
    const eventTarget = createClosestTarget({
      [selectors.anchor]: anchorElement,
      [selectors.mobile]: {},
    });

    expect(resolveShellDocumentClickIntent(eventTarget, createOptions())).toEqual({
      kind: 'mobile-navigation-trigger',
    });
  });

  it('classifies shell player controls before content navigation', () => {
    expect(
      resolveShellDocumentClickIntent(
        createClosestTarget({
          [selectors.miniOpen]: {},
        }),
        createOptions(),
      ),
    ).toEqual({ kind: 'mini-player-open' });

    expect(
      resolveShellDocumentClickIntent(
        createClosestTarget({
          [selectors.miniStop]: {},
        }),
        createOptions(),
      ),
    ).toEqual({ kind: 'mini-player-stop' });

    expect(
      resolveShellDocumentClickIntent(
        createClosestTarget({
          [selectors.playerDismiss]: {},
        }),
        createOptions(),
      ),
    ).toEqual({ kind: 'player-modal-dismiss' });
  });

  it('returns player trigger details when providers are available', () => {
    const playerCard = {};
    const playerTrigger = {
      closest: vi.fn((selector: string) => (selector === selectors.playerCard ? playerCard : null)),
    };
    const eventTarget = createClosestTarget({
      [selectors.playerTrigger]: playerTrigger,
    });
    const provider = {
      embedLayout: 'bandcamp-album',
      embedUrl: 'https://bandcamp.test/embed',
      id: 'bandcamp',
    } satisfies PlayerProvider;

    expect(resolveShellDocumentClickIntent(eventTarget, createOptions([provider]))).toEqual({
      kind: 'player-trigger',
      playerElement: playerCard,
      triggerElement: playerTrigger,
    });
  });

  it('blocks lower-priority click handling for player triggers without providers', () => {
    const playerTrigger = {
      closest: vi.fn(() => null),
    };
    const eventTarget = createClosestTarget({
      [selectors.anchor]: {},
      [selectors.playerTrigger]: playerTrigger,
    });

    expect(resolveShellDocumentClickIntent(eventTarget, createOptions())).toEqual({
      kind: 'player-trigger-without-providers',
    });
  });

  it('returns scroll target details with an anchor fallback', () => {
    const anchorElement = {};
    const scrollTargetElement = {
      dataset: {
        scrollToTarget: 'details',
      },
    };
    const eventTarget = createClosestTarget({
      [selectors.anchor]: anchorElement,
      [selectors.scrollTarget]: scrollTargetElement,
    });

    expect(resolveShellDocumentClickIntent(eventTarget, createOptions())).toEqual({
      anchorElement,
      kind: 'scroll-target',
      targetId: 'details',
      triggerElement: scrollTargetElement,
    });
  });

  it('falls back to anchor navigation when no shell command intent matches', () => {
    const anchorElement = {};
    const eventTarget = createClosestTarget({
      [selectors.anchor]: anchorElement,
    });

    expect(resolveShellDocumentClickIntent(eventTarget, createOptions())).toEqual({
      anchorElement,
      kind: 'anchor',
    });
  });
});

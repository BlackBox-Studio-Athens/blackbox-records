import { describe, expect, it, vi } from 'vitest';

import type { ActivePlayerSession } from '../player-iframe-session';
import { schedulePlayerIframeBlurInteractionCheck } from './shell-player-iframe-blur-interaction';

function createScheduler() {
  const callbacks: Array<() => void> = [];

  return {
    flush() {
      callbacks.splice(0).forEach((callback) => callback());
    },
    scheduler: {
      setTimeout: (callback: () => void) => {
        callbacks.push(callback);
        return callbacks.length;
      },
    } as Pick<Window, 'setTimeout'>,
  };
}

function createActiveSession({
  iframeElement = {} as HTMLIFrameElement,
  status = 'modal-open',
}: {
  iframeElement?: HTMLIFrameElement;
  status?: ActivePlayerSession['status'];
} = {}): ActivePlayerSession {
  return {
    embedLayout: 'bandcamp-album',
    embedUrl: 'https://example.com/embed',
    hasEmbedInteraction: false,
    iframeElement,
    providerId: 'bandcamp',
    releaseId: 'test-release',
    releaseTitle: 'Test Release',
    status,
  };
}

describe('schedulePlayerIframeBlurInteractionCheck', () => {
  it('marks a modal-open player session as interacted when the iframe has focus after blur', () => {
    const { flush, scheduler } = createScheduler();
    const iframeElement = {} as HTMLIFrameElement;
    const activeSession = createActiveSession({ iframeElement });
    const markPlayerSessionAsInteracted = vi.fn();

    schedulePlayerIframeBlurInteractionCheck({
      getActiveElement: () => iframeElement,
      getActiveSession: () => activeSession,
      markPlayerSessionAsInteracted,
      scheduler,
    });
    flush();

    expect(markPlayerSessionAsInteracted).toHaveBeenCalledWith(activeSession.embedUrl);
  });

  it('does not mark minimized sessions as interacted', () => {
    const { flush, scheduler } = createScheduler();
    const iframeElement = {} as HTMLIFrameElement;
    const markPlayerSessionAsInteracted = vi.fn();

    schedulePlayerIframeBlurInteractionCheck({
      getActiveElement: () => iframeElement,
      getActiveSession: () => createActiveSession({ iframeElement, status: 'minimized' }),
      markPlayerSessionAsInteracted,
      scheduler,
    });
    flush();

    expect(markPlayerSessionAsInteracted).not.toHaveBeenCalled();
  });

  it('does not mark sessions as interacted when another element has focus', () => {
    const { flush, scheduler } = createScheduler();
    const markPlayerSessionAsInteracted = vi.fn();

    schedulePlayerIframeBlurInteractionCheck({
      getActiveElement: () => ({}) as Element,
      getActiveSession: () => createActiveSession(),
      markPlayerSessionAsInteracted,
      scheduler,
    });
    flush();

    expect(markPlayerSessionAsInteracted).not.toHaveBeenCalled();
  });
});

import { describe, expect, it, vi } from 'vitest';

import type { ActivePlayerSession } from '../player-iframe-session';
import { syncPlayerSessionFrameHost } from './shell-player-frame-host';

function createActiveSession(iframeElement = {} as HTMLIFrameElement): ActivePlayerSession {
  return {
    embedLayout: 'bandcamp-album',
    embedUrl: 'https://example.com/embed',
    hasEmbedInteraction: false,
    iframeElement,
    providerId: 'bandcamp',
    releaseTitle: 'Test Release',
    status: 'modal-open',
  };
}

function createFrameHostElement({ contains = false } = {}) {
  return {
    appendChild: vi.fn(),
    contains: vi.fn(() => contains),
  } as unknown as HTMLElement;
}

describe('syncPlayerSessionFrameHost', () => {
  it('does nothing without an active player session or frame host', () => {
    const markIframeAsActive = vi.fn();
    const updatePlayerUiFromSession = vi.fn();

    syncPlayerSessionFrameHost({
      activeSession: null,
      frameHostElement: createFrameHostElement(),
      markIframeAsActive,
      updatePlayerUiFromSession,
    });
    syncPlayerSessionFrameHost({
      activeSession: createActiveSession(),
      frameHostElement: null,
      markIframeAsActive,
      updatePlayerUiFromSession,
    });

    expect(markIframeAsActive).not.toHaveBeenCalled();
    expect(updatePlayerUiFromSession).not.toHaveBeenCalled();
  });

  it('appends the active iframe when it is not already inside the frame host', () => {
    const iframeElement = {} as HTMLIFrameElement;
    const activeSession = createActiveSession(iframeElement);
    const frameHostElement = createFrameHostElement();
    const markIframeAsActive = vi.fn();
    const updatePlayerUiFromSession = vi.fn();

    syncPlayerSessionFrameHost({
      activeSession,
      frameHostElement,
      markIframeAsActive,
      updatePlayerUiFromSession,
    });

    expect(frameHostElement.appendChild).toHaveBeenCalledWith(iframeElement);
    expect(markIframeAsActive).toHaveBeenCalledWith(frameHostElement, iframeElement);
    expect(updatePlayerUiFromSession).toHaveBeenCalledWith(activeSession);
  });

  it('does not reappend an iframe that is already inside the frame host', () => {
    const iframeElement = {} as HTMLIFrameElement;
    const activeSession = createActiveSession(iframeElement);
    const frameHostElement = createFrameHostElement({ contains: true });

    syncPlayerSessionFrameHost({
      activeSession,
      frameHostElement,
      markIframeAsActive: vi.fn(),
      updatePlayerUiFromSession: vi.fn(),
    });

    expect(frameHostElement.appendChild).not.toHaveBeenCalled();
  });
});

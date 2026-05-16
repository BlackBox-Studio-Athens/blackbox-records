import type { ActivePlayerSession } from '../player-iframe-session';

type SyncPlayerSessionFrameHostOptions = {
  activeSession: ActivePlayerSession | null;
  frameHostElement: HTMLElement | null;
  markIframeAsActive: (frameHostElement: HTMLElement, iframeElement: HTMLIFrameElement) => void;
  updatePlayerUiFromSession: (activeSession: ActivePlayerSession) => void;
};

export function syncPlayerSessionFrameHost({
  activeSession,
  frameHostElement,
  markIframeAsActive,
  updatePlayerUiFromSession,
}: SyncPlayerSessionFrameHostOptions) {
  if (!activeSession || !frameHostElement) return;

  if (!frameHostElement.contains(activeSession.iframeElement)) {
    frameHostElement.appendChild(activeSession.iframeElement);
  }

  markIframeAsActive(frameHostElement, activeSession.iframeElement);
  updatePlayerUiFromSession(activeSession);
}

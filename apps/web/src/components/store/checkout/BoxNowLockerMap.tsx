import { useEffect, useRef } from 'react';

import { Button } from '@/components/ui/button';
import { BOXNOW_MAP_TIMEOUT_MS, boxNowMapUrl, readBoxNowSelection, type BoxNowLocker } from './boxnow-locker';

/**
 * BOX NOW's public map, framed in our panel. Nothing loads until this mounts, and the frame is BOX NOW's own page:
 * no BOX NOW script runs in ours. A frame that has not loaded within the bound counts as unavailable.
 */
export default function BoxNowLockerMap({
  onSelect,
  onUnavailable,
  skipLabel,
}: {
  onSelect?: ((locker: BoxNowLocker) => void) | undefined;
  onUnavailable: () => void;
  /** Lets the shopper leave a map that loaded but does not work. */
  skipLabel?: string | undefined;
}) {
  const frame = useRef<HTMLIFrameElement>(null);
  const loaded = useRef(false);
  const latest = useRef({ onSelect, onUnavailable });
  latest.current = { onSelect, onUnavailable };

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (!loaded.current) latest.current.onUnavailable();
    }, BOXNOW_MAP_TIMEOUT_MS);
    function onMessage(event: MessageEvent) {
      if (event.source !== frame.current?.contentWindow) return;
      const locker = readBoxNowSelection(event);
      if (locker) latest.current.onSelect?.(locker);
    }
    window.addEventListener('message', onMessage);
    frame.current?.focus({ preventScroll: true });
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener('message', onMessage);
    };
  }, []);

  return (
    <div className="boxnow-map" data-boxnow-map>
      <div className="boxnow-map__frame">
        <iframe
          ref={frame}
          src={boxNowMapUrl()}
          title="BOX NOW locker map"
          allow="geolocation"
          referrerPolicy="strict-origin-when-cross-origin"
          onLoad={() => {
            loaded.current = true;
          }}
          onError={() => latest.current.onUnavailable()}
        />
      </div>
      <p className="boxnow-map__caption">Map and list by BOX NOW</p>
      {skipLabel && (
        <Button type="button" variant="link" className="self-start text-left" onClick={() => onUnavailable()}>
          {skipLabel}
        </Button>
      )}
    </div>
  );
}

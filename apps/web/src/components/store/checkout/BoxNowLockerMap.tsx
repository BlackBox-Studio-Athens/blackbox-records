import { mountLockerMap } from '@coding-tree-io/boxnow-widget';
import { useEffect, useRef } from 'react';

import { Button } from '@/components/ui/button';
import { BOXNOW_MAP_TIMEOUT_MS, type BoxNowLocker } from './boxnow-locker';

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
  const container = useRef<HTMLDivElement>(null);
  const latest = useRef({ onSelect, onUnavailable });
  latest.current = { onSelect, onUnavailable };

  useEffect(() => {
    if (!container.current) return;
    const map = mountLockerMap(container.current, {
      onSelect: (locker) => latest.current.onSelect?.(locker),
      onUnavailable: () => latest.current.onUnavailable(),
      timeoutMs: BOXNOW_MAP_TIMEOUT_MS,
    });
    map.frame.focus({ preventScroll: true });
    return () => map.destroy();
  }, []);

  return (
    <div className="boxnow-map" data-boxnow-map>
      <div ref={container} className="boxnow-map__frame" />
      <p className="boxnow-map__caption">Map and list by BOX NOW</p>
      {skipLabel && (
        <Button type="button" variant="link" className="self-start text-left" onClick={() => onUnavailable()}>
          {skipLabel}
        </Button>
      )}
    </div>
  );
}

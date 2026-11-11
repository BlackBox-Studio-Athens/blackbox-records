import { mountLockerMap, type BoxNowLocker } from '@coding-tree-io/boxnow-widget';
import { useEffect, useRef } from 'react';
import { Button } from '../ui/button';

/**
 * BOX NOW's locker map inside the order's dispatch form. The frame is BOX NOW's own page; a frame that has not
 * loaded within ten seconds, or a press on "Enter it by hand", hands over to the manual locker fields.
 */
export default function StaffLockerMap({
  onSelect,
  onUnavailable,
}: {
  onSelect(locker: BoxNowLocker): void;
  onUnavailable(): void;
}) {
  const container = useRef<HTMLDivElement>(null);
  const latest = useRef({ onSelect, onUnavailable });
  latest.current = { onSelect, onUnavailable };

  useEffect(() => {
    if (!container.current) return;
    const map = mountLockerMap(container.current, {
      // The widget reports each selection twice; choosing the same locker again is harmless.
      onSelect: (locker) => latest.current.onSelect(locker),
      onUnavailable: () => latest.current.onUnavailable(),
      timeoutMs: 10_000,
      title: 'Choose the BOX NOW locker',
    });
    return () => map.destroy();
  }, []);

  return (
    <div className="grid gap-2" data-staff-locker-map>
      <div
        ref={container}
        className="h-[28rem] min-h-80 w-full overflow-hidden rounded-md border border-border [&>iframe]:size-full"
      />
      <p className="text-sm text-muted-foreground">Map and list by BOX NOW. Choosing a locker fills it in here.</p>
      <Button type="button" variant="ghost" className="justify-self-start" onClick={() => onUnavailable()}>
        Enter it by hand
      </Button>
    </div>
  );
}

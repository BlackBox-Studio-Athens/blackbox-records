import { useEffect, useRef, useState } from 'react';
import { MapPin, Package } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import BoxNowLockerMap from './BoxNowLockerMap';
import { lockerAddressText, readLastLocker, writeLastLocker, type BoxNowLocker } from './boxnow-locker';

export const CHECKOUT_LOCKER_COPY = {
  title: 'BOX NOW locker',
  badge: 'Greece only',
  intro: 'Choose the locker where you collect the parcel. You need it before payment.',
  lastUsed: 'Last used on this device',
  useLastUsed: 'Use this locker',
  find: 'Find a locker',
  change: 'Change locker',
  cancel: 'Cancel',
  pickupNote: 'BOX NOW sends the pickup code to the phone and email you give at payment.',
  skip: 'Map not loading? Continue without a locker',
  unavailableLabel: 'Map unavailable',
  unavailable:
    "BOX NOW's map is not loading right now. You can still pay: we email you to agree a locker before we ship.",
  retry: 'Try the map again',
} as const;

export type CheckoutLockerChoice = { kind: 'none' } | { kind: 'locker'; locker: BoxNowLocker } | { kind: 'fallback' };

export default function CheckoutLockerPanel({
  choice,
  onChange,
  disabled = false,
}: {
  choice: CheckoutLockerChoice;
  onChange: (choice: CheckoutLockerChoice) => void;
  disabled?: boolean;
}) {
  const [mapOpen, setMapOpen] = useState(false);
  const [lastUsed, setLastUsed] = useState<BoxNowLocker | null>(null);
  const panel = useRef<HTMLDivElement>(null);
  const restoreFocus = useRef(false);

  useEffect(() => {
    setLastUsed(readLastLocker(safeLocalStorage()));
  }, []);

  useEffect(() => {
    if (mapOpen || !restoreFocus.current) return;
    restoreFocus.current = false;
    panel.current?.querySelector<HTMLElement>('[data-locker-focus]')?.focus({ preventScroll: true });
  }, [mapOpen, choice]);

  function closeMap() {
    restoreFocus.current = true;
    setMapOpen(false);
  }

  function choose(locker: BoxNowLocker) {
    writeLastLocker(safeLocalStorage(), locker);
    setLastUsed(locker);
    onChange({ kind: 'locker', locker });
    closeMap();
  }

  return (
    <Card className="checkout-review__panel rounded-none shadow-none" data-checkout-locker-panel>
      <CardContent className="checkout-review__panel-content checkout-locker__content" ref={panel}>
        <div className="checkout-review__panel-heading">
          <h2 className="checkout-review__panel-title">{CHECKOUT_LOCKER_COPY.title}</h2>
          {mapOpen ? (
            <Button type="button" variant="link" onClick={closeMap}>
              {CHECKOUT_LOCKER_COPY.cancel}
            </Button>
          ) : (
            <Badge variant="outline" className="checkout-review__badge rounded-none">
              {CHECKOUT_LOCKER_COPY.badge}
            </Badge>
          )}
        </div>

        {mapOpen ? (
          <BoxNowLockerMap
            onSelect={choose}
            onUnavailable={() => {
              onChange({ kind: 'fallback' });
              closeMap();
            }}
            skipLabel={CHECKOUT_LOCKER_COPY.skip}
          />
        ) : choice.kind === 'fallback' ? (
          <>
            <div className="checkout-locker__notice" role="status">
              <p className="checkout-locker__label">{CHECKOUT_LOCKER_COPY.unavailableLabel}</p>
              <p>{CHECKOUT_LOCKER_COPY.unavailable}</p>
            </div>
            <Button
              type="button"
              variant="link"
              className="self-start"
              disabled={disabled}
              data-locker-focus
              onClick={() => setMapOpen(true)}
            >
              {CHECKOUT_LOCKER_COPY.retry}
            </Button>
          </>
        ) : choice.kind === 'locker' ? (
          <>
            <div className="checkout-locker__chosen" data-checkout-locker-chosen>
              <Package aria-hidden="true" strokeWidth={1.6} />
              <p className="checkout-locker__name">{choice.locker.name}</p>
              {lockerAddressText(choice.locker) && (
                <p className="checkout-locker__address">{lockerAddressText(choice.locker)}</p>
              )}
              <p className="checkout-locker__id">{`Locker ${choice.locker.lockerId}`}</p>
            </div>
            <Button
              type="button"
              variant="link"
              className="self-start"
              disabled={disabled}
              data-locker-focus
              onClick={() => setMapOpen(true)}
            >
              {CHECKOUT_LOCKER_COPY.change}
            </Button>
            <p className="checkout-review__note">{CHECKOUT_LOCKER_COPY.pickupNote}</p>
          </>
        ) : (
          <>
            <p className="checkout-locker__intro">{CHECKOUT_LOCKER_COPY.intro}</p>
            {lastUsed && (
              <div className="checkout-locker__notice">
                <p className="checkout-locker__label">{CHECKOUT_LOCKER_COPY.lastUsed}</p>
                <p>{lastUsed.name}</p>
                <Button
                  type="button"
                  variant="link"
                  className="self-start"
                  disabled={disabled}
                  onClick={() => onChange({ kind: 'locker', locker: lastUsed })}
                >
                  {CHECKOUT_LOCKER_COPY.useLastUsed}
                </Button>
              </div>
            )}
            <Button
              type="button"
              variant="inverse"
              className="self-start"
              disabled={disabled}
              data-locker-focus
              onClick={() => setMapOpen(true)}
            >
              <MapPin aria-hidden="true" />
              {CHECKOUT_LOCKER_COPY.find}
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}

function safeLocalStorage(): Storage | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

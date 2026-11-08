import { useState } from 'react';
import { MapPin } from 'lucide-react';

import { Button } from '@/components/ui/button';
import BoxNowLockerMap from './BoxNowLockerMap';

export const LOCKER_FINDER_COPY = {
  title: 'Find a locker near you',
  intro: 'Search by area or postcode. This only shows lockers; you choose yours at checkout.',
  show: 'Show the locker map',
  close: 'Close map',
  unavailable: "BOX NOW's map is not available right now. You choose your locker at checkout.",
} as const;

/** Browse-only: a selection on this map is ignored, so it never prefills checkout or the last-used locker. */
export default function LockerFinder() {
  const [state, setState] = useState<'idle' | 'open' | 'unavailable'>('idle');

  return (
    <section className="locker-finder" aria-labelledby="locker-finder-title" data-locker-finder>
      <div className="checkout-review__panel-heading">
        <h2 id="locker-finder-title" className="checkout-review__panel-title">
          {LOCKER_FINDER_COPY.title}
        </h2>
        {state === 'open' && (
          <Button type="button" variant="link" onClick={() => setState('idle')}>
            {LOCKER_FINDER_COPY.close}
          </Button>
        )}
      </div>
      {state === 'open' ? (
        <BoxNowLockerMap onUnavailable={() => setState('unavailable')} />
      ) : state === 'unavailable' ? (
        <p className="checkout-locker__intro" role="status">
          {LOCKER_FINDER_COPY.unavailable}
        </p>
      ) : (
        <>
          <p className="checkout-locker__intro">{LOCKER_FINDER_COPY.intro}</p>
          <Button type="button" variant="inverse" className="self-start" onClick={() => setState('open')}>
            <MapPin aria-hidden="true" />
            {LOCKER_FINDER_COPY.show}
          </Button>
        </>
      )}
    </section>
  );
}

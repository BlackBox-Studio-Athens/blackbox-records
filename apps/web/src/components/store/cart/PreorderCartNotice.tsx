import * as React from 'react';

import { latestShipEstimate, shipEstimateText } from '@/platform/lib/preorder-estimate';
import type { CartLineItemSnapshot } from './store-cart';

export function PreorderCartNotice({
  lines,
  presentation = 'review',
}: {
  lines: readonly (Pick<CartLineItemSnapshot, 'preorder'> & Partial<Pick<CartLineItemSnapshot, 'title'>>)[];
  presentation?: 'drawer' | 'review';
}) {
  const headingId = React.useId();
  const estimates = lines.flatMap((line) => (line.preorder ? [line.preorder.shipEstimate] : []));
  if (!estimates.length) return null;
  const estimate = latestShipEstimate(estimates);
  const expected = estimate ? shipEstimateText(estimate) : null;
  const isDrawer = presentation === 'drawer';
  const availableCount = lines.length - estimates.length;
  const preorderTitles = lines.flatMap((line) => (line.preorder && line.title ? [line.title.toUpperCase()] : []));
  const waitingFor =
    preorderTitles.length === estimates.length
      ? preorderTitles.join(', ')
      : estimates.length === 1
        ? 'the pre-order'
        : 'the pre-orders';

  return (
    <section className="preorder-notice" aria-labelledby={headingId}>
      <h3 id={headingId}>{isDrawer ? 'Ships together' : 'Pre-order in this order'}</h3>
      <ol className="preorder-rail" role="list">
        <li className="preorder-rail__step">
          <span>Today</span>
          <span>Charged in full</span>
        </li>
        <li className="preorder-rail__step preorder-rail__step--later">
          <span>{expected ? expected.charAt(0).toUpperCase() + expected.slice(1) : 'When it arrives'}</span>
          <span>{isDrawer ? 'One parcel to your locker' : 'One parcel to your BOX NOW locker'}</span>
        </li>
      </ol>
      <p>
        {isDrawer
          ? availableCount
            ? `The in-stock ${availableCount === 1 ? 'item waits' : 'items wait'} for ${waitingFor} and ${availableCount === 1 ? 'travels' : 'travel'} with ${estimates.length === 1 ? 'it' : 'them'}. Want ${availableCount === 1 ? 'it' : 'them'} sooner? Check ${availableCount === 1 ? 'it' : 'them'} out as a separate order.`
            : `Your order ships in one parcel when ${estimates.length === 1 ? 'the pre-order arrives' : 'all pre-orders arrive'}. We email you if the estimate changes.`
          : `${expected ? `${waitingFor} ${estimates.length === 1 ? 'is' : 'are'} expected to ship ${expected.replace(/^on /, '')}. ` : ''}${availableCount ? `Your whole order, in-stock items included, waits and travels with ${estimates.length === 1 ? 'it' : 'them'}.` : `Your order ships in one parcel when ${estimates.length === 1 ? 'the pre-order arrives' : 'all pre-orders arrive'}.`} If the estimate changes we email you.`}
      </p>
    </section>
  );
}

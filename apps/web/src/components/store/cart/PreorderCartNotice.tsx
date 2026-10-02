import * as React from 'react';

import { latestShipEstimate, shipEstimateText } from '@/platform/lib/preorder-estimate';
import type { CartLineItemSnapshot } from './store-cart';

export function PreorderCartNotice({ lines }: { lines: readonly Pick<CartLineItemSnapshot, 'preorder'>[] }) {
  const headingId = React.useId();
  const estimates = lines.flatMap((line) => (line.preorder ? [line.preorder.shipEstimate] : []));
  if (!estimates.length) return null;
  const estimate = latestShipEstimate(estimates);
  const expected = estimate ? shipEstimateText(estimate) : null;

  return (
    <section className="preorder-notice" aria-labelledby={headingId}>
      <h3 id={headingId}>Pre-order in this order</h3>
      <ol className="preorder-rail" role="list">
        <li className="preorder-rail__step">
          <span>Today</span>
          <span>Charged in full</span>
        </li>
        <li className="preorder-rail__step preorder-rail__step--later">
          <span>{expected ? expected.charAt(0).toUpperCase() + expected.slice(1) : 'When it arrives'}</span>
          <span>One parcel to your BOX NOW locker</span>
        </li>
      </ol>
      <p>
        Your whole order, in-stock items included, ships in one parcel when the pre-order arrives. If the estimate
        changes we email you.
      </p>
    </section>
  );
}

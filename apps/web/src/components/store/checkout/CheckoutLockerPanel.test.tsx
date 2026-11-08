import * as React from 'react';
import { renderToString } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import CheckoutLockerPanel, { CHECKOUT_LOCKER_COPY, type CheckoutLockerChoice } from './CheckoutLockerPanel';
import { checkoutAttemptFingerprint } from './checkout-attempt';

const locker = {
  lockerId: '7721',
  name: 'BOX NOW STORE - Ακαδημίας 86 (Αθήνα)',
  addressLine: 'Ακαδημίας 86, Αθήνα',
  postalCode: '10672',
  countryCode: 'GR' as const,
};

function render(choice: CheckoutLockerChoice) {
  return renderToString(<CheckoutLockerPanel choice={choice} onChange={() => undefined} />);
}

describe('CheckoutLockerPanel', () => {
  it('asks for a locker without loading BOX NOW', () => {
    const html = render({ kind: 'none' });
    expect(html).toContain(CHECKOUT_LOCKER_COPY.title);
    expect(html).toContain(CHECKOUT_LOCKER_COPY.badge);
    expect(html).toContain(CHECKOUT_LOCKER_COPY.intro);
    expect(html).toContain(CHECKOUT_LOCKER_COPY.find);
    expect(html).not.toContain('<iframe');
    expect(html).not.toContain('boxnow.gr');
  });

  it('shows the chosen locker with its address, ID and pickup note', () => {
    const html = render({ kind: 'locker', locker });
    expect(html).toContain(locker.name);
    expect(html).toContain('Ακαδημίας 86, Αθήνα 10672');
    expect(html).toContain('Locker 7721');
    expect(html).toContain(CHECKOUT_LOCKER_COPY.change);
    expect(html).toContain(CHECKOUT_LOCKER_COPY.pickupNote);
    expect(html).not.toContain(CHECKOUT_LOCKER_COPY.find);
  });

  it('explains the fallback when the map is unavailable', () => {
    const html = render({ kind: 'fallback' });
    expect(html).toContain(CHECKOUT_LOCKER_COPY.unavailableLabel);
    expect(html).toContain('we email you to agree a locker before we ship');
    expect(html).toContain(CHECKOUT_LOCKER_COPY.retry);
    expect(html).not.toContain('<iframe');
  });
});

describe('checkout attempt fingerprint', () => {
  const base = { lines: [], newsletterOptIn: false, storeItemSlug: 'caregivers', variantId: 'variant_1' };

  it('changes when the locker or fallback changes', () => {
    const withLocker = checkoutAttemptFingerprint({ ...base, locker });
    expect(withLocker).not.toBe(checkoutAttemptFingerprint({ ...base, locker: { ...locker, lockerId: '7722' } }));
    expect(withLocker).not.toBe(checkoutAttemptFingerprint({ ...base, locker: 'fallback' }));
    expect(checkoutAttemptFingerprint(base)).toBe(checkoutAttemptFingerprint({ ...base, locker: undefined }));
  });
});

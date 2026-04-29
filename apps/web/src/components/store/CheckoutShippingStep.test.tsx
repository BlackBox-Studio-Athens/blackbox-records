import * as React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import CheckoutShippingStep from './CheckoutShippingStep';
import {
  createCheckoutShippingGateView,
  LOCAL_MOCK_BOX_NOW_LOCKER_SELECTION,
  normalizeCheckoutLockerSelection,
  readCheckoutShippingGateError,
} from './checkout-shipping-step-state';

describe('CheckoutShippingStep', () => {
  it('keeps payment unavailable before a locker is selected', () => {
    expect(
      createCheckoutShippingGateView({
        checkoutClientMode: 'mock',
        lockerSelection: null,
      }),
    ).toMatchObject({
      canContinueToPayment: false,
      isMockPickerAvailable: true,
      title: 'Choose your BOX NOW Locker',
      tone: 'empty',
    });
  });

  it('rejects non-Greece locker selections', () => {
    expect(
      createCheckoutShippingGateView({
        checkoutClientMode: 'mock',
        lockerSelection: {
          locker_id: 'locker_berlin',
          country_code: 'DE',
          locker_name_or_label: 'Berlin Locker',
        },
      }),
    ).toMatchObject({
      canContinueToPayment: false,
      title: 'Shipping limited to Greece',
      tone: 'blocked',
    });
  });

  it('allows a valid Greek locker selection to unlock payment', () => {
    expect(
      createCheckoutShippingGateView({
        checkoutClientMode: 'mock',
        lockerSelection: LOCAL_MOCK_BOX_NOW_LOCKER_SELECTION,
      }),
    ).toMatchObject({
      canContinueToPayment: true,
      selectedLocker: LOCAL_MOCK_BOX_NOW_LOCKER_SELECTION,
      tone: 'ready',
    });
    expect(readCheckoutShippingGateError(LOCAL_MOCK_BOX_NOW_LOCKER_SELECTION)).toBeNull();
  });

  it('keeps non-mock checkout fail-closed until the real picker exists', () => {
    const view = createCheckoutShippingGateView({
      checkoutClientMode: 'stripe',
      lockerSelection: LOCAL_MOCK_BOX_NOW_LOCKER_SELECTION,
    });

    expect(view).toMatchObject({
      canContinueToPayment: false,
      isMockPickerAvailable: false,
      title: 'Locker selection unavailable',
      tone: 'blocked',
    });
  });

  it('normalizes selected locker fields without adding extra data', () => {
    expect(
      normalizeCheckoutLockerSelection({
        locker_id: ' 4 ',
        country_code: ' gr ',
        locker_name_or_label: ' ΛΕΩΦΟΡΟΣ ΠΕΝΤΕΛΗΣ 125, 15234 ',
      }),
    ).toEqual(LOCAL_MOCK_BOX_NOW_LOCKER_SELECTION);
  });

  it('renders the local mock selector without BOX NOW credentials', () => {
    const markup = renderToStaticMarkup(
      <CheckoutShippingStep
        checkoutClientMode="mock"
        lockerSelection={null}
        onChangeLocker={() => undefined}
        onSelectLocker={() => undefined}
      />,
    );

    expect(markup).toContain('Choose your BOX NOW Locker');
    expect(markup).toContain('Use BOX NOW Test Locker');
    expect(markup).not.toContain('BOX_NOW_API');
    expect(markup).not.toContain('whsec_');
    expect(markup).not.toContain('sk_');
  });

  it('renders selected locker summary as accessible text outside any picker', () => {
    const markup = renderToStaticMarkup(
      <CheckoutShippingStep
        checkoutClientMode="mock"
        lockerSelection={LOCAL_MOCK_BOX_NOW_LOCKER_SELECTION}
        onChangeLocker={() => undefined}
        onSelectLocker={() => undefined}
      />,
    );

    expect(markup).toContain('data-checkout-shipping-ready="true"');
    expect(markup).toContain('ΛΕΩΦΟΡΟΣ ΠΕΝΤΕΛΗΣ 125, 15234');
    expect(markup).toContain('Greece');
    expect(markup).toContain('Change Locker');
  });
});

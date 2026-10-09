import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { DeliverySummary } from './DeliverySummary';

describe('delivery summary', () => {
  it.each(['review', 'drawer'] as const)(
    'discloses the quoted collection mode in %s without an exemption claim',
    (presentation) => {
      const quote = {
        tier: 'small' as const,
        amountMinor: 250,
        totalAmountMinor: 2730,
        merchandiseGrossMinor: 2480,
        currencyCode: 'EUR' as const,
      };
      const html = renderToStaticMarkup(
        <DeliverySummary
          loading={false}
          presentation={presentation}
          quote={{ ...quote, taxCollectionMode: 'NO_TAX_COLLECTED' }}
        />,
      );
      expect(html).toContain('No VAT is calculated or collected at checkout.');
      expect(html).not.toContain('VAT is included');
      expect(html).not.toContain('tax-exempt');
      const inclusive = renderToStaticMarkup(
        <DeliverySummary
          loading={false}
          presentation={presentation}
          quote={{ ...quote, taxCollectionMode: 'STRIPE_AUTOMATIC_TAX' }}
        />,
      );
      expect(inclusive).toContain('VAT is included, never added again.');
    },
  );
  it('uses authoritative amounts and locker copy in the drawer without a duplicate total', () => {
    const html = renderToStaticMarkup(
      <DeliverySummary
        presentation="drawer"
        loading={false}
        quote={{
          tier: 'medium',
          amountMinor: 350,
          totalAmountMinor: 4850,
          merchandiseGrossMinor: 4500,
          currencyCode: 'EUR',
        }}
      />,
    );
    expect(html).toContain('>Items</dt>');
    expect(html).toContain('>BOX NOW locker delivery</dt>');
    expect(html).toContain('€45.00');
    expect(html).toContain('€3.50');
    expect(html).toContain('Greece-only BOX NOW locker delivery. We arrange your locker with you before dispatch.');
    expect(html).not.toContain('Total, VAT included');
    expect(html).not.toContain('€48.50');
    expect(html).not.toContain('[DELIVERY FEE]');
  });

  it.each([
    ['small', 250, 2730],
    ['medium', 350, 2830],
  ] as const)('shows the %s charge within the gross total', (tier, amountMinor, totalAmountMinor) => {
    const html = renderToStaticMarkup(
      <DeliverySummary
        loading={false}
        quote={{ tier, amountMinor, totalAmountMinor, merchandiseGrossMinor: 2480, currencyCode: 'EUR' }}
      />,
    );
    expect(html).toContain('€24.80');
    expect(html).toContain(tier === 'small' ? '€2.50' : '€3.50');
    expect(html).toContain(tier === 'small' ? '€27.30' : '€28.30');
    expect(html).toContain('Total, charged today');
    expect(html).toContain('/terms/');
  });
  it('never presents an unavailable or loading quote as free delivery', () => {
    for (const loading of [true, false]) {
      const html = renderToStaticMarkup(<DeliverySummary loading={loading} quote={null} />);
      expect(html).toContain(loading ? 'Calculating delivery' : 'Delivery is unavailable');
      expect(html).not.toContain('€0.00');
    }
  });
  it('leaves the selected custom amount and exact VAT to payment', () => {
    const html = renderToStaticMarkup(
      <DeliverySummary
        loading={false}
        quote={{
          tier: 'small',
          amountMinor: 250,
          currencyCode: 'EUR',
          merchandiseGrossMinor: null,
          totalAmountMinor: null,
        }}
      />,
    );
    expect(html).toContain('Choose amount at payment');
    expect(html).toContain('Shown before payment');
    expect(html).toContain('€2.50');
    expect(html).not.toContain('€0.00');
  });
});

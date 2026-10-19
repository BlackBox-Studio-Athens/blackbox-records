import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { DeliverySummary } from './DeliverySummary';

describe('delivery summary', () => {
  it.each(['review', 'drawer'] as const)('offers recovery for a temporary failure in %s', (presentation) => {
    const html = renderToStaticMarkup(
      <DeliverySummary loading={false} quote={null} error="temporary" retry={() => {}} presentation={presentation} />,
    );
    expect(html).toContain('We couldn&#x27;t calculate delivery.');
    expect(html).toContain('Try delivery again');
    expect(html).not.toContain('Delivery is unavailable for this cart');
    const pending = renderToStaticMarkup(
      <DeliverySummary loading quote={null} retry={() => {}} retrying presentation={presentation} />,
    );
    expect(pending).toContain('Checking delivery…');
    expect(pending).toContain('disabled=""');
    expect(pending).toContain('aria-busy="true"');
  });

  it('asks for cart review instead of retrying an authoritative restriction', () => {
    const html = renderToStaticMarkup(
      <DeliverySummary loading={false} quote={null} error="unavailable" retry={() => {}} />,
    );
    expect(html).toContain('Delivery is unavailable for this cart. Please review the items.');
    expect(html).not.toContain('Try delivery again');
    expect(html).not.toContain('try again later');
  });

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
  it('uses authoritative amounts and locker copy with one visible drawer total', () => {
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
    expect(html).toContain('>Delivery</dt>');
    expect(html).toContain('€45.00');
    expect(html).toContain('€3.50');
    expect(html).toContain('BOX NOW locker delivery within Greece.');
    expect(html).not.toContain('Total, VAT included');
    expect(html).toContain('€48.50');
    expect(html.match(/>Total<\/dt>/g)).toHaveLength(1);
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
    expect(html).toContain('>Total</dt>');
    expect(html).toContain('does not mean home delivery');
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

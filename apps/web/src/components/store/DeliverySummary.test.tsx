import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { DeliverySummary } from './DeliverySummary';

describe('delivery summary', () => {
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
    expect(html).toContain('Total, VAT included');
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

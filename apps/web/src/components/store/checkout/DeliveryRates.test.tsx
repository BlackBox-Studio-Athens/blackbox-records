import { readFileSync } from 'node:fs';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { deliveryQuantityBands, priceDisclosure } from '@blackbox/api-client/public';
import DeliveryRates from './DeliveryRates';

describe('static terms delivery rates', () => {
  it('renders shared rates without a runtime API call or island', () => {
    const fetch = vi.spyOn(globalThis, 'fetch');
    const html = renderToStaticMarkup(<DeliveryRates />);
    expect(html).toContain(priceDisclosure);
    for (const band of deliveryQuantityBands) expect(html).toContain(`€${(band.amountMinor / 100).toFixed(2)}`);
    for (const label of ['1–4 items', '5–8 items', '9+ items']) expect(html).toContain(label);
    expect(fetch).not.toHaveBeenCalled();
    fetch.mockRestore();
    const page = readFileSync(new URL('../../../pages/terms/index.astro', import.meta.url), 'utf8');
    expect(page).toContain('<DeliveryRates />');
    expect(page).not.toMatch(/DeliveryRates\s+client:/);
  });
});

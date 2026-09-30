import { renderToStaticMarkup } from 'react-dom/server';
import { expect, it } from 'vitest';
import { ItemChangeRows, ItemPublishProgress } from './ItemChanges';
import type { ItemCommerceState } from '../../lib/item-commerce';

const commerce: ItemCommerceState = {
  variantId: 'variant',
  shop: 'on_sale',
  requiresLiveConfirmation: true,
  livePrice: { kind: 'fixed', currencyCode: 'EUR', amountMinor: 2200 },
  priceDraft: {
    collection: 'releases',
    recordId: 'low-tide',
    price: { kind: 'fixed', currencyCode: 'EUR', amountMinor: 2400 },
    liveAmountWhenStaged: 2200,
    attempt: null,
    revision: 'r1',
    updatedBy: null,
    updatedAt: '2026-09-30T12:00:00.000Z',
  },
};

it('lists the price, details and automatic shop checkout together, and keeps stock out', () => {
  const html = renderToStaticMarkup(
    <ItemChangeRows commerce={commerce} contentChanged putOnSale={false} onPutOnSale={() => {}} disabled={false} />,
  );
  expect(html).toContain('What goes live');
  expect(html).toContain('€22.00');
  expect(html).toContain('€24.00');
  expect(html).toContain('Details &amp; photos');
  expect(html).toContain('Shop checkout');
  expect(html).toContain('Automatic');
  expect(html).toContain('Stock is not part of publishing');
  expect(html).not.toContain('Put this item on sale');
});

it('offers the first sale only for a withheld item and omits unchanged rows', () => {
  const html = renderToStaticMarkup(
    <ItemChangeRows
      commerce={{ ...commerce, shop: 'ready_to_sell', priceDraft: null }}
      contentChanged={false}
      putOnSale={false}
      onPutOnSale={() => {}}
      disabled={false}
    />,
  );
  expect(html).toContain('Put this item on sale in the shop');
  expect(html).not.toContain('Shop checkout');
  expect(html).not.toContain('Details &amp; photos');
});

it('shows finished steps as done and offers Retry only on a failed step', () => {
  const html = renderToStaticMarkup(
    <ItemPublishProgress
      busy={false}
      onRetry={() => {}}
      steps={[
        { step: 'price', status: 'done', message: '€24.00 is live in the shop.' },
        { step: 'item', status: 'failed', message: 'The website update failed.' },
      ]}
    />,
  );
  expect(html).toContain('aria-label="Done"');
  expect(html).toContain('role="alert"');
  expect(html.match(/Retry/g)).toHaveLength(1);
});

it('never offers Retry on a failed website step, which needs a fresh review', () => {
  const html = renderToStaticMarkup(
    <ItemPublishProgress
      busy={false}
      onRetry={() => {}}
      steps={[{ step: 'content', status: 'failed', message: 'The website update failed.' }]}
    />,
  );
  expect(html).not.toContain('Retry');
});

import * as React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { PreorderCartNotice } from './PreorderCartNotice';
import type { ShipEstimate } from '@/platform/lib/preorder-estimate';

const scenarios: { name: string; estimates: (ShipEstimate | null)[]; arrival: string }[] = [
  { name: 'month', estimates: [{ kind: 'month', month: '2026-10', part: null }], arrival: 'Around October 2026' },
  { name: 'date', estimates: [{ kind: 'date', date: '2026-10-20' }], arrival: 'On 20 October 2026' },
  {
    name: 'latest month',
    estimates: [
      { kind: 'date', date: '2026-10-20' },
      { kind: 'month', month: '2026-11', part: 'early' },
    ],
    arrival: 'Around early November 2026',
  },
  {
    name: 'date after early month',
    estimates: [
      { kind: 'month', month: '2026-10', part: 'early' },
      { kind: 'date', date: '2026-10-20' },
    ],
    arrival: 'On 20 October 2026',
  },
  {
    name: 'unqualified month after its date',
    estimates: [
      { kind: 'date', date: '2026-10-20' },
      { kind: 'month', month: '2026-10', part: null },
    ],
    arrival: 'Around October 2026',
  },
  {
    name: 'latest month part',
    estimates: [
      { kind: 'month', month: '2026-10', part: 'early' },
      { kind: 'month', month: '2026-10', part: 'late' },
    ],
    arrival: 'Around late October 2026',
  },
  { name: 'withheld estimate', estimates: [null], arrival: 'When it arrives' },
  {
    name: 'withheld among dated lines',
    estimates: [{ kind: 'date', date: '2026-10-20' }, null],
    arrival: 'When it arrives',
  },
  {
    name: 'saved past estimate',
    estimates: [{ kind: 'month', month: '2026-01', part: null }],
    arrival: 'Around January 2026',
  },
];

describe('PreorderCartNotice', () => {
  it.each(scenarios)('shows one notice using the $name', ({ estimates, arrival }) => {
    const lines: React.ComponentProps<typeof PreorderCartNotice>['lines'] = [
      {},
      { preorder: null },
      ...estimates.map((shipEstimate) => ({ preorder: { shipEstimate } })),
    ];
    const markup = renderToStaticMarkup(<PreorderCartNotice lines={lines} />);
    expect(markup.match(/Pre-order in this order/g)).toHaveLength(1);
    expect(markup).toContain('class="preorder-notice"');
    expect(markup).toContain('class="preorder-rail" role="list"');
    expect(markup).toContain('class="preorder-rail__step preorder-rail__step--later"');
    expect(markup).toContain('Today');
    expect(markup).toContain('Charged in full');
    expect(markup).toContain(arrival);
    expect(markup).toContain('One parcel to your BOX NOW locker');
    expect(markup).toContain(
      'Your whole order, in-stock items included, ships in one parcel when the pre-order arrives. If the estimate changes we email you.',
    );
    const headingId = /aria-labelledby="([^"]+)"/.exec(markup)?.[1];
    expect(headingId).toBeTruthy();
    expect(markup).toContain(`<h3 id="${headingId}">Pre-order in this order</h3>`);
    expect(markup.match(/<li /g)).toHaveLength(2);
    if (arrival === 'When it arrives') expect(markup).not.toContain('October 2026');
  });

  it('renders nothing for empty, ordinary and legacy cart lines', () => {
    const carts: React.ComponentProps<typeof PreorderCartNotice>['lines'][] = [
      [],
      [{}],
      [{ preorder: null }],
      [{ preorder: undefined }],
    ];
    for (const lines of carts) {
      expect(renderToStaticMarkup(<PreorderCartNotice lines={lines} />)).toBe('');
    }
  });
});

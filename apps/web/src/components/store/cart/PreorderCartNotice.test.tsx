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
  it('names the expected record in review and never claims ordinary stock in a pre-order-only order', () => {
    const markup = renderToStaticMarkup(
      <PreorderCartNotice
        lines={[{ title: 'Lotus', preorder: { shipEstimate: { kind: 'month', month: '2026-11', part: null } } }]}
      />,
    );
    expect(markup).toContain('LOTUS is expected to ship around November 2026.');
    expect(markup).toContain('Your order ships together when the pre-order arrives.');
    expect(markup).not.toContain('in-stock items included');
    expect(markup).not.toContain('waits and travels');
  });

  it('names the pre-order holding a mixed drawer and offers a separate order for stock wanted sooner', () => {
    const markup = renderToStaticMarkup(
      <PreorderCartNotice
        presentation="drawer"
        lines={[
          { title: 'Lotus', preorder: { shipEstimate: { kind: 'month', month: '2026-11', part: 'mid' } } },
          { title: 'Against His-Story, Against Leviathan!', preorder: null },
        ]}
      />,
    );
    expect(markup).toContain('Ships together');
    expect(markup).toContain('Around mid November 2026');
    expect(markup).toContain('Charged in full');
    expect(markup).toContain('Together to your locker');
    expect(markup).toContain(
      'The in-stock item waits for LOTUS and travels with it. Want it sooner? Check it out as a separate order.',
    );
  });

  it('describes a pre-order-only drawer without inventing an in-stock line', () => {
    const markup = renderToStaticMarkup(
      <PreorderCartNotice
        presentation="drawer"
        lines={[
          { title: 'First', preorder: { shipEstimate: { kind: 'date', date: '2026-11-20' } } },
          { title: 'Second', preorder: { shipEstimate: { kind: 'month', month: '2026-12', part: null } } },
        ]}
      />,
    );
    expect(markup).toContain('Around December 2026');
    expect(markup).toContain('when all pre-orders arrive');
    expect(markup).not.toContain('in-stock');
    expect(markup).not.toContain('separate order');
  });

  it('withholds the whole parcel date when one pending estimate is unknown', () => {
    const markup = renderToStaticMarkup(
      <PreorderCartNotice
        presentation="drawer"
        lines={[
          { title: 'First', preorder: { shipEstimate: { kind: 'date', date: '2026-11-20' } } },
          { title: 'Second', preorder: { shipEstimate: null } },
          {},
          {},
        ]}
      />,
    );
    expect(markup).toContain('When it arrives');
    expect(markup).toContain('The in-stock items wait for FIRST, SECOND and travel with them.');
    expect(markup).not.toContain('November');
  });

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
    expect(markup).toContain('Together to your BOX NOW locker');
    expect(markup).toContain(
      `Your whole order, in-stock items included, waits and travels with ${estimates.length === 1 ? 'it' : 'them'}. If the estimate changes we email you.`,
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

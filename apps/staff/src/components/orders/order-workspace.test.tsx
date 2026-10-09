import * as React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { InternalOrderApiError, type InternalOrder } from './internal-order-api';
import { createOrderWorkspace } from './order-workspace';
import OrderDetail, { money, notificationStatus } from './OrderDetail';
import { exampleOrder } from './order-fixtures.test-support.ts';
import OrderWorkspace from './OrderWorkspace';
import { writeStaffLocation } from '../../lib/staff-navigation';

vi.mock('react', async (importOriginal) => ({
  ...(await importOriginal<typeof React>()),
  useEffect: vi.fn(),
}));
vi.mock('./order-workspace', async (importOriginal) => {
  const actual = await importOriginal<{ createOrderWorkspace: typeof createOrderWorkspace }>();
  return { ...actual, createOrderWorkspace: vi.fn(actual.createOrderWorkspace) };
});
vi.mock('../../lib/staff-query', () => ({ useStaffRead: vi.fn() }));
vi.mock('../../lib/staff-navigation', () => ({
  writeStaffLocation: vi.fn(),
  staffPages: vi.fn(() => []),
  rememberStaffPosition: vi.fn(),
  restoreStaffPosition: vi.fn(),
  returnStaffTask: vi.fn(),
}));
afterEach(() => vi.unstubAllGlobals());

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<T>((yes, no) => {
    resolve = yes;
    reject = no;
  });
  return { promise, resolve, reject };
}
const api = () => ({ list: vi.fn(async () => [exampleOrder]), detail: vi.fn(async () => exampleOrder) });

describe('Private order workspace concurrency', () => {
  it.each([401, 403])('clears both views on %i and rejects late successes or further retries', async (status) => {
    const client = api();
    const workspace = createOrderWorkspace(client);
    await workspace.loadList();
    await workspace.lookup('cs_test_example');
    const late = deferred<InternalOrder[]>();
    const denial = deferred<InternalOrder>();
    client.list.mockReturnValueOnce(late.promise);
    client.detail.mockReturnValueOnce(denial.promise);
    const list = workspace.loadList();
    const detail = workspace.lookup('cs_denied');
    denial.reject(new InternalOrderApiError(status));
    await detail;
    late.resolve([exampleOrder]);
    await list;
    await workspace.loadList();
    expect(workspace.getSnapshot()).toMatchObject({
      denied: true,
      session: null,
      list: { data: null },
      detail: { data: null },
    });
    expect(client.list).toHaveBeenCalledTimes(2);
  });
  it('also invalidates a late detail success after a list denial', async () => {
    const client = api();
    const workspace = createOrderWorkspace(client);
    const late = deferred<InternalOrder>();
    client.detail.mockReturnValueOnce(late.promise);
    client.list.mockRejectedValueOnce(new InternalOrderApiError(401));
    const detail = workspace.lookup('cs_test_example');
    await workspace.loadList();
    late.resolve(exampleOrder);
    await detail;
    expect(workspace.getSnapshot().detail.data).toBeNull();
  });
  it('ignores superseded filters and detail requests, including after returning to the list', async () => {
    const client = api();
    const workspace = createOrderWorkspace(client);
    const oldList = deferred<InternalOrder[]>();
    client.list.mockReturnValueOnce(oldList.promise);
    const old = workspace.loadList('paid');
    client.list.mockResolvedValueOnce([]);
    await workspace.loadList('needs_review');
    oldList.resolve([exampleOrder]);
    await old;
    expect(workspace.getSnapshot()).toMatchObject({ status: 'needs_review', list: { data: [] } });
    const oldDetail = deferred<InternalOrder>();
    client.detail.mockReturnValueOnce(oldDetail.promise);
    const lookup = workspace.lookup('old');
    await workspace.lookup('new');
    workspace.back();
    oldDetail.resolve(exampleOrder);
    await lookup;
    expect(workspace.getSnapshot()).toMatchObject({ selected: false, detail: { data: null } });
  });
  it('retains same-query stale data with read time, but clears data for failed new queries', async () => {
    const client = api();
    const workspace = createOrderWorkspace(client);
    await workspace.loadList('paid');
    const readAt = workspace.getSnapshot().list.readAt;
    client.list.mockRejectedValueOnce(new InternalOrderApiError(503));
    await workspace.loadList('paid');
    expect(workspace.getSnapshot().list).toMatchObject({ data: [exampleOrder], readAt, loading: false });
    expect(workspace.getSnapshot().list.error).toBeTruthy();
    client.list.mockRejectedValueOnce(new InternalOrderApiError(503));
    await workspace.loadList('needs_review');
    expect(workspace.getSnapshot().list.data).toBeNull();
    await workspace.lookup('first');
    const detailReadAt = workspace.getSnapshot().detail.readAt;
    client.detail.mockRejectedValueOnce(new InternalOrderApiError(503));
    await workspace.lookup('first');
    expect(workspace.getSnapshot().detail).toMatchObject({ data: exampleOrder, readAt: detailReadAt });
    client.detail.mockRejectedValueOnce(new InternalOrderApiError(404));
    await workspace.lookup('missing');
    expect(workspace.getSnapshot().detail).toMatchObject({ data: null, readAt: null });
  });
  it('inspects no-session rows without lookup and looks up sessions outside the recent list', async () => {
    const client = api();
    client.list.mockResolvedValueOnce([]);
    const workspace = createOrderWorkspace(client);
    await workspace.loadList();
    workspace.inspectUnbound({ ...exampleOrder, checkoutSessionId: null });
    expect(workspace.getSnapshot()).toMatchObject({ selected: true, session: null });
    expect(client.detail).not.toHaveBeenCalled();
    await workspace.lookup('cs_older');
    expect(client.detail).toHaveBeenCalledWith('cs_older');
    expect(workspace.getSnapshot().detail.data).toEqual(exampleOrder);
  });
  it('preserves stale provenance when inspecting an unbound row', async () => {
    const client = api();
    const workspace = createOrderWorkspace(client);
    await workspace.loadList();
    client.list.mockRejectedValueOnce(new InternalOrderApiError(503));
    await workspace.loadList();
    workspace.inspectUnbound({ ...exampleOrder, checkoutSessionId: null });
    expect(workspace.getSnapshot().detail.error).toBe(workspace.getSnapshot().list.error);
    expect(workspace.getSnapshot().detail.readAt).toBe(workspace.getSnapshot().list.readAt);
  });
});

describe('Order facts and notification language', () => {
  it('labels zero tax collection separately from tax liability and an unapplied rate', () => {
    if (exampleOrder.fulfillment.kind !== 'current') throw new Error('Expected paid fixture');
    const html = renderToStaticMarkup(
      <OrderDetail
        order={{
          ...exampleOrder,
          taxCollectionMode: 'NO_TAX_COLLECTED',
          fulfillment: {
            ...exampleOrder.fulfillment,
            deliveryVatMinor: 0,
            totalVatMinor: 0,
            lines: exampleOrder.fulfillment.lines.map((line) => ({ ...line, lineVatMinor: 0, taxRatePercent: null })),
          },
        }}
      />,
    );
    expect(html).toContain('VAT collected at checkout');
    expect(html).toContain('€0.00');
    expect(html).toContain('Not applied');
    expect(html).not.toContain('Total VAT (included)');
  });
  it('renders complete multi-line data, unknown historical VAT and escaped private text', () => {
    const html = renderToStaticMarkup(<OrderDetail order={exampleOrder} />);
    expect(html).toContain('Example LP');
    expect(html).toContain('Example tape');
    expect(html).toContain('€32.00');
    expect(html).toContain('Unknown');
    expect(html).toContain('not parcel dispatch or proof that an email was read');
    expect(money(null)).toBe('Unknown');
    expect(money(0)).toBe('€0.00');
    const review = renderToStaticMarkup(
      <OrderDetail
        order={{
          ...exampleOrder,
          status: 'needs_review',
          needsReviewReason: '<script>alert(1)</script>',
          fulfillment: { kind: 'incomplete', reason: 'incomplete_paid_fulfillment' },
        }}
      />,
    );
    expect(review).toContain('&lt;script&gt;');
    expect(review).not.toContain('<script>');
    expect(review).toContain('reason is unknown');
  });
  it.each(['stock_unavailable', 'line_mismatch', 'incomplete_fulfillment'])(
    'offers manual review guidance for %s',
    (reason) => {
      const html = renderToStaticMarkup(
        <OrderDetail order={{ ...exampleOrder, status: 'needs_review', needsReviewReason: reason }} />,
      );
      expect(html).toContain('Manual review required');
      expect(html).not.toContain('reason is unknown');
      expect(html).toContain('Do not treat this order as ready for normal fulfillment');
    },
  );
  it('keeps notification attention independent of payment', () => {
    const delivery = exampleOrder.deliveries[0];
    if (!delivery) throw new Error('Missing synthetic delivery');
    expect(notificationStatus(exampleOrder)).toBe('delivered');
    expect(notificationStatus({ ...exampleOrder, deliveries: [] })).toBeNull();
    expect(
      notificationStatus({
        ...exampleOrder,
        deliveries: [
          { ...delivery, status: 'pending' },
          { ...delivery, status: 'needs_review' },
        ],
      }),
    ).toBe('needs_review');
  });
});

it('sends complete search filters and cursors to the server', async () => {
  const search = vi.fn(async () => ({ items: [exampleOrder], nextCursor: 'next-page' }));
  const workspace = createOrderWorkspace({ ...api(), search });
  await workspace.loadList('paid', 'customer@example.com', 'pending');
  expect(search).toHaveBeenLastCalledWith({ status: 'paid', q: 'customer@example.com', notification: 'pending' });
  expect(workspace.getSnapshot().nextCursor).toBe('next-page');
  await workspace.loadList('paid', 'customer@example.com', 'pending', 'next-page');
  expect(search).toHaveBeenLastCalledWith({
    status: 'paid',
    q: 'customer@example.com',
    notification: 'pending',
    cursor: 'next-page',
  });
});

describe('Awaiting-stock orders', () => {
  it('clears the previous page cursor during a new filtered read and after failure, then uses fresh pagination', async () => {
    const search = vi.fn(async (): Promise<{ items: InternalOrder[]; nextCursor: string | null }> => ({
      items: [exampleOrder],
      nextCursor: 'old-next-page',
    }));
    const workspace = createOrderWorkspace({ ...api(), search });
    await workspace.loadList('paid', '', '', 'old-page');
    expect(workspace.getSnapshot().nextCursor).toBe('old-next-page');

    const pending = deferred<{ items: InternalOrder[]; nextCursor: string | null }>();
    search.mockReturnValueOnce(pending.promise);
    const filtered = workspace.loadList('paid', '', '', undefined, true);
    expect(workspace.getSnapshot()).toMatchObject({
      awaitingStock: true,
      cursor: undefined,
      nextCursor: null,
      list: { data: null, loading: true },
    });
    pending.reject(new InternalOrderApiError(503));
    await filtered;
    expect(workspace.getSnapshot()).toMatchObject({ nextCursor: null, list: { loading: false } });
    expect(workspace.getSnapshot().list.error).toBeTruthy();

    search.mockResolvedValueOnce({ items: [exampleOrder], nextCursor: 'filtered-next-page' });
    await workspace.loadList();
    expect(search).toHaveBeenLastCalledWith({ status: 'paid', awaitingStock: 'true' });
    expect(workspace.getSnapshot().nextCursor).toBe('filtered-next-page');
    search.mockResolvedValueOnce({ items: [exampleOrder], nextCursor: null });
    await workspace.loadList('paid', '', '', 'filtered-next-page');
    expect(search).toHaveBeenLastCalledWith({ status: 'paid', awaitingStock: 'true', cursor: 'filtered-next-page' });
    expect(workspace.getSnapshot().nextCursor).toBeNull();
  });

  it('keeps the filter across pages and retries, clears old filter rows, and turns it off', async () => {
    const search = vi.fn(async () => ({ items: [exampleOrder], nextCursor: 'next-page' }));
    const workspace = createOrderWorkspace({ ...api(), search });
    await workspace.loadList('paid', '', '', undefined, true);
    await workspace.loadList('paid', '', '', 'next-page');
    expect(search).toHaveBeenLastCalledWith({ status: 'paid', awaitingStock: 'true', cursor: 'next-page' });
    await workspace.loadList();
    expect(search).toHaveBeenLastCalledWith({ status: 'paid', awaitingStock: 'true' });
    search.mockRejectedValueOnce(new InternalOrderApiError(503));
    await workspace.loadList('paid', '', '', undefined, false);
    expect(search).toHaveBeenLastCalledWith({ status: 'paid' });
    expect(workspace.getSnapshot()).toMatchObject({ awaitingStock: false, list: { data: null } });
  });

  it.each([401, 403])('clears awaiting stock on access denial %i', async (status) => {
    const search = vi.fn(async () => ({ items: [exampleOrder], nextCursor: null }));
    const workspace = createOrderWorkspace({ ...api(), search });
    await workspace.loadList('paid', '', '', undefined, true);
    search.mockRejectedValueOnce(new InternalOrderApiError(status));
    await workspace.loadList();
    expect(workspace.getSnapshot()).toMatchObject({ denied: true, awaitingStock: false, list: { data: null } });
    vi.mocked(React.useEffect).mockClear();
    vi.mocked(createOrderWorkspace).mockReturnValueOnce(workspace);
    const html = renderToStaticMarkup(<OrderWorkspace backendBaseUrl="" />);
    vi.mocked(React.useEffect).mock.calls[1]?.[0]();
    expect(writeStaffLocation).toHaveBeenLastCalledWith('/orders/');
    expect(html).toContain('Access required');
    expect(html).not.toContain('Awaiting stock');
  });

  it.each(['true', 'false', 'unknown', ''])(
    'restores only the exact URL filter %j and writes it back',
    async (value) => {
      const search = vi.fn(async () => ({ items: [{ ...exampleOrder, awaitingStock: true }], nextCursor: null }));
      const workspace = createOrderWorkspace({ ...api(), search });
      const events = new Map<string, EventListener>();
      vi.stubGlobal('window', {
        location: { search: `?awaitingStock=${value}&cursor=page-two` },
        addEventListener: (name: string, listener: EventListener) => events.set(name, listener),
        removeEventListener: (name: string) => events.delete(name),
      });
      const render = () => {
        vi.mocked(React.useEffect).mockClear();
        vi.mocked(createOrderWorkspace).mockReturnValueOnce(workspace);
        return renderToStaticMarkup(<OrderWorkspace backendBaseUrl="" />);
      };
      render();
      const stop = vi.mocked(React.useEffect).mock.calls[0]?.[0]();
      await vi.waitFor(() => expect(workspace.getSnapshot().list.loading).toBe(false));
      expect(search).toHaveBeenLastCalledWith({
        cursor: 'page-two',
        ...(value === 'true' ? { awaitingStock: 'true' } : {}),
      });
      const html = render();
      expect(html).toContain('<span class="order-status">Awaiting stock</span>');
      expect(html).toContain('Paid, Awaiting stock"');
      expect(html.includes('checked=""')).toBe(value === 'true');
      vi.mocked(React.useEffect).mock.calls[2]?.[0]();
      expect(writeStaffLocation).toHaveBeenLastCalledWith(
        `/orders/?${value === 'true' ? 'awaitingStock=true&' : ''}cursor=page-two`,
        { pages: ['page-two'] },
      );
      // Browser history follows the same URL restore path.
      window.location.search = '?awaitingStock=true';
      events.get('popstate')?.(new Event('popstate'));
      await vi.waitFor(() => expect(workspace.getSnapshot().list.loading).toBe(false));
      expect(search).toHaveBeenLastCalledWith({ awaitingStock: 'true' });
      if (stop) stop();
    },
  );

  it('renders a meaningful empty filtered list and no awaiting-stock chip for ordinary rows', async () => {
    const search = vi.fn(async () => ({ items: [] as InternalOrder[], nextCursor: null }));
    const workspace = createOrderWorkspace({ ...api(), search });
    await workspace.loadList('', '', '', undefined, true);
    vi.mocked(createOrderWorkspace).mockReturnValueOnce(workspace);
    const html = renderToStaticMarkup(<OrderWorkspace backendBaseUrl="" />);
    expect(html).toContain('No orders awaiting stock match these filters.');
    expect(html).toContain('Clear filters');
    search.mockResolvedValueOnce({ items: [exampleOrder], nextCursor: null });
    await workspace.loadList('', '', '', undefined, false);
    vi.mocked(createOrderWorkspace).mockReturnValueOnce(workspace);
    const ordinary = renderToStaticMarkup(<OrderWorkspace backendBaseUrl="" />);
    expect(ordinary).not.toContain('<span class="order-status">Awaiting stock</span>');
    expect(ordinary).not.toContain('checked=""');
  });

  type Estimate = NonNullable<
    NonNullable<Extract<InternalOrder['fulfillment'], { kind: 'current' }>['lines'][number]['preorder']>['shipEstimate']
  >;
  it.each<[Estimate | null, string]>([
    [{ kind: 'month', month: '2026-10', part: null }, 'Pre-order · ships around October 2026 (shown at order time)'],
    [
      { kind: 'month', month: '2026-10', part: 'early' },
      'Pre-order · ships around early October 2026 (shown at order time)',
    ],
    [
      { kind: 'month', month: '2026-10', part: 'mid' },
      'Pre-order · ships around mid October 2026 (shown at order time)',
    ],
    [
      { kind: 'month', month: '2026-10', part: 'late' },
      'Pre-order · ships around late October 2026 (shown at order time)',
    ],
    [{ kind: 'date', date: '2026-10-20' }, 'Pre-order · ships on 20 October 2026 (shown at order time)'],
    [null, 'Pre-order (shown at order time)'],
  ])('renders the saved line estimate %j even after the hold ends', (shipEstimate, text) => {
    if (exampleOrder.fulfillment.kind !== 'current') throw new Error('Expected current fulfillment');
    const order: InternalOrder = {
      ...exampleOrder,
      awaitingStock: true,
      fulfillment: {
        ...exampleOrder.fulfillment,
        lines: exampleOrder.fulfillment.lines.map((line, index) =>
          index === 0 ? { ...line, preorder: { startedAt: '2026-09-01T00:00:00Z', shipEstimate } } : line,
        ),
      },
    };
    const waiting = renderToStaticMarkup(<OrderDetail order={order} />);
    expect(waiting).toContain('Awaiting stock. Hold this order until the pre-order copies arrive.');
    expect(waiting).toContain(text);
    expect(waiting.match(/shown at order time/g)).toHaveLength(1);
    expect(waiting).not.toContain('type="checkbox"');
    const released = renderToStaticMarkup(<OrderDetail order={{ ...order, awaitingStock: false }} />);
    expect(released).not.toContain('Hold this order');
    expect(released).toContain(text);
  });
});

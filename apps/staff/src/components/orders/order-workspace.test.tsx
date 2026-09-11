import * as React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { InternalOrderApiError, type InternalOrder } from '../../lib/backend/internal-order-api';
import { createOrderWorkspace } from './order-workspace';
import OrderDetail, { money, notificationStatus } from './OrderDetail';
import { exampleOrder } from './order-fixtures.test-support';

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

import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { ArrowRight, ChevronRight, Inbox, LockKeyhole, Mail, TriangleAlert } from 'lucide-react';
import StaffBack from '../StaffBack';
import {
  rememberStaffPosition,
  restoreStaffPosition,
  returnStaffTask,
  staffPages,
  writeStaffLocation,
} from '../../lib/staff-navigation';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { createInternalOrderApi, type InternalOrder, type OrderStatus } from '../../lib/backend/internal-order-api';
import { useStaffRead } from '../../lib/staff-query';
import { createOrderWorkspace } from './order-workspace';
import OrderDetail, { formatOrderTime, notificationStatus, OrderStatusLabel, paymentLabels } from './OrderDetail';

export default function OrderWorkspace({ backendBaseUrl }: { backendBaseUrl: string }) {
  const workspace = useMemo(() => createOrderWorkspace(createInternalOrderApi(backendBaseUrl)), [backendBaseUrl]);
  const state = useSyncExternalStore(workspace.subscribe, workspace.getSnapshot, workspace.getSnapshot);
  const [notification, setNotification] = useState<'' | 'pending' | 'needs_review'>('');
  const [search, setSearch] = useState('');
  const [previousCursors, setPreviousCursors] = useState<(string | undefined)[]>([]);
  const heading = useRef<HTMLHeadingElement>(null);
  const focusPending = useRef(false);
  const restoreListPosition = useRef(false);

  useEffect(() => {
    const followUrl = () => {
      focusPending.current = true;
      const params = new URLSearchParams(window.location.search);
      setPreviousCursors(staffPages(params.get('cursor') ?? '').slice(0, -1));
      const session = params.get('checkoutSessionId')?.trim();
      if (session) {
        void workspace.lookup(session);
        return;
      }
      workspace.back();
      restoreListPosition.current = true;
      const requested = params.get('status') as OrderStatus;
      const status = ['paid', 'not_paid', 'needs_review', 'pending_payment'].includes(requested) ? requested : '';
      const q = params.get('q') ?? '';
      const notification = params.get('notification');
      const filter = notification === 'pending' || notification === 'needs_review' ? notification : '';
      setSearch(q);
      setNotification(filter);
      void workspace.loadList(status, q, filter, params.get('cursor') ?? undefined);
    };
    followUrl();
    window.addEventListener('popstate', followUrl);
    return () => {
      workspace.invalidate();
      window.removeEventListener('popstate', followUrl);
    };
  }, [workspace]);

  useEffect(() => {
    if (state.denied) {
      setSearch('');
      setNotification('');
      setPreviousCursors([]);
      writeStaffLocation('/orders/');
      heading.current?.focus();
    } else if (focusPending.current) {
      focusPending.current = false;
      heading.current?.focus();
    }
  }, [state.selected, state.session, state.denied]);

  function openSession(session: string) {
    focusPending.current = true;
    rememberStaffPosition();
    writeStaffLocation(`/orders/?${new URLSearchParams({ checkoutSessionId: session })}`, { push: true, task: true });
    void workspace.lookup(session);
    document.getElementById('main')?.scrollTo(0, 0);
  }
  function inspect(order: InternalOrder) {
    if (order.checkoutSessionId) openSession(order.checkoutSessionId);
    else {
      focusPending.current = true;
      rememberStaffPosition();
      workspace.inspectUnbound(order);
      document.getElementById('main')?.scrollTo(0, 0);
    }
  }
  function back() {
    focusPending.current = true;
    if (state.session) returnStaffTask();
    else workspace.back();
  }
  useEffect(() => {
    if (state.selected || state.denied || state.list.loading || !state.list.data) return;
    const params = new URLSearchParams();
    if (state.status) params.set('status', state.status);
    if (state.query) params.set('q', state.query);
    if (state.notification) params.set('notification', state.notification);
    if (state.cursor) params.set('cursor', state.cursor);
    writeStaffLocation(`/orders/${params.size ? `?${params}` : ''}`, {
      pages: [...previousCursors.map((cursor) => cursor ?? ''), state.cursor ?? ''],
    });
    if (restoreListPosition.current) {
      restoreListPosition.current = false;
      restoreStaffPosition(heading.current);
    }
  }, [
    state.selected,
    state.denied,
    state.status,
    state.query,
    state.notification,
    state.cursor,
    state.list.data,
    state.list.loading,
  ]);
  const read = state.selected ? state.detail : state.list;
  const orders = state.list.data ?? [];
  useStaffRead(
    ['orders', state.session, state.status, state.query, state.notification, state.cursor],
    () =>
      state.selected && state.session
        ? workspace.lookup(state.session)
        : workspace.loadList(state.status, state.query, state.notification, state.cursor),
    { enabled: !state.denied, interval: 60_000 },
  );
  useEffect(() => {
    if (search === state.query && notification === state.notification) return;
    const timer = window.setTimeout(() => {
      if (!state.selected) {
        setPreviousCursors([]);
        void workspace.loadList(state.status, search, notification);
      }
    }, 300);
    return () => window.clearTimeout(timer);
  }, [search, notification]);

  if (state.denied)
    return (
      <div className="staff-workspace order-workspace order-access">
        <LockKeyhole size={36} aria-hidden="true" />
        <h1 ref={heading} tabIndex={-1}>
          Access required
        </h1>
        <p>
          Your staff session may have expired, or this account does not have access. Private order data has been
          cleared.
        </p>
        <p>Sign in with an allowed staff account and reload to continue.</p>
        <Button asChild>
          <a href="/orders/">
            Sign in again <ArrowRight size={18} aria-hidden="true" />
          </a>
        </Button>
      </div>
    );

  return (
    <div className="staff-workspace order-workspace">
      {state.selected &&
        (state.session ? (
          <StaffBack />
        ) : (
          <Button variant="ghost" onClick={back}>
            Back to Orders
          </Button>
        ))}
      <header className="order-heading">
        <div>
          <h1 ref={heading} tabIndex={-1}>
            {state.selected ? 'Order detail' : 'Orders'}
          </h1>
          <p className="order-muted">
            {state.selected ? (state.detail.data?.orderReference ?? 'Order details') : null}
          </p>
        </div>
        <div className="order-refresh">
          {read.readAt && <span className="order-muted">Read at {formatOrderTime(read.readAt)}</span>}
        </div>
      </header>
      {!state.selected && (
        <>
          <div className="order-toolbar">
            <label>
              Payment status
              <select
                value={state.status}
                onChange={(event) => {
                  setPreviousCursors([]);
                  void workspace.loadList(event.target.value as OrderStatus | '');
                }}
              >
                <option value="">All statuses</option>
                {Object.entries(paymentLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Email status
              <select
                value={notification}
                onChange={(event) => setNotification(event.target.value as typeof notification)}
              >
                <option value="">All emails</option>
                <option value="pending">Pending</option>
                <option value="needs_review">Needs review</option>
              </select>
            </label>
            <label htmlFor="order-search">
              Search orders
              <Input
                id="order-search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Name, email or order reference"
                autoComplete="off"
              />
            </label>
          </div>
        </>
      )}
      {read.error && (
        <div className="order-error" role="alert">
          <TriangleAlert size={21} aria-hidden="true" />
          <div>
            <strong>
              {read.data ? 'Automatic update failed. Showing the last saved information.' : 'Unable to load this view.'}
            </strong>
            <p>{read.error}</p>
            {read.readAt && <p>Last successful read: {formatOrderTime(read.readAt)}.</p>}
            <Button
              variant="outline"
              onClick={() => {
                if (state.selected && state.session) void workspace.lookup(state.session);
                else {
                  if (state.selected) back();
                  void workspace.loadList();
                }
              }}
              disabled={read.loading}
            >
              {state.selected && !state.session ? 'Return to list and retry' : 'Retry'}
            </Button>
          </div>
        </div>
      )}
      <div role="status" aria-live="polite" className="order-load-status">
        {read.loading
          ? read.data
            ? 'Refreshing saved order facts…'
            : 'Loading orders…'
          : !state.selected && state.list.data
            ? `${orders.length} ${orders.length === 1 ? 'order' : 'orders'} shown.`
            : ''}
      </div>
      {read.loading && !read.data && (
        <div className="order-skeleton" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
      )}
      {state.selected ? (
        state.detail.data && <OrderDetail order={state.detail.data} />
      ) : (
        <section aria-label="Recent orders" aria-busy={state.list.loading}>
          <div className="my-4 flex gap-2">
            {!!previousCursors.length && (
              <Button
                variant="outline"
                onClick={() => {
                  const previous = [...previousCursors];
                  const cursor = previous.pop();
                  setPreviousCursors(previous);
                  void workspace.loadList(state.status, search, notification, cursor);
                }}
              >
                Previous
              </Button>
            )}
            {state.nextCursor && (
              <Button
                variant="outline"
                onClick={() => {
                  setPreviousCursors([...previousCursors, state.cursor]);
                  void workspace.loadList(state.status, search, notification, state.nextCursor ?? undefined);
                }}
              >
                Next
              </Button>
            )}
          </div>
          {!!orders.length && (
            <>
              <div className="order-list-heading" aria-hidden="true">
                <span>Created / item</span>
                <span>Customer / total</span>
                <span>Payment</span>
                <span>Notifications</span>
                <span />
              </div>
              <ul className="order-list">
                {orders.map((order, index) => {
                  const attention = notificationStatus(order);
                  return (
                    <li key={`${order.checkoutSessionId ?? order.variantId}-${order.createdAt}-${index}`}>
                      <button
                        type="button"
                        onClick={() => inspect(order)}
                        className="order-row"
                        data-staff-row={order.checkoutSessionId ?? `${order.variantId}:${order.createdAt}`}
                        aria-label={`Open order: ${order.storeItemSlug}, ${formatOrderTime(order.createdAt)}, ${paymentLabels[order.status]}`}
                      >
                        <span className="order-row-created">
                          <time dateTime={order.createdAt}>{formatOrderTime(order.createdAt)}</time>
                          <small>
                            {order.fulfillment.kind === 'current'
                              ? order.fulfillment.lines.map((line) => line.displayName).join(', ')
                              : order.storeItemSlug}
                          </small>
                        </span>
                        <span>
                          {order.fulfillment.kind === 'current' ? (
                            <>
                              <span>{order.fulfillment.recipientName}</span>
                              <small className="block">
                                {order.fulfillment.amountTotalMinor === null
                                  ? 'Unknown total'
                                  : new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'EUR' }).format(
                                      order.fulfillment.amountTotalMinor / 100,
                                    )}
                              </small>
                            </>
                          ) : (
                            (order.orderReference ?? 'Payment not complete')
                          )}
                        </span>
                        <OrderStatusLabel status={order.status} />
                        <span className="order-row-notification">
                          {attention ? (
                            <OrderStatusLabel status={attention} />
                          ) : (
                            <span className="order-muted">
                              <Mail size={16} aria-hidden="true" />
                              None recorded
                            </span>
                          )}
                        </span>
                        <ChevronRight size={18} aria-hidden="true" />
                      </button>
                    </li>
                  );
                })}
              </ul>
            </>
          )}
          {state.list.data && !orders.length && (
            <div className="order-empty">
              <Inbox size={32} aria-hidden="true" />
              <h2>No matching orders</h2>
              <p>Try a different name, email, reference or filter.</p>
              <Button
                variant="outline"
                onClick={() => {
                  setSearch('');
                  setNotification('');
                  void workspace.loadList('', '', '');
                }}
              >
                Clear filters
              </Button>
            </div>
          )}
        </section>
      )}
      <footer className="order-footer">
        <LockKeyhole size={15} aria-hidden="true" />
        <span>
          Private order facts. Refunds, resends, customer contact and dispatch remain in the Commerce operations
          runbook.
        </span>
      </footer>
    </div>
  );
}

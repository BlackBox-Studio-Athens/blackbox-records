import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  ChevronRight,
  Inbox,
  LockKeyhole,
  Mail,
  RefreshCw,
  Search,
  TriangleAlert,
} from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { createInternalOrderApi, type InternalOrder, type OrderStatus } from '../../lib/backend/internal-order-api';
import { createOrderWorkspace } from './order-workspace';
import OrderDetail, { formatOrderTime, notificationStatus, OrderStatusLabel, paymentLabels } from './OrderDetail';

export default function OrderWorkspace({ backendBaseUrl }: { backendBaseUrl: string }) {
  const workspace = useMemo(() => createOrderWorkspace(createInternalOrderApi(backendBaseUrl)), [backendBaseUrl]);
  const state = useSyncExternalStore(workspace.subscribe, workspace.getSnapshot, workspace.getSnapshot);
  const [lookup, setLookup] = useState('');
  const [notification, setNotification] = useState('all');
  const heading = useRef<HTMLHeadingElement>(null);
  const focusPending = useRef(false);
  const listFocusIndex = useRef<number | null>(null);
  const listElement = useRef<HTMLUListElement>(null);

  useEffect(() => {
    const followUrl = () => {
      const session = new URLSearchParams(window.location.search).get('checkoutSessionId')?.trim();
      if (session) {
        setLookup(session);
        void workspace.lookup(session);
      } else workspace.back();
    };
    void workspace.loadList();
    followUrl();
    window.addEventListener('popstate', followUrl);
    return () => {
      workspace.invalidate();
      window.removeEventListener('popstate', followUrl);
    };
  }, [workspace]);

  useEffect(() => {
    if (state.denied) {
      setLookup('');
      window.history.replaceState(null, '', '/orders/');
      heading.current?.focus();
    } else if (focusPending.current) {
      focusPending.current = false;
      if (!state.selected && listFocusIndex.current !== null) {
        listElement.current?.querySelectorAll<HTMLButtonElement>('button')[listFocusIndex.current]?.focus();
      } else heading.current?.focus();
    }
  }, [state.selected, state.session, state.denied]);

  function openSession(session: string) {
    focusPending.current = true;
    window.history.pushState(null, '', `/orders/?${new URLSearchParams({ checkoutSessionId: session })}`);
    void workspace.lookup(session);
    window.scrollTo(0, 0);
  }
  function inspect(order: InternalOrder, index: number) {
    listFocusIndex.current = index;
    if (order.checkoutSessionId) openSession(order.checkoutSessionId);
    else {
      focusPending.current = true;
      window.history.pushState(null, '', '/orders/');
      workspace.inspectUnbound(order);
      window.scrollTo(0, 0);
    }
  }
  function back() {
    focusPending.current = true;
    window.history.pushState(null, '', '/orders/');
    workspace.back();
  }
  const read = state.selected ? state.detail : state.list;
  const orders = (state.list.data ?? []).filter(
    (order) => notification === 'all' || order.deliveries.some((delivery) => delivery.status === notification),
  );

  if (state.denied)
    return (
      <div className="order-workspace order-access">
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
    <div className="order-workspace">
      {state.selected && (
        <a
          className="order-back"
          href="/orders/"
          onClick={(event) => {
            event.preventDefault();
            back();
          }}
        >
          <ArrowLeft size={18} aria-hidden="true" />
          Back to recent orders
        </a>
      )}
      <header className="order-heading">
        <div>
          <p className="order-eyebrow">Protected workspace · Read only</p>
          <h1 ref={heading} tabIndex={-1}>
            {state.selected ? 'Order detail' : 'Orders'}
          </h1>
          <p className="order-muted">
            {state.selected
              ? (state.session ?? 'No session recorded · Detail available for this visit only')
              : 'Review payments, order details and notification exceptions.'}
          </p>
        </div>
        <div className="order-refresh">
          {(!state.selected || state.session) && (
            <Button
              variant="outline"
              disabled={read.loading}
              onClick={() => {
                if (state.selected && state.session) void workspace.lookup(state.session);
                else void workspace.loadList();
              }}
            >
              <RefreshCw
                size={17}
                aria-hidden="true"
                className={read.loading ? 'animate-spin motion-reduce:animate-none' : ''}
              />
              {read.loading ? 'Refreshing' : 'Refresh'}
            </Button>
          )}
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
                onChange={(event) => void workspace.loadList(event.target.value as OrderStatus | '')}
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
              Notifications in this subset
              <select value={notification} onChange={(event) => setNotification(event.target.value)}>
                <option value="all">All notifications</option>
                <option value="pending">Pending</option>
                <option value="needs_review">Needs review</option>
              </select>
            </label>
            <form
              onSubmit={(event) => {
                event.preventDefault();
                if (lookup.trim()) {
                  listFocusIndex.current = null;
                  openSession(lookup.trim());
                }
              }}
            >
              <label htmlFor="order-session">Find a Checkout Session</label>
              <div className="order-lookup">
                <Input
                  id="order-session"
                  value={lookup}
                  onChange={(event) => setLookup(event.target.value)}
                  placeholder="cs_…"
                  required
                  autoComplete="off"
                  spellCheck={false}
                />
                <Button type="submit" disabled={!lookup.trim()}>
                  <Search size={18} aria-hidden="true" />
                  Find order
                </Button>
              </div>
            </form>
          </div>
          <p className="order-coverage">
            <Inbox size={18} aria-hidden="true" />
            <span>
              Latest 100 orders by creation time
              {state.status ? ` with payment status “${paymentLabels[state.status]}”` : ', across all payment statuses'}
              . Notification filters cover this subset only. Older orders updated recently may be absent. Use a Checkout
              Session to look beyond this list.
            </span>
          </p>
        </>
      )}
      {read.error && (
        <div className="order-error" role="alert">
          <TriangleAlert size={21} aria-hidden="true" />
          <div>
            <strong>{read.data ? 'Refresh failed. Showing stale data.' : 'Unable to load this view.'}</strong>
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
            ? `${orders.length} ${orders.length === 1 ? 'order' : 'orders'} shown in this recent subset.`
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
          {!!orders.length && (
            <>
              <div className="order-list-heading" aria-hidden="true">
                <span>Created / item</span>
                <span>Session</span>
                <span>Payment</span>
                <span>Notifications</span>
                <span />
              </div>
              <ul className="order-list" ref={listElement}>
                {orders.map((order, index) => {
                  const attention = notificationStatus(order);
                  return (
                    <li key={`${order.checkoutSessionId ?? order.variantId}-${order.createdAt}-${index}`}>
                      <button
                        type="button"
                        onClick={() => inspect(order, index)}
                        className="order-row"
                        aria-label={`Open order: ${order.storeItemSlug}, ${formatOrderTime(order.createdAt)}, ${paymentLabels[order.status]}`}
                      >
                        <span className="order-row-created">
                          <time dateTime={order.createdAt}>{formatOrderTime(order.createdAt)}</time>
                          <small>{order.storeItemSlug}</small>
                        </span>
                        <span className="order-session">
                          {order.checkoutSessionId
                            ? order.checkoutSessionId.length > 22
                              ? `${order.checkoutSessionId.slice(0, 12)}…${order.checkoutSessionId.slice(-6)}`
                              : order.checkoutSessionId
                            : 'No session'}
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
              <h2>No orders in this subset</h2>
              <p>
                {notification !== 'all'
                  ? 'Try all notifications or another payment status.'
                  : 'Try another payment status or look up a known Checkout Session.'}{' '}
                This is not an all-clear for historical orders.
              </p>
              {notification !== 'all' && (
                <Button variant="outline" onClick={() => setNotification('all')}>
                  Show all notifications
                </Button>
              )}
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

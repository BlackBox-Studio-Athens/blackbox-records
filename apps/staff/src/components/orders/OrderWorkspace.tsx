import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  ListFilter,
  Inbox,
  LockKeyhole,
  Mail,
  TriangleAlert,
  RefreshCw,
  X,
} from 'lucide-react';
import StaffBack from '../../lib/StaffBack';
import {
  rememberStaffPosition,
  restoreStaffPosition,
  returnStaffTask,
  staffPages,
  writeStaffLocation,
} from '../../lib/staff-navigation';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { createInternalOrderApi, type InternalOrder, type OrderStatus } from './internal-order-api';
import { useStaffRead } from '../../lib/staff-query';
import { scrollWithLenis } from '../../lib/lenis-scroll';
import {
  activeOrderFilters,
  createOrderWorkspace,
  orderListLocation,
  orderListView,
  parseOrderListLocation,
  toShipFilters,
  type OrderListFilters,
} from './order-workspace';
import OrderDetail, { formatOrderTime, notificationStatus, OrderStatusLabel, paymentLabels } from './OrderDetail';

export default function OrderWorkspace({ backendBaseUrl }: { backendBaseUrl: string }) {
  const workspace = useMemo(() => createOrderWorkspace(createInternalOrderApi(backendBaseUrl)), [backendBaseUrl]);
  const state = useSyncExternalStore(workspace.subscribe, workspace.getSnapshot, workspace.getSnapshot);
  const [notification, setNotification] = useState<'' | 'pending' | 'needs_review'>('');
  const [search, setSearch] = useState('');
  const [previousCursors, setPreviousCursors] = useState<(string | undefined)[]>([]);
  const [filtersOpen, setFiltersOpen] = useState(false);
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
      const filters = parseOrderListLocation(window.location.search);
      setSearch(filters.query);
      setNotification(filters.notification);
      void workspace.loadList(
        filters.status,
        filters.query,
        filters.notification,
        filters.cursor,
        filters.awaitingStock,
        filters.notShipped,
      );
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
    scrollWithLenis(document.getElementById('main'), 0, { immediate: true });
  }

  function inspect(order: InternalOrder) {
    if (order.checkoutSessionId) openSession(order.checkoutSessionId);
    else {
      focusPending.current = true;
      rememberStaffPosition();
      workspace.inspectUnbound(order);
      scrollWithLenis(document.getElementById('main'), 0, { immediate: true });
    }
  }

  function back() {
    focusPending.current = true;
    if (state.session) returnStaffTask();
    else workspace.back();
  }

  useEffect(() => {
    if (state.selected || state.denied || state.list.loading || !state.list.data) return;
    writeStaffLocation(orderListLocation(state), {
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
    state.awaitingStock,
    state.notShipped,
    state.cursor,
    state.list.data,
    state.list.loading,
  ]);
  const read = state.selected ? state.detail : state.list;
  const view = orderListView(state);
  const filterCount = activeOrderFilters(state);
  function showFilters(filters: OrderListFilters) {
    setSearch(filters.query);
    setNotification(filters.notification);
    setPreviousCursors([]);
    void workspace.loadList(
      filters.status,
      filters.query,
      filters.notification,
      undefined,
      filters.awaitingStock,
      filters.notShipped,
    );
  }
  const pagination = (
    <div className="order-pagination">
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
          <ChevronLeft aria-hidden="true" />
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
          <ChevronRight aria-hidden="true" />
        </Button>
      )}
    </div>
  );
  const orders = state.list.data ?? [];
  useStaffRead(
    [
      'orders',
      state.session,
      state.status,
      state.query,
      state.notification,
      state.awaitingStock,
      state.notShipped,
      state.cursor,
    ],
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
            <ChevronLeft aria-hidden="true" />
            Back to Orders
          </Button>
        ))}
      <header className="order-heading">
        <div>
          <h1 ref={heading} tabIndex={-1} className="staff-page-title">
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
        <div className="order-views">
          <div className="order-view-choice" role="group" aria-label="Orders to show">
            <button type="button" aria-pressed={view === 'to_ship'} onClick={() => showFilters(toShipFilters)}>
              To ship
            </button>
            <button
              type="button"
              aria-pressed={view === 'all'}
              onClick={() =>
                showFilters({ status: '', query: '', notification: '', awaitingStock: false, notShipped: false })
              }
            >
              All orders
            </button>
          </div>
          <Button
            variant="outline"
            className="order-filters-toggle"
            aria-expanded={filtersOpen}
            aria-controls="order-filters"
            onClick={() => setFiltersOpen(!filtersOpen)}
          >
            <ListFilter aria-hidden="true" />
            Filters{filterCount ? ` (${filterCount})` : ''}
          </Button>
        </div>
      )}
      {!state.selected && (
        <div className="order-toolbar" id="order-filters" data-open={filtersOpen}>
          <div className="col-span-full flex flex-wrap gap-x-6 gap-y-2">
            <label>
              <span className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={state.awaitingStock}
                  onChange={(event) => {
                    setPreviousCursors([]);
                    void workspace.loadList(state.status, search, notification, undefined, event.target.checked);
                  }}
                />
                Awaiting stock
              </span>
            </label>
            <label>
              <span className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={state.notShipped}
                  onChange={(event) => {
                    setPreviousCursors([]);
                    void workspace.loadList(
                      state.status,
                      search,
                      notification,
                      undefined,
                      state.awaitingStock,
                      event.target.checked,
                    );
                  }}
                />
                Not shipped
              </span>
            </label>
          </div>
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
              maxLength={200}
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Name, email or order reference"
              autoComplete="off"
            />
          </label>
        </div>
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
              <RefreshCw aria-hidden="true" />
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
        state.detail.data && (
          <OrderDetail
            order={state.detail.data}
            onSetDispatch={
              state.session ? (shipped, sendEmail) => workspace.setDispatch(shipped, sendEmail) : undefined
            }
          />
        )
      ) : (
        <section aria-label="Recent orders" aria-busy={state.list.loading}>
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
                        aria-label={`Open order: ${order.fulfillment.kind === 'current' ? `${order.fulfillment.recipientName}, ` : ''}${order.storeItemSlug}, ${formatOrderTime(order.createdAt)}, ${paymentLabels[order.status]}${order.status === 'paid' ? (order.dispatch.shippedAt ? ', Shipped' : ', Not shipped') : ''}${order.awaitingStock ? ', Awaiting stock' : ''}`}
                      >
                        <span className="order-row-created">
                          <time dateTime={order.createdAt}>{formatOrderTime(order.createdAt)}</time>
                          <small>
                            {order.fulfillment.kind === 'current'
                              ? order.fulfillment.lines.map((line) => line.displayName).join(', ')
                              : order.storeItemSlug}
                          </small>
                          {order.status === 'paid' && (
                            <span className={`order-status ${order.dispatch.shippedAt ? 'order-status--paid' : ''}`}>
                              {order.dispatch.shippedAt ? 'Shipped' : 'Not shipped'}
                            </span>
                          )}
                          {order.awaitingStock && <span className="order-status">Awaiting stock</span>}
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
                            <>
                              <span className="order-muted">No customer yet</span>
                              {order.orderReference && (
                                <small className="block order-muted">Ref {order.orderReference.slice(0, 8)}</small>
                              )}
                            </>
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
          {(orders.length > 0 || previousCursors.length > 0) && pagination}
          {state.list.data && !orders.length && (
            <div className="order-empty">
              <Inbox size={32} aria-hidden="true" />
              <h2>No matching orders</h2>
              <p>
                {state.notShipped
                  ? 'No unshipped paid orders match these filters. Try another filter or clear filters to see all orders.'
                  : state.awaitingStock
                    ? 'No orders awaiting stock match these filters. Try another filter or clear filters to see all orders.'
                    : 'Try a different name, email, reference or filter.'}
              </p>
              <Button
                variant="outline"
                onClick={() => {
                  setSearch('');
                  setNotification('');
                  setPreviousCursors([]);
                  void workspace.loadList('', '', '', undefined, false, false);
                }}
              >
                <X aria-hidden="true" />
                Clear filters
              </Button>
            </div>
          )}
        </section>
      )}
      <footer className="order-footer">
        <LockKeyhole size={15} aria-hidden="true" />
        <span>
          Private order facts. Refunds, resends and customer contact remain in the Commerce operations runbook.
        </span>
      </footer>
    </div>
  );
}

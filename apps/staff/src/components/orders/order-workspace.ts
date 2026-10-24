import {
  InternalOrderApiError,
  type createInternalOrderApi,
  type InternalOrder,
  type OrderStatus,
} from './internal-order-api';

type ReadState<T> = { data: T | null; readAt: string | null; loading: boolean; error: string | null };
const emptyRead = <T>(): ReadState<T> => ({ data: null, readAt: null, loading: false, error: null });

export function createOrderWorkspace(
  api: Pick<ReturnType<typeof createInternalOrderApi>, 'list' | 'detail'> &
    Partial<Pick<ReturnType<typeof createInternalOrderApi>, 'search' | 'setDispatch'>>,
) {
  let state = {
    denied: false,
    status: '' as OrderStatus | '',
    query: '',
    notification: '' as '' | 'pending' | 'needs_review',
    awaitingStock: false,
    notShipped: false,
    nextCursor: null as string | null,
    cursor: undefined as string | undefined,
    selected: false,
    session: null as string | null,
    list: emptyRead<InternalOrder[]>(),
    detail: emptyRead<InternalOrder>(),
  };
  const listeners = new Set<() => void>();
  let listRequest = 0;
  let detailRequest = 0;
  function publish(update: Partial<typeof state>) {
    state = { ...state, ...update };
    listeners.forEach((listener) => listener());
  }
  function denied(error: unknown) {
    if (error instanceof InternalOrderApiError && (error.status === 401 || error.status === 403)) {
      listRequest++;
      detailRequest++;
      publish({
        denied: true,
        query: '',
        notification: '',
        awaitingStock: false,
        notShipped: false,
        cursor: undefined,
        nextCursor: null,
        list: emptyRead(),
        detail: emptyRead(),
        session: null,
        selected: false,
      });
      return true;
    }
    return false;
  }
  const message = (error: unknown) =>
    error instanceof InternalOrderApiError ? error.message : 'Orders could not be read. Please try again.';

  const workspace = {
    getSnapshot: () => state,
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    invalidate() {
      listRequest++;
      detailRequest++;
    },
    async loadList(
      status = state.status,
      query = state.query,
      notification = state.notification,
      cursor?: string,
      awaitingStock = state.awaitingStock,
      notShipped = state.notShipped,
    ) {
      if (state.denied) return;
      const request = ++listRequest;
      const previous =
        status === state.status &&
        query === state.query &&
        notification === state.notification &&
        awaitingStock === state.awaitingStock &&
        notShipped === state.notShipped
          ? state.list
          : emptyRead<InternalOrder[]>();
      publish({
        status,
        query,
        notification,
        awaitingStock,
        notShipped,
        cursor,
        nextCursor: null,
        list: { ...previous, loading: true, error: null },
      });
      try {
        const page = api.search
          ? await api.search({
              ...(status ? { status } : {}),
              ...(query ? { q: query } : {}),
              ...(notification ? { notification } : {}),
              ...(awaitingStock ? { awaitingStock: 'true' as const } : {}),
              ...(notShipped ? { dispatch: 'not_shipped' as const } : {}),
              ...(cursor ? { cursor } : {}),
            })
          : { items: await api.list(status || undefined), nextCursor: null };
        const data = page.items;
        if (request !== listRequest || state.denied) return;
        publish({
          nextCursor: page.nextCursor,
          list: { data, readAt: new Date().toISOString(), loading: false, error: null },
        });
      } catch (error) {
        if (denied(error) || request !== listRequest) return;
        publish({ list: { ...previous, loading: false, error: message(error) } });
      }
    },
    async lookup(session: string) {
      if (state.denied) return;
      const request = ++detailRequest;
      const previous = state.selected && session === state.session ? state.detail : emptyRead<InternalOrder>();
      publish({ selected: true, session, detail: { ...previous, loading: true, error: null } });
      try {
        const data = await api.detail(session);
        if (request !== detailRequest || state.denied) return;
        publish({ detail: { data, readAt: new Date().toISOString(), loading: false, error: null } });
      } catch (error) {
        if (denied(error) || request !== detailRequest) return;
        publish({ detail: { ...previous, loading: false, error: message(error) } });
      }
    },
    /** Returns an error message, or null once the changed order is shown. */
    async setDispatch(shipped: boolean, sendShippingEmail = true): Promise<string | null> {
      const session = state.session;
      if (state.denied || !session || !api.setDispatch) return 'Reload this order and try again.';
      try {
        const data = await api.setDispatch(session, { shipped, expectedShipped: !shipped, sendShippingEmail });
        detailRequest++;
        if (state.session === session)
          publish({ detail: { data, readAt: new Date().toISOString(), loading: false, error: null } });
        return null;
      } catch (error) {
        if (denied(error)) return null;
        if (error instanceof InternalOrderApiError && error.status === 409) void workspace.lookup(session);
        return message(error);
      }
    },
    inspectUnbound(order: InternalOrder) {
      if (state.denied) return;
      detailRequest++;
      publish({
        selected: true,
        session: null,
        detail: { data: order, readAt: state.list.readAt, error: state.list.error, loading: false },
      });
    },
    back() {
      detailRequest++;
      publish({ selected: false, session: null, detail: emptyRead() });
    },
  };
  return workspace;
}

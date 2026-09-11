import {
  InternalOrderApiError,
  type createInternalOrderApi,
  type InternalOrder,
  type OrderStatus,
} from '../../lib/backend/internal-order-api';

type ReadState<T> = { data: T | null; readAt: string | null; loading: boolean; error: string | null };
const emptyRead = <T>(): ReadState<T> => ({ data: null, readAt: null, loading: false, error: null });

export function createOrderWorkspace(api: ReturnType<typeof createInternalOrderApi>) {
  let state = {
    denied: false,
    status: '' as OrderStatus | '',
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
      publish({ denied: true, list: emptyRead(), detail: emptyRead(), session: null, selected: false });
      return true;
    }
    return false;
  }
  const message = (error: unknown) =>
    error instanceof InternalOrderApiError ? error.message : 'Orders could not be read. Please try again.';

  return {
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
    async loadList(status = state.status) {
      if (state.denied) return;
      const request = ++listRequest;
      const previous = status === state.status ? state.list : emptyRead<InternalOrder[]>();
      publish({ status, list: { ...previous, loading: true, error: null } });
      try {
        const data = await api.list(status || undefined);
        if (request !== listRequest || state.denied) return;
        publish({ list: { data, readAt: new Date().toISOString(), loading: false, error: null } });
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
}

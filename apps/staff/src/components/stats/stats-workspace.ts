import {
  InternalAnalyticsApiError,
  type StaffStatsQuery,
  type StaffStatsReport,
} from '../../lib/backend/internal-analytics-api';

export type StatsRead = {
  data: StaffStatsReport | null;
  loading: boolean;
  error: { message: string; requestId?: string | undefined } | null;
  readAt: number;
};
export type StatsState = { denied: boolean; reads: Record<string, StatsRead> };
export const idleRead: StatsRead = { data: null, loading: false, error: null, readAt: 0 };
export const statsQueryKey = (query: StaffStatsQuery) =>
  JSON.stringify(
    Object.entries(query)
      .filter(([, value]) => value !== undefined)
      .sort(([a], [b]) => a.localeCompare(b)),
  );

/** Source-local bounded snapshots; identity is the entire query, never just its date range. */
export function createStatsWorkspace(read: (query: StaffStatsQuery) => Promise<StaffStatsReport>) {
  let state: StatsState = { denied: false, reads: {} };
  let serial = 0;
  const pending = new Map<string, number>(),
    listeners = new Set<() => void>();
  const publish = (update: Partial<StatsState>) => {
    state = { ...state, ...update };
    listeners.forEach((listener) => listener());
  };
  const deny = () => {
    pending.clear();
    publish({ denied: true, reads: {} });
  };
  const setRead = (key: string, value: StatsRead) => {
    const reads = { ...state.reads, [key]: value };
    const keys = Object.keys(reads);
    while (keys.length > 12) {
      const oldest = keys.shift()!;
      if (oldest !== key) delete reads[oldest];
    }
    publish({ reads });
  };
  return {
    getSnapshot: () => state,
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => void listeners.delete(listener);
    },
    deny,
    async load(query: StaffStatsQuery, force = false) {
      if (state.denied) return;
      const key = statsQueryKey(query),
        previous = state.reads[key] ?? idleRead;
      if (!force && (previous.loading || (previous.data && Date.now() - previous.readAt < 60_000))) return;
      const request = ++serial;
      pending.set(key, request);
      setRead(key, { ...previous, loading: true, error: null });
      try {
        const data = await read(query);
        if (pending.get(key) !== request || state.denied) return;
        setRead(key, { data, loading: false, error: null, readAt: Date.now() });
      } catch (error) {
        if (pending.get(key) !== request || state.denied) return;
        if (error instanceof InternalAnalyticsApiError && (error.status === 401 || error.status === 403)) {
          deny();
          return;
        }
        setRead(key, {
          data: previous.data,
          readAt: previous.readAt,
          loading: false,
          error:
            error instanceof InternalAnalyticsApiError
              ? { message: error.message, requestId: error.requestId }
              : { message: 'These figures are temporarily unavailable. Try again.' },
        });
      } finally {
        if (pending.get(key) === request) pending.delete(key);
      }
    },
  };
}

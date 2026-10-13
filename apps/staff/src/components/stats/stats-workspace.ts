import { InternalAnalyticsApiError, type SiteAnalyticsRange } from '../../lib/backend/internal-analytics-api';

export type StatsRead<T> = {
  data: T | null;
  loading: boolean;
  error: { message: string; requestId?: string | undefined } | null;
};
export type StatsState<T> = {
  range: SiteAnalyticsRange;
  denied: boolean;
  reads: Record<SiteAnalyticsRange, StatsRead<T>>;
};

const idle = <T>(): StatsRead<T> => ({ data: null, loading: false, error: null });

/** One Stats source (visits, store or search): per-range reads, stale snapshots and Access denial. */
export function createStatsWorkspace<T>(
  read: (range: SiteAnalyticsRange) => Promise<T>,
  unavailable: string,
  range: SiteAnalyticsRange = '7d',
) {
  let state: StatsState<T> = { range, denied: false, reads: { '7d': idle(), '30d': idle() } };
  const listeners = new Set<() => void>();
  const requests: Record<SiteAnalyticsRange, number> = { '7d': 0, '30d': 0 };
  const publish = (update: Partial<StatsState<T>>) => {
    state = { ...state, ...update };
    listeners.forEach((listener) => listener());
  };
  const setRead = (key: SiteAnalyticsRange, value: StatsRead<T>) =>
    publish({ reads: { ...state.reads, [key]: value } });

  return {
    getSnapshot: () => state,
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => void listeners.delete(listener);
    },
    async load(key: SiteAnalyticsRange = state.range) {
      if (state.denied) return;
      const request = ++requests[key];
      const previous = state.reads[key];
      publish({ range: key });
      setRead(key, { ...previous, loading: true, error: null });
      try {
        const data = await read(key);
        if (request !== requests[key] || state.denied) return;
        setRead(key, { data, loading: false, error: null });
      } catch (error) {
        if (request !== requests[key]) return;
        if (error instanceof InternalAnalyticsApiError && (error.status === 401 || error.status === 403)) {
          requests['7d']++;
          requests['30d']++;
          publish({ denied: true, reads: { '7d': idle(), '30d': idle() } });
          return;
        }
        // Keep the last successful snapshot; the view labels it as stale.
        setRead(key, {
          data: previous.data,
          loading: false,
          error:
            error instanceof InternalAnalyticsApiError
              ? { message: error.message, requestId: error.requestId }
              : { message: unavailable },
        });
      }
    },
  };
}

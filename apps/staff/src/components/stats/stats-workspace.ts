import {
  InternalAnalyticsApiError,
  type createInternalAnalyticsApi,
  type SiteAnalytics,
  type SiteAnalyticsRange,
} from '../../lib/backend/internal-analytics-api';

export type StatsRead = {
  data: SiteAnalytics | null;
  loading: boolean;
  error: { message: string; requestId?: string | undefined } | null;
};
export type StatsState = { range: SiteAnalyticsRange; denied: boolean; reads: Record<SiteAnalyticsRange, StatsRead> };

const idle = (): StatsRead => ({ data: null, loading: false, error: null });

export function createStatsWorkspace(
  api: Pick<ReturnType<typeof createInternalAnalyticsApi>, 'readAnalytics'>,
  range: SiteAnalyticsRange = '7d',
) {
  let state: StatsState = { range, denied: false, reads: { '7d': idle(), '30d': idle() } };
  const listeners = new Set<() => void>();
  const requests: Record<SiteAnalyticsRange, number> = { '7d': 0, '30d': 0 };
  const publish = (update: Partial<StatsState>) => {
    state = { ...state, ...update };
    listeners.forEach((listener) => listener());
  };
  const setRead = (key: SiteAnalyticsRange, read: StatsRead) => publish({ reads: { ...state.reads, [key]: read } });

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
        const data = await api.readAnalytics(key);
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
        // Keep the last successful snapshot; the view labels it with its own generatedAt.
        setRead(key, {
          data: previous.data,
          loading: false,
          error:
            error instanceof InternalAnalyticsApiError
              ? { message: error.message, requestId: error.requestId }
              : { message: 'Analytics is temporarily unavailable. Try again.' },
        });
      }
    },
  };
}

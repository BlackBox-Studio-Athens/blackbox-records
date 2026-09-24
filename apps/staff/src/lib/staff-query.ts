import { QueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useRef, useSyncExternalStore } from 'react';

// A document owns its cache. Protected reads are never persisted to browser storage.
const staffQueries = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30_000, gcTime: 300_000, retry: false, refetchOnWindowFocus: true, refetchOnReconnect: true },
  },
});

export function readStaffQuery<T>(key: readonly unknown[], read: () => Promise<T>): Promise<T> {
  return staffQueries.fetchQuery({ queryKey: key, queryFn: read, staleTime: 0 });
}

export function setStaffQueryData<T>(key: readonly unknown[], data: T) {
  staffQueries.setQueryData(key, data);
}

export function invalidateStaffQuery(key: readonly unknown[]) {
  return staffQueries.invalidateQueries({ queryKey: key, exact: true, refetchType: 'none' });
}

export async function refreshStaffQuery<T>(key: readonly unknown[], read: () => Promise<T>) {
  await invalidateStaffQuery(key);
  return staffQueries.fetchQuery({ queryKey: key, queryFn: read, staleTime: 0 });
}

export function useSharedStaffRead<T>(key: readonly unknown[], read: () => Promise<T>) {
  const readRef = useRef(read);
  readRef.current = read;
  const serialized = JSON.stringify(key);
  const subscribe = useCallback(
    (listener: () => void) =>
      staffQueries.getQueryCache().subscribe((event) => {
        if (JSON.stringify(event.query.queryKey) === serialized) listener();
      }),
    [serialized],
  );
  const getSnapshot = useCallback(() => {
    const state = staffQueries.getQueryState(JSON.parse(serialized) as unknown[]);
    return JSON.stringify({
      data: typeof state?.data === 'boolean' ? state.data : null,
      status: state?.status ?? 'pending',
      fetching: state?.fetchStatus === 'fetching',
      errorAt: state?.errorUpdatedAt ?? 0,
    });
  }, [serialized]);
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  useEffect(() => {
    const queryKey = JSON.parse(serialized) as unknown[];
    const refresh = () => {
      if (document.visibilityState !== 'visible' || !navigator.onLine) return;
      void staffQueries.fetchQuery({ queryKey, queryFn: () => readRef.current() }).catch(() => {});
    };
    refresh();
    window.addEventListener('focus', refresh);
    window.addEventListener('online', refresh);
    document.addEventListener('visibilitychange', refresh);
    return () => {
      window.removeEventListener('focus', refresh);
      window.removeEventListener('online', refresh);
      document.removeEventListener('visibilitychange', refresh);
    };
  }, [serialized]);
  const retry = useCallback(() => {
    const queryKey = JSON.parse(serialized) as unknown[];
    return staffQueries.fetchQuery({ queryKey, queryFn: () => readRef.current(), staleTime: 0 });
  }, [serialized]);
  return { ...(JSON.parse(snapshot) as { data: T | null; status: string; fetching: boolean }), retry };
}

export function useStaffRead(
  key: readonly unknown[],
  read: () => Promise<unknown>,
  options: { enabled?: boolean; interval?: number } = {},
) {
  const readRef = useRef(read);
  readRef.current = read;
  const serialized = JSON.stringify(key);
  useEffect(() => {
    if (options.enabled === false) return;
    const queryKey = JSON.parse(serialized) as unknown[];
    const refresh = () => {
      if (document.visibilityState !== 'visible' || !navigator.onLine) return;
      void staffQueries
        .fetchQuery({
          queryKey,
          queryFn: async () => {
            await readRef.current();
            return true;
          },
        })
        .catch(() => {});
    };
    const poll = options.interval
      ? window.setInterval(() => {
          void staffQueries.invalidateQueries({ queryKey, refetchType: 'none' });
          refresh();
        }, options.interval)
      : undefined;
    window.addEventListener('focus', refresh);
    window.addEventListener('online', refresh);
    document.addEventListener('visibilitychange', refresh);
    return () => {
      window.clearInterval(poll);
      window.removeEventListener('focus', refresh);
      window.removeEventListener('online', refresh);
      document.removeEventListener('visibilitychange', refresh);
    };
  }, [serialized, options.enabled, options.interval]);
}

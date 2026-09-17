import { QueryClient } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';

// A document owns its cache. Protected reads are never persisted to browser storage.
const staffQueries = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30_000, gcTime: 300_000, retry: false, refetchOnWindowFocus: true, refetchOnReconnect: true },
  },
});

export function readStaffQuery<T>(key: readonly unknown[], read: () => Promise<T>): Promise<T> {
  return staffQueries.fetchQuery({ queryKey: key, queryFn: read, staleTime: 0 });
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

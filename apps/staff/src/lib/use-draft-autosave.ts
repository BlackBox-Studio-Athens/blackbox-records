import { useCallback, useEffect, useRef, useState } from 'react';

export function useDraftAutosave<T>({
  identity,
  value,
  dirty,
  enabled,
  save,
  saved,
}: {
  identity: string;
  value: T;
  dirty: boolean;
  enabled: boolean;
  save(value: T): Promise<void>;
  saved(value: T): void;
}) {
  const latest = useRef({ identity, value, dirty, enabled, save, saved });
  latest.current = { identity, value, dirty, enabled, save, saved };
  const inFlight = useRef<Promise<boolean> | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const flush = useCallback(async (): Promise<boolean> => {
    if (inFlight.current) {
      if (!(await inFlight.current)) return false;
      return flush();
    }
    const current = latest.current;
    if (!current.dirty) return true;
    if (!current.enabled || !navigator.onLine) {
      setError('Not saved. Reconnect or resolve the issue below, then retry.');
      return false;
    }
    setSaving(true);
    setError('');
    const request = (async () => {
      try {
        await current.save(current.value);
        if (latest.current.identity === current.identity) {
          const unchanged = JSON.stringify(latest.current.value) === JSON.stringify(current.value);
          if (unchanged) latest.current.dirty = false;
          current.saved(current.value);
        }
        return true;
      } catch (cause) {
        if (latest.current.identity === current.identity)
          setError(cause instanceof Error ? cause.message : 'Your changes were not saved. Retry.');
        return false;
      } finally {
        inFlight.current = null;
        setSaving(false);
      }
    })();
    inFlight.current = request;
    const success = await request;
    if (!success || latest.current.identity !== current.identity) return success;
    // Navigation and review must also finish edits made while this write was pending.
    return latest.current.dirty ? flush() : true;
  }, []);
  useEffect(() => {
    if (!dirty) setError('');
  }, [identity, dirty]);
  useEffect(() => {
    if (!dirty || !enabled || error) return;
    const timer = window.setTimeout(() => {
      void flush();
    }, 1500);
    return () => window.clearTimeout(timer);
  }, [value, dirty, enabled, error, flush]);
  useEffect(() => {
    const reconnect = () => {
      if (latest.current.dirty) void flush();
    };
    window.addEventListener('online', reconnect);
    return () => window.removeEventListener('online', reconnect);
  }, [flush]);
  return { saving, error, flush };
}

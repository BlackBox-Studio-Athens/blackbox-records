import { createContext, useContext, useEffect } from 'react';

/** Receives a field's unsaved-draft message, or '' once the draft reads correctly or the field unmounts. */
export const DraftProblemContext = createContext<(key: string, message: string) => void>(() => {});

/**
 * Tells the surrounding editor card about typed text that cannot be stored yet,
 * so the card shows its problem state before validation ever sees the value.
 */
export function useDraftProblem(key: string, message: string) {
  const report = useContext(DraftProblemContext);
  useEffect(() => {
    report(key, message);
    return () => report(key, '');
  }, [report, key, message]);
}

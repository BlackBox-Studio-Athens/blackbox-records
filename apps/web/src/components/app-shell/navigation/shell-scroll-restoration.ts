type ShellHistoryScrollRestoration = {
  scrollRestoration?: string;
};

export function enableManualShellScrollRestoration(history: ShellHistoryScrollRestoration) {
  const previousScrollRestoration = typeof history.scrollRestoration === 'string' ? history.scrollRestoration : null;

  if ('scrollRestoration' in history) {
    history.scrollRestoration = 'manual';
  }

  return () => {
    if (previousScrollRestoration !== null) {
      history.scrollRestoration = previousScrollRestoration;
    }
  };
}

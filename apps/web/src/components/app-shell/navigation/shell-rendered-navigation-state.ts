type RenderedPagePathnameRef = {
  current: string;
};

type SyncShellRenderedNavigationStateOptions = {
  pathname: string;
  renderedPagePathnameRef: RenderedPagePathnameRef;
  setActiveShellPathname: (pathname: string) => void;
  syncNavigationCurrentState: (pathname: string) => void;
};

export function syncShellRenderedNavigationState({
  pathname,
  renderedPagePathnameRef,
  setActiveShellPathname,
  syncNavigationCurrentState,
}: SyncShellRenderedNavigationStateOptions) {
  renderedPagePathnameRef.current = pathname;
  setActiveShellPathname(pathname);
  syncNavigationCurrentState(pathname);
}

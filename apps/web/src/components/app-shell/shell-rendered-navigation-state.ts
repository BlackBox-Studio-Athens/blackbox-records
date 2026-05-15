type RenderedPagePathnameRef = {
  current: string;
};

type SyncShellRenderedNavigationStateOptions = {
  pathname: string;
  renderedPagePathnameRef: RenderedPagePathnameRef;
  setActiveShellPathname: (pathname: string) => void;
  syncDesktopNavigationState: (pathname: string) => void;
};

export function syncShellRenderedNavigationState({
  pathname,
  renderedPagePathnameRef,
  setActiveShellPathname,
  syncDesktopNavigationState,
}: SyncShellRenderedNavigationStateOptions) {
  renderedPagePathnameRef.current = pathname;
  setActiveShellPathname(pathname);
  syncDesktopNavigationState(pathname);
}

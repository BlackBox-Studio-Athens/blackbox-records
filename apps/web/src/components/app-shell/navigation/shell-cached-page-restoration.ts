import { parseShellSectionRoute, type ShellSectionRoute } from '@/lib/app-shell/routing';

import { SHELL_SECTION_LABELS, type ShellNavigationSource } from './shell-navigation';
import type { ShellPageSnapshot } from './shell-page-snapshot';

type ShellSectionTransition = {
  begin: (target: string, source: ShellNavigationSource) => number;
  finish: (transitionToken: number) => Promise<void>;
  reset: () => void;
};

type RestoreCachedShellPageSnapshotOptions = {
  applyShellPageSnapshot: (pageSnapshot: ShellPageSnapshot) => boolean;
  getCachedSnapshot: (pathname: string) => ShellPageSnapshot | null;
  pathname: string;
  onSectionActivationStart?:
    | ((activation: {
        cached: true;
        kind: ShellSectionRoute['kind'];
        pathname: string;
      }) => ((outcome: 'complete' | 'failed') => void) | undefined)
    | undefined;
  scrollShellViewportToTop: () => Promise<void>;
  shellSectionTransition: ShellSectionTransition;
  source?: ShellNavigationSource | undefined;
  stopRouteLoadingSoon: () => void;
  triggerShellPageEnterTransition: () => void;
  waitForAnimationFrames: (count: number) => Promise<void>;
};

export async function restoreCachedShellPageSnapshot({
  applyShellPageSnapshot,
  getCachedSnapshot,
  pathname,
  onSectionActivationStart,
  scrollShellViewportToTop,
  shellSectionTransition,
  source = 'history',
  stopRouteLoadingSoon,
  triggerShellPageEnterTransition,
  waitForAnimationFrames,
}: RestoreCachedShellPageSnapshotOptions) {
  const pageSnapshot = getCachedSnapshot(pathname);
  if (!pageSnapshot) return false;

  const route = parseShellSectionRoute(pathname);
  const finishSectionActivation = route
    ? onSectionActivationStart?.({ cached: true, kind: route.kind, pathname: route.pathname })
    : undefined;
  const sectionTransitionToken = route ? shellSectionTransition.begin(SHELL_SECTION_LABELS[route.kind], source) : null;
  let activationOutcome: 'complete' | 'failed' = 'failed';

  try {
    if (sectionTransitionToken !== null) {
      await waitForAnimationFrames(2);
    }

    const applied = applyShellPageSnapshot(pageSnapshot);
    if (!applied) {
      shellSectionTransition.reset();
      return false;
    }

    await scrollShellViewportToTop();
    triggerShellPageEnterTransition();

    if (sectionTransitionToken !== null) {
      await shellSectionTransition.finish(sectionTransitionToken);
    }

    stopRouteLoadingSoon();
    activationOutcome = 'complete';
    return true;
  } finally {
    finishSectionActivation?.(activationOutcome);
  }
}

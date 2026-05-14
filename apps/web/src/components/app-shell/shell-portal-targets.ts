import { isCurrentPath } from '@/utils/urls';

type AnimationFrameScheduler = {
  cancelAnimationFrame: (id: number) => void;
  requestAnimationFrame: (callback: FrameRequestCallback) => number;
};

export type ShellPortalTargetSubscriptionOptions = {
  activePathname: string;
  queryTarget: () => HTMLElement | null;
  scheduler: AnimationFrameScheduler;
  setTarget: (target: HTMLElement | null) => void;
  targetPathname: string;
};

export function connectShellPortalTarget({
  activePathname,
  queryTarget,
  scheduler,
  setTarget,
  targetPathname,
}: ShellPortalTargetSubscriptionOptions) {
  if (!isCurrentPath(activePathname, targetPathname)) {
    setTarget(null);
    return undefined;
  }

  let animationFrameId = 0;

  const syncPortalTarget = () => {
    setTarget(queryTarget());
  };

  syncPortalTarget();
  animationFrameId = scheduler.requestAnimationFrame(syncPortalTarget);

  return () => {
    if (animationFrameId) {
      scheduler.cancelAnimationFrame(animationFrameId);
    }
  };
}

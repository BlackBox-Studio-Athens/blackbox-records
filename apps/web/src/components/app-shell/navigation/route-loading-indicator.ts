export const ROUTE_LOADING_RESET_DELAY_MS = 120;
export const STORE_LOADING_FEEDBACK_DELAY_MS = 750;

type MutableTimerRef = {
  current: number | null;
};

type RouteLoadingScheduler = {
  clearTimeout: (id: number) => void;
  setTimeout: (callback: () => void, delay: number) => number;
};

export function clearRouteLoadingTimer(timerRef: MutableTimerRef, scheduler: RouteLoadingScheduler) {
  if (timerRef.current) {
    scheduler.clearTimeout(timerRef.current);
    timerRef.current = null;
  }
}

export function scheduleRouteLoadingStop({
  delay = ROUTE_LOADING_RESET_DELAY_MS,
  scheduler,
  setRouteLoading,
  timerRef,
}: {
  delay?: number;
  scheduler: RouteLoadingScheduler;
  setRouteLoading: (loading: boolean) => void;
  timerRef: MutableTimerRef;
}) {
  clearRouteLoadingTimer(timerRef, scheduler);
  timerRef.current = scheduler.setTimeout(() => {
    setRouteLoading(false);
    timerRef.current = null;
  }, delay);
}

export function scheduleDelayedRouteLoadingStart({
  delay = STORE_LOADING_FEEDBACK_DELAY_MS,
  scheduler,
  setRouteLoading,
  timerRef,
}: {
  delay?: number;
  scheduler: RouteLoadingScheduler;
  setRouteLoading: (loading: boolean) => void;
  timerRef: MutableTimerRef;
}) {
  clearRouteLoadingTimer(timerRef, scheduler);
  timerRef.current = scheduler.setTimeout(() => {
    setRouteLoading(true);
    timerRef.current = null;
  }, delay);
}

import type { DecapBackendMode } from './decap-runtime-config';

export type DecapAdminBootState = 'loading' | 'ready' | 'failed' | 'disabled';
export type DecapAdminBootFailure = 'download' | 'initialization' | 'timeout';

export const decapAdminReadyEventName = 'blackbox:decap-ready';
export const decapAdminFailedEventName = 'blackbox:decap-failed';
export const decapAdminBootTimeoutMs = 20_000;
export const decapBrowserRuntimeVersion = '3.14.1';
export const decapBrowserRuntimeUrl = `https://unpkg.com/decap-cms@${decapBrowserRuntimeVersion}/dist/decap-cms.js`;

type DecapAdminBootView = {
  ariaBusy: 'false' | 'true';
  ariaLive: 'assertive' | 'polite';
  copy: string;
  role: 'alert' | 'status';
  showRetry: boolean;
  showSpinner: boolean;
  title: string;
};

type DecapAdminWindow = Window & {
  __BLACKBOX_ADMIN__?: {
    bootAttemptId?: number;
    cleanupAttempt?: () => void;
    exposeTestHooks?: boolean;
    mediaCollections?: string[];
    mode?: DecapBackendMode;
    previewStyleUrl?: string;
  };
  __BLACKBOX_ADMIN_PREVIEW_COLLECTIONS__?: string[];
  __BLACKBOX_ADMIN_REPAIRS__?: string[];
  __BLACKBOX_ADMIN_TEST_HOOKS__?: Record<string, (...args: never[]) => unknown>;
  __BLACKBOX_ADMIN_READY__?: boolean;
};

type BootEventDetail = {
  attemptId?: number;
};

export function getDecapAdminBootView(
  mode: DecapBackendMode,
  state: DecapAdminBootState,
  failure: DecapAdminBootFailure = 'initialization',
): DecapAdminBootView {
  if (state === 'disabled') {
    return {
      ariaBusy: 'false',
      ariaLive: 'polite',
      copy: 'Editorial access is not enabled at this address. Use the approved BlackBox CMS link.',
      role: 'status',
      showRetry: false,
      showSpinner: false,
      title: 'CMS unavailable for this build',
    };
  }

  if (state === 'failed') {
    const failureCopy = {
      download: 'The editor download failed. Check your connection, then try again.',
      initialization: 'The editor stopped during setup. Try again.',
      timeout: 'The editor did not finish loading. Try again.',
    } satisfies Record<DecapAdminBootFailure, string>;

    return {
      ariaBusy: 'false',
      ariaLive: 'assertive',
      copy: failureCopy[failure],
      role: 'alert',
      showRetry: true,
      showSpinner: false,
      title: failure === 'timeout' ? 'CMS took too long to start' : 'CMS could not start',
    };
  }

  if (state === 'ready') {
    return {
      ariaBusy: 'false',
      ariaLive: 'polite',
      copy: 'The editor is ready.',
      role: 'status',
      showRetry: false,
      showSpinner: false,
      title: 'Editor ready',
    };
  }

  return {
    ariaBusy: 'true',
    ariaLive: 'polite',
    copy:
      mode === 'hosted'
        ? 'Use your approved social account through DecapBridge when sign-in appears.'
        : 'Loading BlackBox content and preview tools.',
    role: 'status',
    showRetry: false,
    showSpinner: true,
    title: mode === 'hosted' ? 'Connecting to BlackBox CMS' : 'Preparing the editor',
  };
}

export function createDecapAdminBootController(options: {
  clearTimeout?: typeof window.clearTimeout;
  focusEditor?: () => void;
  initUrl: string;
  mode: DecapBackendMode;
  reload?: () => void;
  root: HTMLElement;
  runtimeUrl?: string;
  setTimeout?: typeof window.setTimeout;
  targetDocument?: Document;
  targetWindow?: DecapAdminWindow;
  timeoutMs?: number;
}) {
  const targetDocument = options.targetDocument ?? document;
  const targetWindow = options.targetWindow ?? (window as DecapAdminWindow);
  const scheduleTimeout = options.setTimeout ?? targetWindow.setTimeout.bind(targetWindow);
  const cancelTimeout = options.clearTimeout ?? targetWindow.clearTimeout.bind(targetWindow);
  const focusEditor =
    options.focusEditor ??
    (() => {
      const editorRoot = targetDocument.querySelector<HTMLElement>('#nc-root');
      const focusTarget = editorRoot ?? targetDocument.body;
      if (!focusTarget.hasAttribute('tabindex')) focusTarget.setAttribute('tabindex', '-1');
      focusTarget.focus({ preventScroll: true });
    });
  const reload = options.reload ?? (() => targetWindow.location.reload());
  const status = options.root.querySelector<HTMLElement>('[data-admin-boot-status]');
  const heading = options.root.querySelector<HTMLElement>('[data-admin-boot-heading]');
  const copy = options.root.querySelector<HTMLElement>('[data-admin-boot-copy]');
  const spinner = options.root.querySelector<HTMLElement>('[data-admin-boot-spinner]');
  const retry = options.root.querySelector<HTMLButtonElement>('[data-admin-boot-retry]');

  if (!status || !heading || !copy || !spinner || !retry) {
    throw new Error('BlackBox CMS boot markup is incomplete.');
  }

  let attemptId = 0;
  let activeAttemptId: number | undefined;
  let timeoutId: number | undefined;
  let runtimeScript: HTMLScriptElement | undefined;
  let initScript: HTMLScriptElement | undefined;
  let disposed = false;

  const render = (state: DecapAdminBootState, failure?: DecapAdminBootFailure) => {
    const view = getDecapAdminBootView(options.mode, state, failure);
    options.root.dataset.adminBootState = state;
    targetDocument.documentElement.dataset.adminBootState = state;
    options.root.hidden = state === 'ready';
    status.setAttribute('role', view.role);
    status.setAttribute('aria-busy', view.ariaBusy);
    status.setAttribute('aria-live', view.ariaLive);
    heading.textContent = view.title;
    copy.textContent = view.copy;
    spinner.hidden = !view.showSpinner;
    retry.hidden = !view.showRetry;

    if (state === 'failed') retry.focus();
    else if (state !== 'ready') status.focus();
  };

  const clearAttempt = (removeScripts: boolean) => {
    if (timeoutId !== undefined) {
      cancelTimeout(timeoutId);
      timeoutId = undefined;
    }
    targetWindow.removeEventListener(decapAdminReadyEventName, onReady);
    targetWindow.removeEventListener(decapAdminFailedEventName, onFailed);

    for (const script of [runtimeScript, initScript]) {
      if (!script) continue;
      script.onload = null;
      script.onerror = null;
      if (removeScripts) script.remove();
    }

    if (removeScripts) {
      runtimeScript = undefined;
      initScript = undefined;
    }
  };

  const cleanupInitializedAttempt = () => {
    const cleanup = targetWindow.__BLACKBOX_ADMIN__?.cleanupAttempt;
    try {
      cleanup?.();
    } catch {
      // A stale Decap cleanup must not prevent the recovery surface from rendering.
    } finally {
      if (targetWindow.__BLACKBOX_ADMIN__) delete targetWindow.__BLACKBOX_ADMIN__.cleanupAttempt;
    }
  };

  const invalidateAttempt = (currentAttemptId: number) => {
    if (activeAttemptId !== currentAttemptId) return;
    activeAttemptId = undefined;
    targetWindow.__BLACKBOX_ADMIN_READY__ = false;
    delete targetWindow.__BLACKBOX_ADMIN_PREVIEW_COLLECTIONS__;

    if (targetWindow.__BLACKBOX_ADMIN__?.bootAttemptId === currentAttemptId) {
      delete targetWindow.__BLACKBOX_ADMIN__.bootAttemptId;
    }
  };

  const isCurrentAttempt = (event: Event) =>
    activeAttemptId !== undefined && (event as CustomEvent<BootEventDetail>).detail?.attemptId === activeAttemptId;

  const fail = (failure: DecapAdminBootFailure, currentAttemptId: number) => {
    if (disposed || currentAttemptId !== activeAttemptId) return;
    clearAttempt(false);
    invalidateAttempt(currentAttemptId);
    cleanupInitializedAttempt();
    render('failed', failure);
  };

  function onReady(event: Event) {
    if (!isCurrentAttempt(event)) return;
    clearAttempt(false);
    render('ready');
    try {
      focusEditor();
    } catch {
      // Ready state remains valid if the third-party editor root cannot accept focus.
    }
  }

  function onFailed(event: Event) {
    if (!isCurrentAttempt(event)) return;
    const failedAttemptId = (event as CustomEvent<BootEventDetail>).detail?.attemptId;
    if (failedAttemptId !== undefined) fail('initialization', failedAttemptId);
  }

  const start = () => {
    cleanupInitializedAttempt();
    clearAttempt(true);
    disposed = false;
    targetWindow.__BLACKBOX_ADMIN_READY__ = false;
    delete targetWindow.__BLACKBOX_ADMIN_PREVIEW_COLLECTIONS__;

    if (options.mode === 'disabled') {
      activeAttemptId = undefined;
      if (targetWindow.__BLACKBOX_ADMIN__) delete targetWindow.__BLACKBOX_ADMIN__.bootAttemptId;
      render('disabled');
      return;
    }

    attemptId += 1;
    activeAttemptId = attemptId;
    targetWindow.__BLACKBOX_ADMIN__ = {
      ...targetWindow.__BLACKBOX_ADMIN__,
      bootAttemptId: activeAttemptId,
    };

    const currentAttemptId = activeAttemptId;
    render('loading');
    targetWindow.addEventListener(decapAdminReadyEventName, onReady);
    targetWindow.addEventListener(decapAdminFailedEventName, onFailed);

    runtimeScript = targetDocument.createElement('script');
    runtimeScript.async = true;
    runtimeScript.dataset.adminBootScript = 'runtime';
    runtimeScript.src = options.runtimeUrl ?? decapBrowserRuntimeUrl;
    runtimeScript.onerror = () => fail('download', currentAttemptId);
    runtimeScript.onload = () => {
      if (disposed || currentAttemptId !== attemptId) return;

      timeoutId = scheduleTimeout(
        () => fail('timeout', currentAttemptId),
        options.timeoutMs ?? decapAdminBootTimeoutMs,
      );
      initScript = targetDocument.createElement('script');
      initScript.async = true;
      initScript.dataset.adminBootScript = 'init';
      initScript.src = options.initUrl;
      initScript.onerror = () => fail('initialization', currentAttemptId);
      targetDocument.body.append(initScript);
    };
    targetDocument.body.append(runtimeScript);
  };

  const retryHandler = () => {
    if (disposed || options.mode === 'disabled') return;
    cleanupInitializedAttempt();
    clearAttempt(true);
    if (activeAttemptId !== undefined) invalidateAttempt(activeAttemptId);
    render('loading');
    reload();
  };
  retry.addEventListener('click', retryHandler);

  return {
    dispose() {
      disposed = true;
      if (activeAttemptId !== undefined) invalidateAttempt(activeAttemptId);
      cleanupInitializedAttempt();
      clearAttempt(true);
      retry.removeEventListener('click', retryHandler);
    },
    start,
  };
}

export function startDecapAdminBoot(targetDocument: Document = document, targetWindow: DecapAdminWindow = window) {
  const root = targetDocument.querySelector<HTMLElement>('[data-admin-boot-root]');
  if (!root) return undefined;

  const mode = root.dataset.adminBootMode as DecapBackendMode | undefined;
  const initUrl = root.dataset.adminBootInitUrl;
  if (!mode || (mode !== 'disabled' && !initUrl)) {
    throw new Error('BlackBox CMS boot configuration is incomplete.');
  }

  const controller = createDecapAdminBootController({
    initUrl: initUrl ?? '',
    mode,
    root,
    targetDocument,
    targetWindow,
  });
  controller.start();
  return controller;
}

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { runInNewContext } from 'node:vm';

import { describe, expect, it, vi } from 'vitest';

import {
  createDecapAdminBootController,
  decapAdminBootTimeoutMs,
  decapAdminFailedEventName,
  decapAdminReadyEventName,
  decapBrowserRuntimeUrl,
  decapBrowserRuntimeVersion,
  getDecapAdminBootView,
} from './decap-admin-boot';

class FakeElement {
  readonly attributes = new Map<string, string>();
  readonly children: FakeElement[] = [];
  readonly dataset: Record<string, string> = {};
  readonly listeners = new Map<string, Set<EventListener>>();
  async = false;
  focusCount = 0;
  hidden = false;
  onerror: OnErrorEventHandler | null = null;
  onload: ((this: GlobalEventHandlers, ev: Event) => unknown) | null = null;
  parent?: FakeElement;
  removed = false;
  src = '';
  textContent: string | null = '';

  constructor(readonly selectorMap: Record<string, FakeElement> = {}) {}

  addEventListener(type: string, listener: EventListener) {
    const listeners = this.listeners.get(type) ?? new Set<EventListener>();
    listeners.add(listener);
    this.listeners.set(type, listeners);
  }

  append(child: FakeElement) {
    child.parent = this;
    this.children.push(child);
  }

  click() {
    for (const listener of this.listeners.get('click') ?? []) listener.call(this, new Event('click'));
  }

  focus() {
    this.focusCount += 1;
  }

  hasAttribute(name: string) {
    return this.attributes.has(name);
  }

  getAttribute(name: string) {
    return this.attributes.get(name) ?? null;
  }

  querySelector<T>(selector: string): T | null {
    return (this.selectorMap[selector] as T | undefined) ?? null;
  }

  remove() {
    this.removed = true;
    if (!this.parent) return;
    const index = this.parent.children.indexOf(this);
    if (index >= 0) this.parent.children.splice(index, 1);
  }

  removeAttribute(name: string) {
    this.attributes.delete(name);
  }

  removeEventListener(type: string, listener: EventListener) {
    this.listeners.get(type)?.delete(listener);
  }

  setAttribute(name: string, value: string) {
    this.attributes.set(name, value);
  }
}

function createHarness(
  mode: 'local' | 'hosted' | 'disabled' = 'local',
  options: { editorRoot?: FakeElement; useDefaultFocus?: boolean } = {},
) {
  const heading = new FakeElement();
  const copy = new FakeElement();
  const spinner = new FakeElement();
  const retry = new FakeElement();
  const status = new FakeElement();
  const root = new FakeElement({
    '[data-admin-boot-copy]': copy,
    '[data-admin-boot-heading]': heading,
    '[data-admin-boot-retry]': retry,
    '[data-admin-boot-spinner]': spinner,
    '[data-admin-boot-status]': status,
  });
  const body = new FakeElement();
  const documentElement = new FakeElement();
  const targetDocument = {
    body,
    createElement: () => new FakeElement(),
    documentElement,
    querySelector: (selector: string) => (selector === '#nc-root' ? options.editorRoot : undefined) ?? null,
  } as unknown as Document;
  const targetWindow = new EventTarget() as Window & {
    __BLACKBOX_ADMIN__?: {
      bootAttemptId?: number;
      cleanupAttempt?: () => void;
      mode?: 'local' | 'hosted' | 'disabled';
      previewStyleUrl?: string;
    };
    __BLACKBOX_ADMIN_PREVIEW_COLLECTIONS__?: string[];
    __BLACKBOX_ADMIN_READY__?: boolean;
  };
  const scheduled: Array<() => void> = [];
  const setTimeout = vi.fn((callback: TimerHandler) => {
    scheduled.push(callback as () => void);
    return scheduled.length;
  });
  const clearTimeout = vi.fn();
  const focusEditor = vi.fn();
  const reload = vi.fn();
  const controller = createDecapAdminBootController({
    clearTimeout: clearTimeout as unknown as typeof window.clearTimeout,
    initUrl: '/admin/init.js',
    mode,
    reload,
    root: root as unknown as HTMLElement,
    setTimeout: setTimeout as unknown as typeof window.setTimeout,
    targetDocument,
    targetWindow,
    ...(options.useDefaultFocus ? {} : { focusEditor }),
  });

  return {
    body,
    clearTimeout,
    controller,
    copy,
    documentElement,
    editorRoot: options.editorRoot,
    focusEditor,
    heading,
    reload,
    retry,
    root,
    scheduled,
    setTimeout,
    spinner,
    status,
    targetWindow,
  };
}

function dispatchBootEvent(targetWindow: EventTarget, name: string, attemptId: number) {
  targetWindow.dispatchEvent(Object.assign(new Event(name), { detail: { attemptId } }));
}

describe('Decap admin boot views', () => {
  it('defines accessible loading, ready, failed, and disabled states', () => {
    expect(getDecapAdminBootView('local', 'loading')).toMatchObject({
      ariaBusy: 'true',
      ariaLive: 'polite',
      role: 'status',
      showSpinner: true,
      title: 'Preparing the editor',
    });
    expect(getDecapAdminBootView('local', 'ready')).toMatchObject({
      ariaBusy: 'false',
      role: 'status',
      showRetry: false,
      title: 'Editor ready',
    });
    expect(getDecapAdminBootView('local', 'failed', 'download')).toMatchObject({
      ariaBusy: 'false',
      ariaLive: 'assertive',
      role: 'alert',
      showRetry: true,
      title: 'CMS could not start',
    });
    expect(getDecapAdminBootView('disabled', 'disabled')).toMatchObject({
      ariaBusy: 'false',
      role: 'status',
      showRetry: false,
      title: 'CMS unavailable for this build',
    });
  });

  it('keeps hosted authentication copy on DecapBridge social sign-in', () => {
    const copy = getDecapAdminBootView('hosted', 'loading').copy;

    expect(copy).toContain('approved social account');
    expect(copy).toContain('DecapBridge');
    expect(copy).not.toMatch(/password|github|repository/i);
  });
});

describe('Decap admin boot runtime', () => {
  it('pins the accepted browser runtime baseline exactly', () => {
    expect(decapBrowserRuntimeVersion).toBe('3.14.1');
    expect(decapBrowserRuntimeUrl).toBe('https://unpkg.com/decap-cms@3.14.1/dist/decap-cms.js');
  });

  it('renders disabled mode without requesting runtime or config scripts', () => {
    const harness = createHarness('disabled');

    harness.controller.start();

    expect(harness.root.dataset.adminBootState).toBe('disabled');
    expect(harness.documentElement.dataset.adminBootState).toBe('disabled');
    expect(harness.body.children).toHaveLength(0);
    expect(harness.status.getAttribute('role')).toBe('status');
    expect(harness.status.getAttribute('aria-busy')).toBe('false');
    expect(harness.status.focusCount).toBe(1);
  });

  it('loads the pinned runtime, then starts a bounded initialization timer', () => {
    const harness = createHarness();

    harness.controller.start();
    const runtimeScript = harness.body.children[0];

    expect(harness.root.dataset.adminBootState).toBe('loading');
    expect(runtimeScript?.src).toBe(decapBrowserRuntimeUrl);
    expect(runtimeScript?.dataset.adminBootScript).toBe('runtime');
    expect(harness.body.children).toHaveLength(1);
    runtimeScript?.onload?.call(runtimeScript as unknown as GlobalEventHandlers, new Event('load'));
    expect(harness.body.children).toHaveLength(2);
    expect(harness.body.children[1]?.dataset.adminBootScript).toBe('init');
    expect(harness.body.children[1]?.src).toBe('/admin/init.js');
    expect(harness.setTimeout).toHaveBeenCalledWith(expect.any(Function), decapAdminBootTimeoutMs);
  });

  it('shows a focused retry action when the pinned runtime download fails', () => {
    const harness = createHarness();

    harness.controller.start();
    harness.body.children[0]?.onerror?.call(
      harness.body.children[0] as unknown as GlobalEventHandlers,
      new Event('error'),
      '',
      0,
      0,
      undefined,
    );

    expect(harness.root.dataset.adminBootState).toBe('failed');
    expect(harness.status.getAttribute('role')).toBe('alert');
    expect(harness.copy.textContent).toContain('download failed');
    expect(harness.retry.hidden).toBe(false);
    expect(harness.retry.focusCount).toBe(1);
    expect(harness.targetWindow.__BLACKBOX_ADMIN__?.bootAttemptId).toBeUndefined();
    expect(harness.targetWindow.__BLACKBOX_ADMIN_READY__).toBe(false);
  });

  it('invalidates timed-out work, runs cleanup, and ignores late readiness', () => {
    const harness = createHarness();

    harness.controller.start();
    harness.body.children[0]?.onload?.call(
      harness.body.children[0] as unknown as GlobalEventHandlers,
      new Event('load'),
    );
    const cleanupAttempt = vi.fn();
    if (harness.targetWindow.__BLACKBOX_ADMIN__) {
      harness.targetWindow.__BLACKBOX_ADMIN__.cleanupAttempt = cleanupAttempt;
    }
    harness.scheduled[0]?.();

    expect(harness.root.dataset.adminBootState).toBe('failed');
    expect(harness.heading.textContent).toBe('CMS took too long to start');
    expect(cleanupAttempt).toHaveBeenCalledOnce();
    expect(harness.targetWindow.__BLACKBOX_ADMIN__?.bootAttemptId).toBeUndefined();

    dispatchBootEvent(harness.targetWindow, decapAdminReadyEventName, 1);
    expect(harness.root.dataset.adminBootState).toBe('failed');
    expect(harness.focusEditor).not.toHaveBeenCalled();
  });

  it('retries through a clean page reload without retaining attempt scripts', () => {
    const harness = createHarness();

    harness.controller.start();
    const firstRuntime = harness.body.children[0];
    firstRuntime?.onerror?.call(
      firstRuntime as unknown as GlobalEventHandlers,
      new Event('error'),
      '',
      0,
      0,
      undefined,
    );
    harness.retry.click();

    expect(firstRuntime?.removed).toBe(true);
    expect(harness.body.children).toHaveLength(0);
    expect(harness.root.dataset.adminBootState).toBe('loading');
    expect(harness.reload).toHaveBeenCalledOnce();
    expect(harness.targetWindow.__BLACKBOX_ADMIN__?.bootAttemptId).toBeUndefined();

    dispatchBootEvent(harness.targetWindow, decapAdminReadyEventName, 1);
    expect(harness.root.dataset.adminBootState).toBe('loading');
  });

  it('moves focus into the editor after the current attempt becomes ready', () => {
    const harness = createHarness();

    harness.controller.start();
    harness.body.children[0]?.onload?.call(
      harness.body.children[0] as unknown as GlobalEventHandlers,
      new Event('load'),
    );
    dispatchBootEvent(harness.targetWindow, decapAdminReadyEventName, 1);

    expect(harness.root.dataset.adminBootState).toBe('ready');
    expect(harness.root.hidden).toBe(true);
    expect(harness.focusEditor).toHaveBeenCalledOnce();
    expect(harness.clearTimeout).toHaveBeenCalled();
  });

  it('uses the Decap root for default ready focus when it exists', () => {
    const editorRoot = new FakeElement();
    const harness = createHarness('local', { editorRoot, useDefaultFocus: true });

    harness.controller.start();
    harness.body.children[0]?.onload?.call(
      harness.body.children[0] as unknown as GlobalEventHandlers,
      new Event('load'),
    );
    dispatchBootEvent(harness.targetWindow, decapAdminReadyEventName, 1);

    expect(editorRoot.getAttribute('tabindex')).toBe('-1');
    expect(editorRoot.focusCount).toBe(1);
    expect(harness.body.focusCount).toBe(0);
  });

  it('falls back to the document body for default ready focus', () => {
    const harness = createHarness('local', { useDefaultFocus: true });

    harness.controller.start();
    harness.body.children[0]?.onload?.call(
      harness.body.children[0] as unknown as GlobalEventHandlers,
      new Event('load'),
    );
    dispatchBootEvent(harness.targetWindow, decapAdminReadyEventName, 1);

    expect(harness.body.getAttribute('tabindex')).toBe('-1');
    expect(harness.body.focusCount).toBe(1);
  });

  it('shows initialization failure and cleans active work on dispose', () => {
    const harness = createHarness();

    harness.controller.start();
    harness.body.children[0]?.onload?.call(
      harness.body.children[0] as unknown as GlobalEventHandlers,
      new Event('load'),
    );
    const failedCleanup = vi.fn();
    if (harness.targetWindow.__BLACKBOX_ADMIN__) {
      harness.targetWindow.__BLACKBOX_ADMIN__.cleanupAttempt = failedCleanup;
    }
    dispatchBootEvent(harness.targetWindow, decapAdminFailedEventName, 1);

    expect(harness.root.dataset.adminBootState).toBe('failed');
    expect(harness.copy.textContent).toContain('stopped during setup');
    expect(failedCleanup).toHaveBeenCalledOnce();
    expect(harness.targetWindow.__BLACKBOX_ADMIN__?.bootAttemptId).toBeUndefined();

    const disposeHarness = createHarness();
    disposeHarness.controller.start();
    const disposeCleanup = vi.fn();
    if (disposeHarness.targetWindow.__BLACKBOX_ADMIN__) {
      disposeHarness.targetWindow.__BLACKBOX_ADMIN__.cleanupAttempt = disposeCleanup;
    }
    disposeHarness.controller.dispose();

    expect(disposeCleanup).toHaveBeenCalledOnce();
    expect(disposeHarness.body.children).toHaveLength(0);
    expect(disposeHarness.targetWindow.__BLACKBOX_ADMIN__?.bootAttemptId).toBeUndefined();
    expect(disposeHarness.retry.listeners.get('click')?.size ?? 0).toBe(0);
  });
});

describe('Decap admin boot markup and styles', () => {
  const page = readFileSync(fileURLToPath(new URL('../../pages/admin/index.astro', import.meta.url)), 'utf8');
  const init = readFileSync(fileURLToPath(new URL('../../../public/admin/init.js', import.meta.url)), 'utf8');
  const css = readFileSync(fileURLToPath(new URL('../../../public/admin/admin.css', import.meta.url)), 'utf8');

  function runInitHarness({
    loginButton,
    mode = 'hosted',
  }: {
    loginButton?: {
      dataset: Record<string, string>;
      getAttribute: (name: string) => string | null;
      parentElement: { insertBefore: ReturnType<typeof vi.fn> };
      setAttribute: ReturnType<typeof vi.fn>;
      textContent: string;
    };
    mode?: 'local' | 'hosted';
  } = {}) {
    const dispatchEvent = vi.fn();
    const addEventListener = vi.fn();
    const removeEventListener = vi.fn();
    const observe = vi.fn();
    const disconnect = vi.fn();
    const cancelAnimationFrame = vi.fn();
    let animationFrameCallback: FrameRequestCallback | undefined;
    const requestAnimationFrame = vi.fn((callback: FrameRequestCallback) => {
      animationFrameCallback = callback;
      return 41;
    });
    const initializationHandlers: { reject?: () => void; resolve?: () => void } = {};
    const initialization = {
      then: vi.fn((resolve: () => void, reject: () => void) => {
        initializationHandlers.resolve = resolve;
        initializationHandlers.reject = reject;
      }),
    };
    const initCMS = vi.fn(() => initialization);
    const registerPreviewStyle = vi.fn();
    const registerPreviewTemplate = vi.fn();
    const documentElement = { dataset: {} as Record<string, string> };
    const documentBody = { innerText: '' };
    const adminContext: {
      bootAttemptId?: number;
      cleanupAttempt?: () => void;
      mode?: 'local' | 'hosted' | 'disabled';
      previewStyleUrl?: string;
    } = {
      bootAttemptId: 9,
      mode,
      previewStyleUrl: '/admin/preview.css',
    };
    const targetWindow = {
      CMS: { registerPreviewStyle, registerPreviewTemplate },
      __BLACKBOX_ADMIN__: adminContext,
      __BLACKBOX_ADMIN_AUTH_READY__: undefined as boolean | undefined,
      __BLACKBOX_ADMIN_PREVIEW_COLLECTIONS__: undefined as string[] | undefined,
      __BLACKBOX_ADMIN_READY__: undefined as boolean | undefined,
      addEventListener,
      cancelAnimationFrame,
      clearTimeout: vi.fn(),
      createClass: vi.fn((definition) => definition),
      dispatchEvent,
      h: vi.fn(),
      initCMS,
      location: {
        hash: '',
        origin: 'http://127.0.0.1:4322',
        pathname: '/blackbox-records/admin/',
        reload: vi.fn(),
      },
      removeEventListener,
      requestAnimationFrame,
      sessionStorage: {
        getItem: vi.fn(() => null),
        removeItem: vi.fn(),
        setItem: vi.fn(),
      },
      setTimeout: vi.fn(),
    };

    class TestCustomEvent {
      readonly detail: unknown;
      readonly type: string;

      constructor(type: string, eventInit?: { detail?: unknown }) {
        this.type = type;
        this.detail = eventInit?.detail;
      }
    }

    class TestMutationObserver {
      constructor(_callback: () => void) {}

      disconnect() {
        disconnect();
      }

      observe(target: unknown, options: unknown) {
        observe(target, options);
      }
    }

    runInNewContext(init, {
      CustomEvent: TestCustomEvent,
      MutationObserver: TestMutationObserver,
      document: {
        body: documentBody,
        documentElement,
        createElement: vi.fn(() => ({ className: '', dataset: {}, innerHTML: '' })),
        querySelector: vi.fn(() => null),
        querySelectorAll: vi.fn((selector: string) => (selector === 'button' && loginButton ? [loginButton] : [])),
      },
      window: targetWindow,
    });

    return {
      addEventListener,
      adminContext,
      cancelAnimationFrame,
      disconnect,
      dispatchEvent,
      flushAnimationFrame: () => animationFrameCallback?.(0),
      initCMS,
      initializationHandlers,
      observe,
      registerPreviewStyle,
      registerPreviewTemplate,
      removeEventListener,
      requestAnimationFrame,
      targetWindow,
    };
  }

  it('uses stable hooks and omits the config link in disabled mode', () => {
    expect(page).toContain('data-admin-boot-root');
    expect(page).toContain('data-admin-boot-status');
    expect(page).toContain('data-admin-boot-retry');
    expect(page).toContain("adminMode !== 'disabled'");
    expect(page).toContain('{ mode: adminMode, previewStyleUrl }');
    expect(page).not.toContain(`<script src="${decapBrowserRuntimeUrl}"></script>`);
  });

  it('uses attempt-scoped runtime events instead of generated Decap classes', () => {
    expect(init).toContain("new CustomEvent('blackbox:decap-ready'");
    expect(init).toContain("new CustomEvent('blackbox:decap-failed'");
    expect(init).toContain('bootAttemptId');
    expect(init).toContain('cleanupAttempt');
    expect(init).toContain("window.removeEventListener('hashchange'");
    expect(init).toContain('observer.disconnect()');
    expect(init).toContain("if (adminContext.mode !== 'hosted')");
  });

  it('keeps local login copy unchanged while exposing the stable auth hook', () => {
    const loginButton = {
      dataset: {} as Record<string, string>,
      getAttribute: vi.fn(() => null),
      parentElement: { insertBefore: vi.fn() },
      setAttribute: vi.fn(),
      textContent: 'Login',
    };
    const harness = runInitHarness({ loginButton, mode: 'local' });

    harness.flushAnimationFrame();

    expect(loginButton.textContent).toBe('Login');
    expect(loginButton.dataset.blackboxCmsAuthButton).toBe('true');
    expect(loginButton.setAttribute).not.toHaveBeenCalled();
    expect(loginButton.parentElement.insertBefore).not.toHaveBeenCalled();
    expect(harness.targetWindow.__BLACKBOX_ADMIN_AUTH_READY__).toBe(true);
  });

  it('labels hosted login and inserts the DecapBridge helper', () => {
    const loginButton = {
      dataset: {} as Record<string, string>,
      getAttribute: vi.fn(() => null),
      parentElement: { insertBefore: vi.fn() },
      setAttribute: vi.fn(),
      textContent: 'Login',
    };
    const harness = runInitHarness({ loginButton, mode: 'hosted' });

    harness.flushAnimationFrame();

    expect(loginButton.textContent).toBe('Sign in with DecapBridge');
    expect(loginButton.dataset.blackboxCmsAuthButton).toBe('true');
    expect(loginButton.setAttribute).toHaveBeenCalledWith('aria-label', 'Sign in with DecapBridge');
    expect(loginButton.setAttribute).toHaveBeenCalledWith('title', 'Sign in with DecapBridge');
    expect(loginButton.parentElement.insertBefore).toHaveBeenCalledOnce();
    expect(harness.targetWindow.__BLACKBOX_ADMIN_AUTH_READY__).toBe(true);
  });

  it('turns synchronous preview setup exceptions into the stable failure event', () => {
    const dispatchEvent = vi.fn();
    class TestCustomEvent {
      readonly detail: unknown;
      readonly type: string;

      constructor(type: string, init?: { detail?: unknown }) {
        this.type = type;
        this.detail = init?.detail;
      }
    }

    runInNewContext(init, {
      CustomEvent: TestCustomEvent,
      MutationObserver: class {},
      document: {},
      window: {
        CMS: {
          registerPreviewStyle() {
            throw new Error('preview setup failed');
          },
        },
        __BLACKBOX_ADMIN__: { bootAttemptId: 7, previewStyleUrl: '/admin/preview.css' },
        createClass: vi.fn(),
        dispatchEvent,
        h: vi.fn(),
        initCMS: vi.fn(),
        setTimeout: vi.fn(),
      },
    });

    expect(dispatchEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        detail: { attemptId: 7 },
        type: decapAdminFailedEventName,
      }),
    );
  });

  it('registers real init lifecycle cleanup and marks a resolved attempt ready', () => {
    const harness = runInitHarness();

    expect(harness.initCMS).toHaveBeenCalledOnce();
    expect(harness.registerPreviewStyle).toHaveBeenCalledWith('/admin/preview.css');
    expect(harness.registerPreviewTemplate).toHaveBeenCalledTimes(10);
    expect(harness.addEventListener).toHaveBeenCalledWith('hashchange', expect.any(Function));
    expect(harness.observe).toHaveBeenCalledWith(expect.anything(), { childList: true, subtree: true });
    expect(harness.requestAnimationFrame).toHaveBeenCalledOnce();
    expect(harness.adminContext.cleanupAttempt).toEqual(expect.any(Function));

    harness.initializationHandlers.resolve?.();

    expect(harness.targetWindow.__BLACKBOX_ADMIN_READY__).toBe(true);
    expect(harness.targetWindow.__BLACKBOX_ADMIN_PREVIEW_COLLECTIONS__).toEqual([
      'home-site',
      'about-site',
      'services-site',
      'artists',
      'releases',
      'distro',
      'news',
    ]);
    expect(harness.dispatchEvent).toHaveBeenCalledWith(
      expect.objectContaining({ detail: { attemptId: 9 }, type: decapAdminReadyEventName }),
    );

    harness.adminContext.cleanupAttempt?.();

    expect(harness.removeEventListener).toHaveBeenCalledWith('hashchange', expect.any(Function));
    expect(harness.disconnect).toHaveBeenCalledOnce();
    expect(harness.cancelAnimationFrame).toHaveBeenCalledWith(41);
    expect(harness.adminContext.cleanupAttempt).toBeUndefined();
  });

  it('reports rejected initialization through the attempt-scoped failure event', () => {
    const harness = runInitHarness();

    harness.initializationHandlers.reject?.();

    expect(harness.dispatchEvent).toHaveBeenCalledWith(
      expect.objectContaining({ detail: { attemptId: 9 }, type: decapAdminFailedEventName }),
    );
    expect(harness.targetWindow.__BLACKBOX_ADMIN_READY__).not.toBe(true);
  });

  it('cleans a timed-out attempt and ignores its late initialization resolution', () => {
    const harness = runInitHarness();

    delete harness.adminContext.bootAttemptId;
    harness.adminContext.cleanupAttempt?.();
    harness.initializationHandlers.resolve?.();

    expect(harness.disconnect).toHaveBeenCalledOnce();
    expect(harness.removeEventListener).toHaveBeenCalledWith('hashchange', expect.any(Function));
    expect(harness.dispatchEvent).not.toHaveBeenCalledWith(expect.objectContaining({ type: decapAdminReadyEventName }));
    expect(harness.targetWindow.__BLACKBOX_ADMIN_READY__).not.toBe(true);
  });

  it('keeps the state surface hard-edged, high-contrast, focused, and reduced-motion safe', () => {
    const bootCss = css.slice(css.indexOf('.blackbox-cms-boot {'), css.indexOf('.blackbox-cms-empty-guard {'));

    expect(css).toContain('.blackbox-cms-boot__surface');
    expect(css).toContain('background: #0d0d0d');
    expect(css).toContain('color: #f5f5f5');
    expect(css).toContain('border-radius: 0');
    expect(css).toContain('.blackbox-cms-boot__retry:focus-visible');
    expect(css).toContain('@media (prefers-reduced-motion: reduce)');
    expect(bootCss).not.toContain('gradient(');
  });
});

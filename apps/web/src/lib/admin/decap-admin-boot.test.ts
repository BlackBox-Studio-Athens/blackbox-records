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
    bodyInnerText = '',
    documentQuerySelector,
    documentQuerySelectorAll,
    loginButton,
    locationHash = '',
    mode = 'hosted',
  }: {
    bodyInnerText?: string;
    documentQuerySelector?: (selector: string) => unknown;
    documentQuerySelectorAll?: (selector: string) => unknown[];
    loginButton?: {
      dataset: Record<string, string>;
      getAttribute: (name: string) => string | null;
      parentElement: { insertBefore: ReturnType<typeof vi.fn> };
      setAttribute: ReturnType<typeof vi.fn>;
      textContent: string;
    };
    locationHash?: string;
    mode?: 'local' | 'hosted';
  } = {}) {
    const dispatchEvent = vi.fn();
    const addEventListener = vi.fn();
    const removeEventListener = vi.fn();
    const observe = vi.fn();
    const disconnect = vi.fn();
    const cancelAnimationFrame = vi.fn();
    let animationFrameCallback: FrameRequestCallback | undefined;
    let mutationObserverCallback:
      | ((mutations: Array<{ addedNodes: unknown[]; removedNodes: unknown[] }>) => void)
      | undefined;
    const timeoutCallbacks: Array<() => void> = [];
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
    const stockLink = { setAttribute: vi.fn() };
    type TestCreatedElement = {
      className: string;
      dataset: Record<string, string>;
      innerHTML: string;
      querySelector: (selector: string) => typeof stockLink | null;
      remove: ReturnType<typeof vi.fn>;
      setAttribute: ReturnType<typeof vi.fn>;
    };
    let scopePanel: TestCreatedElement | null = null;
    const documentBody = {
      append: vi.fn((element: TestCreatedElement) => {
        if (element.dataset.blackboxCmsScopePanel === 'true') scopePanel = element;
      }),
      innerText: bodyInnerText,
    };
    const createElement = vi.fn(() => {
      const element: TestCreatedElement = {
        className: '',
        dataset: {},
        innerHTML: '',
        querySelector: vi.fn((selector: string) =>
          selector === '[data-blackbox-cms-stock-link="true"]' ? stockLink : null,
        ),
        remove: vi.fn(() => {
          if (scopePanel === element) scopePanel = null;
        }),
        setAttribute: vi.fn(),
      };
      return element;
    });
    const adminContext: {
      bootAttemptId?: number;
      cleanupAttempt?: () => void;
      exposeTestHooks?: boolean;
      mediaCollections?: string[];
      mode?: 'local' | 'hosted' | 'disabled';
      previewStyleUrl?: string;
    } = {
      bootAttemptId: 9,
      exposeTestHooks: true,
      mediaCollections: ['about', 'artists', 'distro', 'home', 'news', 'releases', 'services'],
      mode,
      previewStyleUrl: '/admin/preview.css',
    };
    const targetWindow = {
      CMS: { registerPreviewStyle, registerPreviewTemplate },
      __BLACKBOX_ADMIN__: adminContext,
      __BLACKBOX_ADMIN_AUTH_READY__: undefined as boolean | undefined,
      __BLACKBOX_ADMIN_PREVIEW_COLLECTIONS__: undefined as string[] | undefined,
      __BLACKBOX_ADMIN_READY__: undefined as boolean | undefined,
      __BLACKBOX_ADMIN_REPAIRS__: undefined as string[] | undefined,
      __BLACKBOX_ADMIN_TEST_HOOKS__: undefined as Record<string, (...args: never[]) => unknown> | undefined,
      addEventListener,
      cancelAnimationFrame,
      clearTimeout: vi.fn(),
      createClass: vi.fn((definition) => definition),
      dispatchEvent,
      h: vi.fn(),
      initCMS,
      location: {
        hash: locationHash,
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
      setTimeout: vi.fn((callback: () => void) => {
        timeoutCallbacks.push(callback);
        return timeoutCallbacks.length;
      }),
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
      constructor(callback: (mutations: Array<{ addedNodes: unknown[]; removedNodes: unknown[] }>) => void) {
        mutationObserverCallback = callback;
      }

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
        createElement,
        querySelector: vi.fn((selector: string) => {
          const provided = documentQuerySelector?.(selector);
          if (provided !== undefined) return provided;
          return selector === '[data-blackbox-cms-scope-panel="true"]' ? scopePanel : null;
        }),
        querySelectorAll: vi.fn((selector: string) => {
          const provided = documentQuerySelectorAll?.(selector);
          if (provided !== undefined) return provided;
          return selector === 'button' && loginButton ? [loginButton] : [];
        }),
      },
      window: targetWindow,
    });

    return {
      addEventListener,
      adminContext,
      cancelAnimationFrame,
      disconnect,
      dispatchEvent,
      documentBody,
      flushAnimationFrame: () => animationFrameCallback?.(0),
      flushTimeouts: () => {
        const pendingCallbacks = timeoutCallbacks.splice(0, timeoutCallbacks.length);
        pendingCallbacks.forEach((callback) => callback());
      },
      getScopePanel: () => scopePanel,
      initCMS,
      initializationHandlers,
      observe,
      registerPreviewStyle,
      registerPreviewTemplate,
      removeEventListener,
      requestAnimationFrame,
      stockLink,
      targetWindow,
      triggerMutation: (hasChanges = true) =>
        mutationObserverCallback?.([
          {
            addedNodes: hasChanges ? [{}] : [],
            removedNodes: [],
          },
        ]),
    };
  }

  it('uses stable hooks and omits the config link in disabled mode', () => {
    expect(page).toContain('data-admin-boot-root');
    expect(page).toContain('data-admin-boot-status');
    expect(page).toContain('data-admin-boot-retry');
    expect(page).toContain("adminMode !== 'disabled'");
    expect(page).toContain("adminMode !== 'disabled' && <script is:inline src={previewAssetsUrl} />");
    expect(page).toContain('{ mode: adminMode, previewStyleUrl, mediaCollections: decapCollectionMediaKeys }');
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

  it('keeps the Home preview aligned with the current Hero, News, and Artists hierarchy', () => {
    expect(init).toContain("const news = findSection(sections, 'news')");
    expect(init).toContain("const artists = findSection(sections, 'artists')");
    expect(init).toContain("className: 'blackbox-preview__grid blackbox-preview__grid--two'");
    expect(init).not.toContain("findSection(sections, 'distro')");
    expect(init).not.toContain("section?.type === 'journey'");
    expect(init).not.toContain('news?.section_label');
    expect(init).not.toContain('artists?.section_label');
    expect(init).not.toContain('blackbox-preview__journey');
    expect(css).not.toContain('blackbox-preview__journey');
  });

  it('keeps key collection previews aligned with current public editorial concepts', () => {
    expect(init).toContain('const metaItems = [data.genre, data.country].filter(Boolean)');
    expect(init).toContain('data.upcoming_release');
    expect(init).toContain('[titleCase(data.artist), releaseDate].filter(Boolean)');
    expect(init).toContain('data.summary ?');
    expect(init).toContain('credits.length');
    expect(init).toContain("toText(data.group || 'Distro')");
    expect(init).toContain('toText(data.artist_or_label)');
    expect(init).toContain("[data.eyebrow, data.format, data.order !== undefined ? `Order ${data.order}` : '']");
    expect(init).toContain('To stop selling, use protected stock or commerce-operator controls.');
    expect(init).toContain("toText(data.section_label || 'News')");
    expect(init).toContain('body ? body.slice(0, 600)');
  });

  it('locks outer fixed-layout section actions without disabling nested repeatable lists', () => {
    expect(init).toContain("'#/collections/home/entries/home-site'");
    expect(init).toContain("'#/collections/about/entries/about-site'");
    expect(init).toContain("'#/collections/services/entries/services-site'");
    expect(init).toContain("firstElementChild?.textContent?.trim() !== 'Sections'");
    expect(init).toContain("topBar.dataset.blackboxFixedSectionActions = 'locked'");
    expect(init).toContain('button.hidden = true');
  });

  it('documents every retained pinned-version repair and removes the obsolete generic remove-button patch', () => {
    const harness = runInitHarness();

    expect(harness.targetWindow.__BLACKBOX_ADMIN_REPAIRS__).toEqual([
      'bounded-rerender-observer',
      'decapbridge-login-surface',
      'editor-scope-panel',
      'empty-singleton-guard',
      'fixed-layout-section-actions',
      'preview-auto-collapse',
      'preview-toggle-copy',
      'saved-singleton-route-reload',
      'top-level-media-hidden',
    ]);
    expect(init.match(/Decap CMS 3\.14\.1/g)).toHaveLength(9);
    expect(init).not.toContain('enhanceListItemActionButtons');
    expect(init).not.toContain('blackboxSectionRowAction');
    expect(css).not.toContain('data-blackbox-section-row-action');
  });

  it('hides the unsupported top-level Media action without affecting collection image widgets', () => {
    const mediaButton = {
      dataset: {} as Record<string, string>,
      hidden: false,
      setAttribute: vi.fn(),
      textContent: 'Media',
    };
    const harness = runInitHarness({
      documentQuerySelectorAll: (selector) => (selector === 'nav button' ? [mediaButton] : undefined) as unknown[],
    });

    harness.flushAnimationFrame();

    expect(mediaButton.dataset.blackboxTopLevelMedia).toBe('hidden');
    expect(mediaButton.hidden).toBe(true);
    expect(mediaButton.setAttribute).toHaveBeenCalledWith('aria-hidden', 'true');
    expect(mediaButton.setAttribute).toHaveBeenCalledWith('tabindex', '-1');
  });

  it('locks only the fixed outer Sections rows on the pinned Decap markup', () => {
    const actions = Array.from({ length: 3 }, () => ({ hidden: false, setAttribute: vi.fn() }));
    const topBar = {
      closest: vi.fn((selector: string) => {
        if (selector.includes('SortableListItem')) return {};
        if (selector.includes('ControlContainer')) return { firstElementChild: { textContent: 'Sections' } };
        return null;
      }),
      dataset: {} as Record<string, string>,
      querySelectorAll: vi.fn(() => actions),
    };
    const harness = runInitHarness({
      documentQuerySelectorAll: (selector) => (selector.includes('ListItemTopBar') ? [topBar] : undefined) as unknown[],
      locationHash: '#/collections/home/entries/home-site',
    });

    harness.flushAnimationFrame();

    expect(topBar.dataset.blackboxFixedSectionActions).toBe('locked');
    for (const action of actions) {
      expect(action.hidden).toBe(true);
      expect(action.setAttribute).toHaveBeenCalledWith('aria-hidden', 'true');
      expect(action.setAttribute).toHaveBeenCalledWith('tabindex', '-1');
    }
  });

  it('bounds observer rerender work to one queued animation frame and ignores empty mutation records', () => {
    const harness = runInitHarness();

    expect(harness.requestAnimationFrame).toHaveBeenCalledOnce();
    harness.triggerMutation();
    harness.triggerMutation();
    expect(harness.requestAnimationFrame).toHaveBeenCalledOnce();

    harness.flushAnimationFrame();
    harness.triggerMutation(false);
    expect(harness.requestAnimationFrame).toHaveBeenCalledOnce();

    harness.triggerMutation();
    harness.triggerMutation();
    expect(harness.requestAnimationFrame).toHaveBeenCalledTimes(2);
  });

  it('reloads a saved singleton-to-singleton transition but no-ops on unsupported routes', () => {
    const harness = runInitHarness({ locationHash: '#/collections/home/entries/home-site' });
    const hooks = harness.targetWindow.__BLACKBOX_ADMIN_TEST_HOOKS__ as {
      reloadOnSavedSingletonRouteChange: () => boolean;
    };

    expect(hooks.reloadOnSavedSingletonRouteChange()).toBe(false);
    harness.targetWindow.location.hash = '#/collections/about/entries/about-site';
    harness.documentBody.innerText = 'CHANGES SAVED';
    expect(hooks.reloadOnSavedSingletonRouteChange()).toBe(true);
    expect(harness.targetWindow.location.reload).toHaveBeenCalledOnce();

    harness.targetWindow.location.hash = '#/collections/news/entries/article';
    expect(hooks.reloadOnSavedSingletonRouteChange()).toBe(false);
  });

  it('detects a populated versus empty singleton state without touching absent targets', () => {
    const harness = runInitHarness({ locationHash: '#/collections/services/entries/services-site' });
    const hooks = harness.targetWindow.__BLACKBOX_ADMIN_TEST_HOOKS__ as {
      getActiveSingletonEditor: () => unknown;
      isSingletonEditorEmptyLoad: (
        activeEditor: unknown,
        snapshot: { formValues: string[]; hasLoadedEditorChrome: boolean; sectionCounts: number[] },
      ) => boolean;
      syncTopLevelMediaSurface: () => void;
    };
    const activeEditor = hooks.getActiveSingletonEditor();

    expect(
      hooks.isSingletonEditorEmptyLoad(activeEditor, {
        formValues: ['Tour Booking'],
        hasLoadedEditorChrome: true,
        sectionCounts: [3],
      }),
    ).toBe(false);
    expect(
      hooks.isSingletonEditorEmptyLoad(activeEditor, {
        formValues: [],
        hasLoadedEditorChrome: true,
        sectionCounts: [0],
      }),
    ).toBe(true);

    expect(() => hooks.syncTopLevelMediaSurface()).not.toThrow();
  });

  it('keeps one keyboard control synchronized with visible preview state and focus', () => {
    const previewLabel = { textContent: '' };
    const previewStatus = { textContent: '' };
    const previewCopy = { append: vi.fn() };
    let clickListener: ((event: { isTrusted: boolean }) => void) | undefined;
    const previewToggle = {
      addEventListener: vi.fn((_type: string, listener: (event: { isTrusted: boolean }) => void) => {
        clickListener = listener;
      }),
      append: vi.fn(),
      dataset: {} as Record<string, string>,
      focus: vi.fn(),
      hasAttribute: vi.fn(() => false),
      querySelector: vi.fn((selector: string) => {
        if (selector.includes('preview-copy')) return previewCopy;
        if (selector.includes('preview-label')) return previewLabel;
        if (selector.includes('preview-status')) return previewStatus;
        return null;
      }),
      removeAttribute: vi.fn(),
      setAttribute: vi.fn(),
    };
    const previewPane = {
      getBoundingClientRect: () => ({ width: 360 }),
      id: '',
    };
    const harness = runInitHarness({
      documentQuerySelector: (selector) => {
        if (selector === 'button[data-blackbox-preview-toggle="true"]') return previewToggle;
        if (selector.includes('PreviewPaneFrame')) return previewPane;
        return undefined;
      },
    });

    harness.flushAnimationFrame();

    expect(previewToggle.dataset.previewState).toBe('open');
    expect(previewLabel.textContent).toBe('Hide preview');
    expect(previewStatus.textContent).toBe('Visible');
    expect(previewToggle.setAttribute).toHaveBeenCalledWith('aria-label', 'Hide preview. Preview visible.');
    expect(previewToggle.setAttribute).toHaveBeenCalledWith('aria-expanded', 'true');
    expect(previewToggle.setAttribute).toHaveBeenCalledWith('aria-controls', 'blackbox-cms-preview-pane');

    clickListener?.({ isTrusted: true });
    harness.flushTimeouts();
    expect(previewToggle.focus).toHaveBeenCalledWith({ preventScroll: true });
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

  it('shows authenticated editors direct-publish and commerce ownership guidance with a base-path-safe stock link', () => {
    const harness = runInitHarness({ mode: 'local' });

    harness.flushAnimationFrame();

    const panel = harness.getScopePanel();
    expect(panel?.dataset.blackboxCmsScopePanel).toBe('true');
    expect(panel?.innerHTML).toContain('Publish writes to main');
    expect(panel?.innerHTML).toContain('Publishing commits immediately to main');
    expect(panel?.innerHTML).toContain('Titles, copy, images, grouping, format, order, and public page content.');
    expect(panel?.innerHTML).toContain('replacement Price under the existing Product');
    expect(panel?.innerHTML).toContain('Do not delete editorial content.');
    expect(panel?.innerHTML).toContain('Worker/Stripe paid-order state');
    expect(harness.stockLink.setAttribute).toHaveBeenCalledWith('href', '/blackbox-records/stock/');
    expect(panel?.innerHTML).not.toMatch(
      /price_[A-Za-z0-9]|D1 ID|lookup key|€|\$\d|feature[- ]flag key|BOX NOW credential|provider payload/i,
    );

    harness.adminContext.cleanupAttempt?.();
    expect(harness.getScopePanel()).toBeNull();
  });

  it('keeps the scope panel hidden on the hosted sign-in surface', () => {
    const loginButton = {
      dataset: {} as Record<string, string>,
      getAttribute: vi.fn(() => null),
      parentElement: { insertBefore: vi.fn() },
      setAttribute: vi.fn(),
      textContent: 'Login',
    };
    const harness = runInitHarness({ loginButton, mode: 'hosted' });

    harness.flushAnimationFrame();

    expect(harness.getScopePanel()).toBeNull();
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

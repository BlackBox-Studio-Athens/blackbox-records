(() => {
  const adminContext = window.__BLACKBOX_ADMIN__ || {};
  const bootAttemptId = adminContext.bootAttemptId;
  const previewStyleUrl = adminContext.previewStyleUrl;
  const mediaCollections = Array.isArray(adminContext.mediaCollections) ? adminContext.mediaCollections : [];
  const previewAssetResolver = window.__BLACKBOX_PREVIEW_ASSETS__?.resolvePreviewAssetUrl;
  const previewAutoCollapseKey = 'blackbox-cms-preview-auto-collapsed';
  const previewToggleClickBoundAttribute = 'data-preview-toggle-click-bound';
  const retainedPinnedVersionRepairs = Object.freeze({
    'bounded-rerender-observer':
      'Decap CMS 3.14.1 mounts and replaces editor chrome asynchronously; one queued animation-frame sync covers late child-list changes.',
    'decapbridge-login-surface':
      'Decap CMS 3.14.1 renders a generic Login action for the hosted PKCE backend; branded copy identifies DecapBridge sign-in.',
    'editor-scope-panel':
      'Decap CMS 3.14.1 has no supported authenticated-editor slot for direct-publish and ownership guidance.',
    'empty-singleton-guard':
      'Decap CMS 3.14.1 can present an empty singleton form after a failed remote load; the guard prevents accidental blank publication.',
    'fixed-layout-section-actions':
      'Decap CMS 3.14.1 still renders outer remove and reorder controls when allow_remove and allow_reorder are false.',
    'preview-auto-collapse':
      'Decap CMS 3.14.1 has no supported initial collapsed-preview setting for existing entry editors.',
    'preview-toggle-copy':
      'Decap CMS 3.14.1 exposes an icon-only Toggle Preview action; the repair adds accurate visible and accessible state.',
    'saved-singleton-route-reload':
      'Decap CMS 3.14.1 can retain stale singleton form state during saved singleton-to-singleton navigation.',
    'top-level-media-hidden':
      'Decap CMS 3.14.1 has no config switch for hiding the global Media action when all image widgets use collection-owned roots.',
  });
  let previewCollapseInFlight = false;
  let previewCollapseScheduleActive = false;
  const previewCollapseTimerIds = new Set();
  window.__BLACKBOX_ADMIN_REPAIRS__ = Object.keys(retainedPinnedVersionRepairs);
  const isCurrentBootAttempt = () => window.__BLACKBOX_ADMIN__?.bootAttemptId === bootAttemptId;

  const toArray = (value) => {
    if (!value) {
      return [];
    }

    if (typeof value.toJS === 'function') {
      return value.toJS();
    }

    return Array.isArray(value) ? value : [];
  };

  const toObject = (value) => {
    if (!value) {
      return {};
    }

    if (typeof value.toJS === 'function') {
      return value.toJS();
    }

    return typeof value === 'object' ? value : {};
  };

  const toText = (value) => {
    if (value === null || value === undefined) {
      return '';
    }

    return String(value);
  };

  const titleCase = (value) =>
    toText(value)
      .replace(/[-_]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .replace(/\b\w/g, (character) => character.toUpperCase());

  const getAdminMediaBaseUrl = () => {
    const pathname = window.location.pathname;
    const adminRootPath = pathname.includes('/admin/')
      ? pathname.slice(0, pathname.indexOf('/admin/') + '/admin/'.length)
      : '/admin/';
    return `${window.location.origin}${adminRootPath}media/`;
  };

  const getStockOperationsUrl = () => {
    const pathname = window.location.pathname;
    const adminIndex = pathname.indexOf('/admin/');
    const siteBasePath = adminIndex >= 0 ? pathname.slice(0, adminIndex) : '';
    return `${siteBasePath}/stock/`;
  };

  const hasAutoCollapsedPreview = () => {
    try {
      return window.sessionStorage.getItem(previewAutoCollapseKey) === 'true';
    } catch {
      return false;
    }
  };

  const markPreviewAsAutoCollapsed = () => {
    try {
      window.sessionStorage.setItem(previewAutoCollapseKey, 'true');
    } catch {
      // Ignore browsers that block sessionStorage in private contexts.
    }
  };

  const isEntryEditorRoute = () => /^#\/collections\/[^/]+\/entries\/[^/]+/.test(window.location.hash);

  const singletonEditorExpectations = {
    about: {
      entry: 'about-site',
      label: 'About',
      minimumSectionCount: 1,
      values: ['The Label'],
    },
    home: {
      entry: 'home-site',
      label: 'Home',
      minimumSectionCount: 1,
      values: ['Fine music on record.'],
    },
    newsletter: {
      entry: 'newsletter-site',
      label: 'Newsletter',
      minimumSectionCount: 0,
      values: ['Join the Collective'],
    },
    services: {
      entry: 'services-site',
      label: 'Services',
      minimumSectionCount: 1,
      values: ['Tour Booking'],
    },
    settings: {
      entry: 'settings-site',
      label: 'Settings',
      minimumSectionCount: 0,
      values: ['Blackbox Records'],
    },
  };

  let singletonContentGuardTimer = 0;
  let currentSingletonRouteKey = '';

  const getActiveSingletonEditor = () => {
    const match = window.location.hash.match(/^#\/collections\/([^/]+)\/entries\/([^/]+)/);
    if (!match) {
      return null;
    }

    const [, collection, entry] = match;
    const expectation = singletonEditorExpectations[collection];
    if (!expectation || expectation.entry !== entry) {
      return null;
    }

    return {
      collection,
      entry,
      expectation,
    };
  };

  const getSingletonRouteKey = (activeEditor) =>
    activeEditor ? `${activeEditor.collection}/${activeEditor.entry}` : '';

  const hasSavedEditorState = () => /\bCHANGES SAVED\b/i.test(document.body?.innerText || '');

  const reloadOnSavedSingletonRouteChange = () => {
    const nextSingletonRouteKey = getSingletonRouteKey(getActiveSingletonEditor());
    const shouldReload =
      currentSingletonRouteKey &&
      nextSingletonRouteKey &&
      currentSingletonRouteKey !== nextSingletonRouteKey &&
      hasSavedEditorState();

    currentSingletonRouteKey = nextSingletonRouteKey;

    if (shouldReload) {
      window.location.reload();
      return true;
    }

    return false;
  };

  const readSingletonEditorState = () => {
    const bodyText = document.body?.innerText || '';
    const formValues = Array.from(document.querySelectorAll('input, textarea, select'))
      .map((element) => {
        if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) {
          return element.value.trim();
        }

        if (element instanceof HTMLSelectElement) {
          return element.value.trim();
        }

        return '';
      })
      .filter(Boolean);
    const sectionCounts = Array.from(bodyText.matchAll(/\b(\d+)\s+sections\b/gi)).map((match) => Number(match[1]));

    return {
      bodyText,
      formValues,
      hasLoadedEditorChrome: /\bWriting in\b.+\bcollection\b/i.test(bodyText),
      sectionCounts,
    };
  };

  const isSingletonEditorEmptyLoad = (activeEditor, state) => {
    if (!activeEditor || !state.hasLoadedEditorChrome) {
      return false;
    }

    const { expectation } = activeEditor;
    const missingExpectedValues = expectation.values.filter(
      (value) => !state.formValues.some((formValue) => formValue.includes(value)),
    );
    const maxSectionCount = Math.max(0, ...state.sectionCounts);

    return missingExpectedValues.length > 0 || maxSectionCount < expectation.minimumSectionCount;
  };

  const removeSingletonContentGuard = () => {
    if (singletonContentGuardTimer) {
      window.clearTimeout(singletonContentGuardTimer);
      singletonContentGuardTimer = 0;
    }

    document.querySelector('[data-blackbox-cms-empty-guard="true"]')?.remove();
    delete document.documentElement.dataset.blackboxCmsEmptySingleton;
  };

  const clearStorageKeys = (storage, tokens) => {
    if (!storage) {
      return;
    }

    try {
      const keys = Array.from({ length: storage.length }, (_, index) => storage.key(index)).filter(Boolean);
      keys.forEach((key) => {
        const normalizedKey = key.toLowerCase();
        if (tokens.some((token) => normalizedKey.includes(token))) {
          storage.removeItem(key);
        }
      });
    } catch {
      // Ignore blocked browser storage. IndexedDB cleanup still runs when available.
    }
  };

  const clearIndexedDbDraftStores = async (tokens) => {
    if (!window.indexedDB || typeof window.indexedDB.databases !== 'function') {
      return;
    }

    const databases = await window.indexedDB.databases().catch(() => []);
    await Promise.all(
      databases
        .map((database) => database?.name)
        .filter((name) => {
          const normalizedName = toText(name).toLowerCase();
          return normalizedName && tokens.some((token) => normalizedName.includes(token));
        })
        .map(
          (name) =>
            new Promise((resolve) => {
              const request = window.indexedDB.deleteDatabase(name);
              request.addEventListener('success', resolve, { once: true });
              request.addEventListener('error', resolve, { once: true });
              request.addEventListener('blocked', resolve, { once: true });
            }),
        ),
    );
  };

  const clearDecapDraftCacheAndReload = async () => {
    const tokens = [
      'backup',
      'blackbox',
      'cms',
      'decap',
      'localforage',
      'netlify',
      ...Object.values(singletonEditorExpectations).map((expectation) => expectation.entry),
    ];

    try {
      clearStorageKeys(window.localStorage, tokens);
      clearStorageKeys(window.sessionStorage, tokens);
      await clearIndexedDbDraftStores(tokens);
    } finally {
      window.location.reload();
    }
  };

  const ensureSingletonContentGuard = (activeEditor) => {
    if (document.querySelector('[data-blackbox-cms-empty-guard="true"]')) {
      return;
    }

    const guard = document.createElement('section');
    guard.className = 'blackbox-cms-empty-guard';
    guard.dataset.blackboxCmsEmptyGuard = 'true';
    guard.setAttribute('role', 'alert');
    guard.innerHTML = [
      '<div class="blackbox-cms-empty-guard__copy">',
      '<p class="blackbox-cms-empty-guard__eyebrow">Content did not load</p>',
      `<h2 class="blackbox-cms-empty-guard__title">Do not publish ${activeEditor.expectation.label} yet</h2>`,
      '<p class="blackbox-cms-empty-guard__body">The editor opened, but it did not receive the existing GitHub content. Publishing from this screen could overwrite the live page with blanks.</p>',
      '</div>',
      '<button class="blackbox-cms-empty-guard__button" type="button">Clear local draft and retry</button>',
    ].join('');

    guard.querySelector('button')?.addEventListener('click', () => {
      clearDecapDraftCacheAndReload();
    });

    document.body?.append(guard);
  };

  const syncSingletonContentGuard = () => {
    const activeEditor = getActiveSingletonEditor();
    const state = readSingletonEditorState();
    window.__BLACKBOX_DECAP_SINGLETON_STATE__ = {
      activeEditor,
      formValues: state.formValues,
      sectionCounts: state.sectionCounts,
    };

    if (!isSingletonEditorEmptyLoad(activeEditor, state)) {
      removeSingletonContentGuard();
      return;
    }

    document.documentElement.dataset.blackboxCmsEmptySingleton = activeEditor.collection;
    if (singletonContentGuardTimer) {
      return;
    }

    singletonContentGuardTimer = window.setTimeout(() => {
      singletonContentGuardTimer = 0;
      if (!isCurrentBootAttempt()) {
        return;
      }

      const latestActiveEditor = getActiveSingletonEditor();
      if (isSingletonEditorEmptyLoad(latestActiveEditor, readSingletonEditorState())) {
        ensureSingletonContentGuard(latestActiveEditor);
      }
    }, 1500);
  };

  const getLoginButton = () =>
    Array.from(document.querySelectorAll('button')).find((button) => {
      const label = (button.textContent || '').replace(/\s+/g, ' ').trim().toLowerCase();
      return label === 'login' || label === 'sign in with decapbridge';
    }) || null;

  const syncAuthLoginSurface = () => {
    const loginButton = getLoginButton();
    if (!loginButton) {
      return;
    }

    loginButton.dataset.blackboxCmsAuthButton = 'true';

    if (adminContext.mode !== 'hosted') {
      document.documentElement.dataset.blackboxCmsAuth = 'ready';
      window.__BLACKBOX_ADMIN_AUTH_READY__ = true;
      return;
    }

    loginButton.textContent = 'Sign in with DecapBridge';
    loginButton.setAttribute('aria-label', 'Sign in with DecapBridge');
    loginButton.setAttribute('title', 'Sign in with DecapBridge');

    if (!document.querySelector('[data-blackbox-cms-auth-helper="true"]')) {
      const authHelper = document.createElement('div');
      authHelper.className = 'blackbox-cms-auth-helper';
      authHelper.dataset.blackboxCmsAuthHelper = 'true';
      authHelper.innerHTML = [
        '<p class="blackbox-cms-auth-helper__eyebrow">BlackBox CMS</p>',
        '<h1 class="blackbox-cms-auth-helper__title">Sign in to edit content</h1>',
        '<p class="blackbox-cms-auth-helper__copy">Continue through DecapBridge, then choose Google or Microsoft.</p>',
      ].join('');
      loginButton.parentElement?.insertBefore(authHelper, loginButton);
    }

    document.documentElement.dataset.blackboxCmsAuth = 'ready';
    window.__BLACKBOX_ADMIN_AUTH_READY__ = true;
  };

  const removeEditorScopePanel = () => {
    document.querySelector('[data-blackbox-cms-scope-panel="true"]')?.remove();
  };

  const syncEditorScopePanel = () => {
    const loginButton = getLoginButton();
    if (loginButton) {
      removeEditorScopePanel();
      return;
    }

    if (!document.body || document.querySelector('[data-blackbox-cms-scope-panel="true"]')) {
      return;
    }

    const panel = document.createElement('aside');
    panel.className = 'blackbox-cms-scope-panel';
    panel.dataset.blackboxCmsScopePanel = 'true';
    panel.setAttribute('aria-label', 'CMS publishing and ownership guidance');
    panel.innerHTML = [
      '<details class="blackbox-cms-scope-panel__details">',
      '<summary class="blackbox-cms-scope-panel__summary"><span>Publish writes to main</span><span>Editing scope</span></summary>',
      '<div class="blackbox-cms-scope-panel__content">',
      '<p class="blackbox-cms-scope-panel__notice">Publishing commits immediately to main and starts the normal site deployment.</p>',
      '<dl class="blackbox-cms-scope-panel__list">',
      '<div><dt>Edit in Decap</dt><dd>Titles, copy, images, grouping, format, order, and public page content.</dd></div>',
      '<div><dt>Price</dt><dd>In Stripe Dashboard, create a replacement Price under the existing Product, then run the existing catalog verification flow.</dd></div>',
      '<div><dt>Stock</dt><dd>Use the <a data-blackbox-cms-stock-link="true">protected stock operations surface</a>.</dd></div>',
      '<div><dt>Stop selling or checkout availability</dt><dd>Use online stock or commerce-operator checkout controls. Do not delete editorial content.</dd></div>',
      '<div><dt>Orders and fulfillment</dt><dd>Use Worker/Stripe paid-order state and the existing manual fulfillment process. These are outside Decap.</dd></div>',
      '</dl>',
      '</div>',
      '</details>',
    ].join('');

    panel.querySelector('[data-blackbox-cms-stock-link="true"]')?.setAttribute('href', getStockOperationsUrl());
    document.body.append(panel);
  };

  const getPreviewToggleButton = () =>
    document.querySelector('button[data-blackbox-preview-toggle="true"]') ||
    Array.from(document.querySelectorAll('button')).find(
      (button) => (button.getAttribute('title') || '').trim().toLowerCase() === 'toggle preview',
    ) ||
    null;

  const fixedLayoutSectionEntryHashes = new Set([
    '#/collections/home/entries/home-site',
    '#/collections/about/entries/about-site',
    '#/collections/services/entries/services-site',
  ]);

  const lockFixedLayoutSectionActions = (topBar) => {
    if (!fixedLayoutSectionEntryHashes.has(window.location.hash.split('?')[0])) {
      return false;
    }

    const controlContainer = topBar.closest('[class*="ControlContainer"]');
    if (controlContainer?.firstElementChild?.textContent?.trim() !== 'Sections') {
      return false;
    }

    topBar.dataset.blackboxFixedSectionActions = 'locked';
    topBar.querySelectorAll('button, [role="button"]').forEach((button) => {
      button.hidden = true;
      button.setAttribute('aria-hidden', 'true');
      button.setAttribute('tabindex', '-1');
    });
    return true;
  };

  const syncFixedLayoutSectionActions = () => {
    if (!fixedLayoutSectionEntryHashes.has(window.location.hash.split('?')[0])) {
      return;
    }

    const topBars = Array.from(document.querySelectorAll('[class*="ListItemTopBar"]'));
    topBars.forEach((topBar) => {
      if (topBar.closest('[class*="SortableListItem"]')) lockFixedLayoutSectionActions(topBar);
    });
  };

  const syncTopLevelMediaSurface = () => {
    const mediaButton = Array.from(document.querySelectorAll('nav button')).find(
      (button) => (button.textContent || '').replace(/\s+/g, ' ').trim().toLowerCase() === 'media',
    );
    if (!mediaButton) return;

    mediaButton.dataset.blackboxTopLevelMedia = 'hidden';
    mediaButton.hidden = true;
    mediaButton.setAttribute('aria-hidden', 'true');
    mediaButton.setAttribute('tabindex', '-1');
  };

  const ensurePreviewToggleContent = (previewToggleButton) => {
    let previewCopy = previewToggleButton.querySelector('[data-blackbox-preview-copy="true"]');
    let previewLabel = previewToggleButton.querySelector('[data-blackbox-preview-label="true"]');
    let previewStatus = previewToggleButton.querySelector('[data-blackbox-preview-status="true"]');

    if (!previewCopy) {
      previewCopy = document.createElement('span');
      previewCopy.dataset.blackboxPreviewCopy = 'true';
      previewToggleButton.append(previewCopy);
    }

    if (!previewLabel) {
      previewLabel = document.createElement('span');
      previewLabel.dataset.blackboxPreviewLabel = 'true';
      previewCopy.append(previewLabel);
    }

    if (!previewStatus) {
      previewStatus = document.createElement('span');
      previewStatus.dataset.blackboxPreviewStatus = 'true';
      previewCopy.append(previewStatus);
    }

    return {
      previewLabel,
      previewStatus,
    };
  };

  const syncPreviewToggleButtonState = () => {
    const previewToggleButton = getPreviewToggleButton();
    if (!previewToggleButton) {
      return;
    }

    const previewPane = getPreviewPane();
    const previewIsVisible = isPreviewPaneVisible(previewPane);
    const nextActionLabel = previewIsVisible ? 'Hide preview' : 'Open preview';
    const previewStatusLabel = previewIsVisible ? 'Preview visible' : 'Preview hidden';
    const previewStatusChipLabel = previewIsVisible ? 'Visible' : 'Hidden';
    const { previewLabel, previewStatus } = ensurePreviewToggleContent(previewToggleButton);

    previewToggleButton.dataset.blackboxPreviewToggle = 'true';
    previewToggleButton.dataset.previewState = previewIsVisible ? 'open' : 'closed';
    previewToggleButton.dataset.previewLabel = nextActionLabel;
    previewToggleButton.dataset.previewStatus = previewStatusChipLabel;
    previewToggleButton.setAttribute('aria-label', `${nextActionLabel}. ${previewStatusLabel}.`);
    previewToggleButton.setAttribute('aria-expanded', String(previewIsVisible));
    previewToggleButton.setAttribute('aria-pressed', String(previewIsVisible));
    previewToggleButton.setAttribute('title', nextActionLabel);
    if (previewPane) {
      previewPane.id ||= 'blackbox-cms-preview-pane';
      previewToggleButton.setAttribute('aria-controls', previewPane.id);
    } else {
      previewToggleButton.removeAttribute('aria-controls');
    }
    previewLabel.textContent = nextActionLabel;
    previewStatus.textContent = previewStatusChipLabel;

    if (!previewToggleButton.hasAttribute(previewToggleClickBoundAttribute)) {
      previewToggleButton.setAttribute(previewToggleClickBoundAttribute, 'true');
      previewToggleButton.addEventListener('click', (event) => {
        window.setTimeout(() => {
          if (!isCurrentBootAttempt()) {
            return;
          }

          syncPreviewToggleButtonState();
          if (event.isTrusted) previewToggleButton.focus({ preventScroll: true });
        }, 60);
      });
    }

    document.documentElement.dataset.blackboxCmsPreview = previewIsVisible ? 'open' : 'collapsed';
  };

  const getPreviewPane = () =>
    document.querySelector('[class*="PreviewPaneFrame"]') ||
    document.querySelector('[class*="PreviewPaneContainer"]:not([class*="ControlPaneContainer"])');

  const isPreviewPaneVisible = (previewPane = getPreviewPane()) => {
    if (!previewPane) {
      return false;
    }

    return previewPane.getBoundingClientRect().width > 120;
  };

  const clearPreviewCollapseSchedule = () => {
    previewCollapseTimerIds.forEach((timerId) => window.clearTimeout(timerId));
    previewCollapseTimerIds.clear();
    previewCollapseScheduleActive = false;
  };

  const schedulePreviewCollapse = () => {
    if (!isCurrentBootAttempt()) {
      return;
    }

    syncPreviewToggleButtonState();

    if (!isEntryEditorRoute() || hasAutoCollapsedPreview() || previewCollapseScheduleActive) {
      return;
    }

    const delays = [0, 50, 140, 280, 450, 700];
    previewCollapseScheduleActive = true;
    delays.forEach((delay, index) => {
      const timerId = window.setTimeout(() => {
        previewCollapseTimerIds.delete(timerId);
        if (!isCurrentBootAttempt()) {
          clearPreviewCollapseSchedule();
          return;
        }

        if (!isEntryEditorRoute() || hasAutoCollapsedPreview() || !isPreviewPaneVisible() || previewCollapseInFlight) {
          if (index === delays.length - 1) previewCollapseScheduleActive = false;
          return;
        }

        const previewToggleButton = getPreviewToggleButton();
        if (!previewToggleButton) {
          if (index === delays.length - 1) previewCollapseScheduleActive = false;
          return;
        }

        clearPreviewCollapseSchedule();
        previewCollapseInFlight = true;
        previewToggleButton.click();
        markPreviewAsAutoCollapsed();

        window.setTimeout(() => {
          if (!isCurrentBootAttempt()) {
            return;
          }

          syncPreviewToggleButtonState();

          if (!isPreviewPaneVisible()) {
            document.documentElement.dataset.blackboxCmsPreview = 'collapsed';
          } else {
            try {
              window.sessionStorage.removeItem(previewAutoCollapseKey);
            } catch {
              // Ignore browsers that block sessionStorage in private contexts.
            }
          }

          previewCollapseInFlight = false;
        }, 90);
      }, delay);
      previewCollapseTimerIds.add(timerId);
    });
  };

  const startEntryEditorPreviewController = () => {
    let stopped = false;
    let animationFrameId = 0;
    const triggerPreviewCollapse = () => {
      if (stopped || !isCurrentBootAttempt()) {
        return;
      }

      if (reloadOnSavedSingletonRouteChange()) {
        return;
      }

      if (animationFrameId) return;

      animationFrameId = window.requestAnimationFrame(() => {
        animationFrameId = 0;
        if (stopped || !isCurrentBootAttempt()) {
          return;
        }

        syncAuthLoginSurface();
        syncEditorScopePanel();
        syncTopLevelMediaSurface();
        syncPreviewToggleButtonState();
        syncFixedLayoutSectionActions();
        syncSingletonContentGuard();
        schedulePreviewCollapse();
      });
    };

    window.addEventListener('hashchange', triggerPreviewCollapse);

    const observer = new MutationObserver((mutations) => {
      if (mutations.some((mutation) => mutation.addedNodes.length > 0 || mutation.removedNodes.length > 0)) {
        triggerPreviewCollapse();
      }
    });

    if (document.body) {
      observer.observe(document.body, {
        childList: true,
        subtree: true,
      });
    }

    triggerPreviewCollapse();

    return () => {
      stopped = true;
      window.removeEventListener('hashchange', triggerPreviewCollapse);
      observer.disconnect();
      if (animationFrameId) {
        window.cancelAnimationFrame(animationFrameId);
        animationFrameId = 0;
      }
      removeSingletonContentGuard();
      removeEditorScopePanel();
      clearPreviewCollapseSchedule();
      previewCollapseInFlight = false;
    };
  };

  const resolveAssetUrl = (value, getAsset, collectionKey) => {
    if (typeof previewAssetResolver !== 'function') return '';

    try {
      return previewAssetResolver({
        value,
        getAsset,
        collectionKey,
        adminMediaBaseUrl: getAdminMediaBaseUrl(),
        allowedCollections: mediaCollections,
      });
    } catch {
      return '';
    }
  };

  if (adminContext.exposeTestHooks) {
    window.__BLACKBOX_ADMIN_TEST_HOOKS__ = {
      getActiveSingletonEditor,
      isSingletonEditorEmptyLoad,
      reloadOnSavedSingletonRouteChange,
      schedulePreviewCollapse,
      syncAuthLoginSurface,
      syncEditorScopePanel,
      syncFixedLayoutSectionActions,
      syncPreviewToggleButtonState,
      syncTopLevelMediaSurface,
    };
  }

  const createElementFactory = (h) => {
    const renderImage = (url, alt, className, fallbackLabel) =>
      url
        ? h('img', {
            className,
            src: url,
            alt: alt || '',
          })
        : h(
            'div',
            {
              className: `${className} blackbox-preview__media-fallback`,
              role: 'img',
              'aria-label': `${toText(fallbackLabel).slice(0, 120) || 'Preview image'} unavailable`,
            },
            `${toText(fallbackLabel).slice(0, 120) || 'Preview image'} unavailable`,
          );

    const renderBulletList = (items) =>
      h(
        'ul',
        { className: 'blackbox-preview__list' },
        items.map((item, index) => h('li', { key: `${item}-${index}` }, item)),
      );

    const renderPills = (items, className = 'blackbox-preview__pill') =>
      h(
        'div',
        { className: 'blackbox-preview__pill-row' },
        items.map((item, index) =>
          h(
            'span',
            {
              key: `${item}-${index}`,
              className,
            },
            item,
          ),
        ),
      );

    const renderButton = (label, subtle = false) =>
      h(
        'div',
        {
          className: subtle ? 'blackbox-preview__button blackbox-preview__button--subtle' : 'blackbox-preview__button',
        },
        label,
      );

    return {
      renderButton,
      renderBulletList,
      renderImage,
      renderPills,
    };
  };

  const registeredPreviewCollections = [
    'home-site',
    'about-site',
    'services-site',
    'artists',
    'releases',
    'distro',
    'news',
  ];
  const markReady = () => {
    if (!isCurrentBootAttempt()) {
      return;
    }

    window.__BLACKBOX_ADMIN_READY__ = true;
    window.__BLACKBOX_ADMIN_PREVIEW_COLLECTIONS__ = registeredPreviewCollections;
    window.dispatchEvent(new CustomEvent('blackbox:decap-ready', { detail: { attemptId: bootAttemptId } }));
  };
  const markFailed = () => {
    if (isCurrentBootAttempt()) {
      window.dispatchEvent(new CustomEvent('blackbox:decap-failed', { detail: { attemptId: bootAttemptId } }));
    }
  };

  function runRegisterWhenReady() {
    try {
      registerWhenReady();
    } catch {
      markFailed();
    }
  }

  const registerWhenReady = () => {
    if (!isCurrentBootAttempt()) {
      return;
    }

    if (!window.CMS || !window.createClass || !window.h || !window.initCMS) {
      window.setTimeout(runRegisterWhenReady, 30);
      return;
    }

    const CMS = window.CMS;
    const createClass = window.createClass;
    const h = window.h;
    const { renderButton, renderBulletList, renderImage, renderPills } = createElementFactory(h);
    const findSection = (sections, type) => toArray(sections).find((section) => section?.type === type);

    if (previewStyleUrl) {
      CMS.registerPreviewStyle(previewStyleUrl);
    }

    const HomePreview = createClass({
      render() {
        const entry = this.props.entry;
        const data = toObject(entry.get('data'));
        const hero = toObject(data.hero);
        const sections = toArray(data.sections);
        const news = findSection(sections, 'news');
        const artists = findSection(sections, 'artists');
        const heroImageUrl = resolveAssetUrl(entry.getIn(['data', 'hero', 'image']), this.props.getAsset, 'home');

        return h('div', { className: 'blackbox-preview blackbox-preview--home' }, [
          h('div', { className: 'blackbox-preview__shell' }, [
            h('section', { className: 'blackbox-preview__hero-surface' }, [
              h('div', { className: 'blackbox-preview__hero-grid' }, [
                h('div', { className: 'blackbox-preview__hero-copy' }, [
                  h('p', { className: 'blackbox-preview__eyebrow' }, 'Home'),
                  h('h1', { className: 'blackbox-preview__title' }, 'BlackBox Records'),
                  h(
                    'p',
                    { className: 'blackbox-preview__copy blackbox-preview__copy--lead' },
                    hero.tagline || 'Heavy music on record.',
                  ),
                  renderPills(
                    [toText(news?.title || 'News'), toText(artists?.title || 'Artists')].filter(Boolean),
                    'blackbox-preview__pill blackbox-preview__pill--muted',
                  ),
                ]),
                h('div', { className: 'blackbox-preview__hero-media' }, [
                  renderImage(heroImageUrl, hero.image_alt, 'blackbox-preview__media', 'Hero image'),
                ]),
              ]),
            ]),
            h('section', { className: 'blackbox-preview__grid blackbox-preview__grid--two' }, [
              h('article', { className: 'blackbox-preview__card' }, [
                h('h2', { className: 'blackbox-preview__card-title' }, toText(news?.title || 'News')),
                renderButton(toText(news?.link_text || 'Read News'), true),
              ]),
              h('article', { className: 'blackbox-preview__card' }, [
                h('h2', { className: 'blackbox-preview__card-title' }, toText(artists?.title || 'Artists')),
                renderButton(toText(artists?.button_text || 'View Full Roster'), true),
              ]),
            ]),
          ]),
        ]);
      },
    });

    const AboutPreview = createClass({
      render() {
        const entry = this.props.entry;
        const data = toObject(entry.get('data'));
        const hero = toObject(data.hero);
        const sections = toArray(data.sections);
        const lead = findSection(sections, 'lead');
        const story = findSection(sections, 'story');
        const quote = findSection(sections, 'quote');
        const contact = findSection(sections, 'contact');
        const stats = findSection(sections, 'stats');
        const heroImageUrl = resolveAssetUrl(entry.getIn(['data', 'hero', 'image']), this.props.getAsset, 'about');

        return h('div', { className: 'blackbox-preview blackbox-preview--about' }, [
          h('div', { className: 'blackbox-preview__shell' }, [
            h('section', { className: 'blackbox-preview__hero-surface blackbox-preview__hero-surface--compact' }, [
              h('div', { className: 'blackbox-preview__hero-grid' }, [
                h('div', { className: 'blackbox-preview__hero-copy' }, [
                  h('p', { className: 'blackbox-preview__eyebrow' }, toText(hero.section_label || 'About')),
                  h('h1', { className: 'blackbox-preview__title' }, toText(hero.title || 'The Label')),
                  h(
                    'p',
                    { className: 'blackbox-preview__copy blackbox-preview__copy--lead' },
                    toText(lead?.text || ''),
                  ),
                ]),
                h('div', { className: 'blackbox-preview__hero-media' }, [
                  renderImage(
                    heroImageUrl,
                    hero.image_alt,
                    'blackbox-preview__media blackbox-preview__media--muted',
                    'About image',
                  ),
                ]),
              ]),
            ]),
            story || quote || contact
              ? h('section', { className: 'blackbox-preview__grid blackbox-preview__grid--two' }, [
                  story
                    ? h('article', { className: 'blackbox-preview__card', key: 'story' }, [
                        h('h2', { className: 'blackbox-preview__card-title' }, toText(story.title || 'Story')),
                        ...toArray(story.paragraphs)
                          .slice(0, 2)
                          .map((paragraph, paragraphIndex) =>
                            h(
                              'p',
                              {
                                key: `paragraph-${paragraphIndex}`,
                                className: 'blackbox-preview__copy',
                              },
                              paragraph,
                            ),
                          ),
                      ])
                    : null,
                  quote
                    ? h(
                        'article',
                        { className: 'blackbox-preview__card blackbox-preview__card--quote', key: 'quote' },
                        [
                          h('p', { className: 'blackbox-preview__eyebrow' }, 'Quote'),
                          h('blockquote', { className: 'blackbox-preview__quote' }, toText(quote.text)),
                          h('p', { className: 'blackbox-preview__meta' }, toText(quote.cite)),
                        ],
                      )
                    : null,
                  contact
                    ? h('article', { className: 'blackbox-preview__card', key: 'contact' }, [
                        h('p', { className: 'blackbox-preview__eyebrow' }, toText(contact.title || 'Contact')),
                        h('p', { className: 'blackbox-preview__copy' }, toText(contact.intro)),
                        h(
                          'div',
                          { className: 'blackbox-preview__stack' },
                          toArray(contact.items).map((item, index) =>
                            h('div', { className: 'blackbox-preview__contact-row', key: `contact-${index}` }, [
                              h('span', { className: 'blackbox-preview__meta' }, toText(item.label)),
                              h('span', { className: 'blackbox-preview__copy' }, toText(item.value)),
                            ]),
                          ),
                        ),
                      ])
                    : null,
                ])
              : null,
            stats
              ? h('section', { className: 'blackbox-preview__grid blackbox-preview__grid--four' }, [
                  h('article', { className: 'blackbox-preview__card blackbox-preview__card--stats' }, [
                    h('p', { className: 'blackbox-preview__eyebrow' }, 'Stats'),
                    h(
                      'div',
                      { className: 'blackbox-preview__stats-grid' },
                      toArray(stats.items).map((item, index) =>
                        h('div', { className: 'blackbox-preview__stat', key: `stat-${index}` }, [
                          h(
                            'span',
                            { className: 'blackbox-preview__card-title blackbox-preview__card-title--small' },
                            toText(item.key),
                          ),
                          h('p', { className: 'blackbox-preview__meta' }, toText(item.label)),
                        ]),
                      ),
                    ),
                  ]),
                ])
              : null,
          ]),
        ]);
      },
    });

    const ServicesPreview = createClass({
      render() {
        const entry = this.props.entry;
        const data = toObject(entry.get('data'));
        const hero = toObject(data.hero);
        const sections = toArray(data.sections);
        const servicesSection = findSection(sections, 'services');
        const process = findSection(sections, 'process');
        const inquiry = findSection(sections, 'inquiry');
        const servicesSectionIndex = sections.findIndex((section) => section?.type === 'services');

        return h('div', { className: 'blackbox-preview blackbox-preview--services' }, [
          h('div', { className: 'blackbox-preview__shell' }, [
            h('section', { className: 'blackbox-preview__header-strip' }, [
              h('p', { className: 'blackbox-preview__eyebrow' }, 'Services'),
              h('h1', { className: 'blackbox-preview__title' }, toText(hero.title || 'Services')),
              h('p', { className: 'blackbox-preview__copy blackbox-preview__copy--lead' }, toText(hero.intro)),
              renderButton(toText(hero.cta_text || 'Start an Inquiry'), true),
            ]),
            servicesSection
              ? h(
                  'section',
                  { className: 'blackbox-preview__stack blackbox-preview__stack--large' },
                  toArray(servicesSection.items).map((service, index) => {
                    const imageUrl =
                      servicesSectionIndex >= 0
                        ? resolveAssetUrl(
                            entry.getIn(['data', 'sections', servicesSectionIndex, 'items', index, 'image']),
                            this.props.getAsset,
                            'services',
                          )
                        : null;
                    return h('article', { className: 'blackbox-preview__service-card', key: service.id || index }, [
                      h('div', { className: 'blackbox-preview__service-media' }, [
                        renderImage(
                          imageUrl,
                          service.image_alt,
                          'blackbox-preview__media blackbox-preview__media--muted',
                          service.title || 'Service image',
                        ),
                      ]),
                      h('div', { className: 'blackbox-preview__service-copy' }, [
                        h(
                          'p',
                          { className: 'blackbox-preview__meta' },
                          titleCase(service.id || `service-${index + 1}`),
                        ),
                        h('h2', { className: 'blackbox-preview__card-title' }, toText(service.title)),
                        h('p', { className: 'blackbox-preview__copy' }, toText(service.summary)),
                        renderBulletList(toArray(service.bullets)),
                        service.partner_name
                          ? renderPills(
                              [`With ${service.partner_name}`],
                              'blackbox-preview__pill blackbox-preview__pill--accent',
                            )
                          : null,
                        h(
                          'p',
                          { className: 'blackbox-preview__meta blackbox-preview__meta--note' },
                          toText(service.contact_note),
                        ),
                      ]),
                    ]);
                  }),
                )
              : null,
            process
              ? h('section', { className: 'blackbox-preview__process-surface' }, [
                  h('p', { className: 'blackbox-preview__eyebrow' }, 'How We Work'),
                  h(
                    'h2',
                    { className: 'blackbox-preview__title blackbox-preview__title--section' },
                    toText(process.title),
                  ),
                  h('p', { className: 'blackbox-preview__copy' }, toText(process.intro)),
                  h(
                    'div',
                    { className: 'blackbox-preview__grid blackbox-preview__grid--three' },
                    toArray(process.steps).map((step, index) =>
                      h(
                        'article',
                        { className: 'blackbox-preview__card blackbox-preview__card--step', key: `step-${index}` },
                        [
                          h('span', { className: 'blackbox-preview__step-number' }, `0${index + 1}`),
                          h(
                            'h3',
                            { className: 'blackbox-preview__card-title blackbox-preview__card-title--small' },
                            toText(step.title),
                          ),
                          h('p', { className: 'blackbox-preview__copy' }, toText(step.body)),
                        ],
                      ),
                    ),
                  ),
                ])
              : null,
            inquiry
              ? h('section', { className: 'blackbox-preview__inquiry-surface' }, [
                  h('p', { className: 'blackbox-preview__eyebrow' }, 'Inquiry'),
                  h(
                    'h2',
                    { className: 'blackbox-preview__title blackbox-preview__title--section' },
                    toText(inquiry.title),
                  ),
                  h('p', { className: 'blackbox-preview__copy' }, toText(inquiry.intro)),
                  renderPills(
                    ['Name', 'Email', 'Band / Project', 'Service', 'Message'],
                    'blackbox-preview__pill blackbox-preview__pill--outline',
                  ),
                  renderButton(toText(inquiry.submit_text || 'Compose Inquiry')),
                ])
              : null,
          ]),
        ]);
      },
    });

    const ArtistPreview = createClass({
      render() {
        const entry = this.props.entry;
        const data = toObject(entry.get('data'));
        const imageUrl = resolveAssetUrl(entry.getIn(['data', 'image']), this.props.getAsset, 'artists');
        const metaItems = [data.genre, data.country].filter(Boolean);
        const profileLinks = toArray(data.profile_links);
        const videos = toArray(data.videos);

        return h('div', { className: 'blackbox-preview blackbox-preview--artist' }, [
          h('div', { className: 'blackbox-preview__shell blackbox-preview__shell--narrow' }, [
            h('article', { className: 'blackbox-preview__artist-card' }, [
              h('div', { className: 'blackbox-preview__artist-media' }, [
                renderImage(imageUrl, data.image_alt, 'blackbox-preview__media', toText(data.title || 'Artist image')),
              ]),
              h('div', { className: 'blackbox-preview__artist-copy' }, [
                h('p', { className: 'blackbox-preview__eyebrow' }, 'Artist'),
                h('h1', { className: 'blackbox-preview__title' }, toText(data.title || 'Artist title')),
                metaItems.length ? renderPills(metaItems) : null,
                h('p', { className: 'blackbox-preview__copy' }, toText(data.bio)),
                profileLinks.length || videos.length
                  ? renderPills(
                      [
                        profileLinks.length
                          ? `${profileLinks.length} profile ${profileLinks.length === 1 ? 'link' : 'links'}`
                          : '',
                        videos.length ? `${videos.length} ${videos.length === 1 ? 'video' : 'videos'}` : '',
                      ].filter(Boolean),
                      'blackbox-preview__pill blackbox-preview__pill--outline',
                    )
                  : null,
                data.upcoming_release
                  ? h(
                      'p',
                      { className: 'blackbox-preview__meta blackbox-preview__meta--note' },
                      `Upcoming: ${data.upcoming_release}`,
                    )
                  : null,
              ]),
            ]),
          ]),
        ]);
      },
    });

    const ReleasePreview = createClass({
      render() {
        const entry = this.props.entry;
        const data = toObject(entry.get('data'));
        const coverImageUrl = resolveAssetUrl(entry.getIn(['data', 'cover_image']), this.props.getAsset, 'releases');
        const releaseDate = toText(data.release_date).slice(0, 10);
        const credits = toArray(data.credits);

        return h('div', { className: 'blackbox-preview blackbox-preview--release' }, [
          h('div', { className: 'blackbox-preview__shell blackbox-preview__shell--narrow' }, [
            h('article', { className: 'blackbox-preview__release-card' }, [
              h('div', { className: 'blackbox-preview__release-cover' }, [
                renderImage(
                  coverImageUrl,
                  data.cover_image_alt,
                  'blackbox-preview__media',
                  toText(data.title || 'Release cover'),
                ),
              ]),
              h('div', { className: 'blackbox-preview__release-copy' }, [
                h('p', { className: 'blackbox-preview__eyebrow' }, 'Release'),
                h('h1', { className: 'blackbox-preview__title' }, toText(data.title || 'Release title')),
                renderPills(
                  [titleCase(data.artist), releaseDate].filter(Boolean),
                  'blackbox-preview__pill blackbox-preview__pill--muted',
                ),
                data.summary ? h('p', { className: 'blackbox-preview__copy' }, toText(data.summary)) : null,
                toArray(data.formats).length
                  ? renderPills(toArray(data.formats), 'blackbox-preview__pill blackbox-preview__pill--outline')
                  : null,
                h(
                  'p',
                  { className: 'blackbox-preview__meta blackbox-preview__meta--note' },
                  'Editorial preview only. Price, stock, checkout availability, orders, and fulfillment are managed outside Decap.',
                ),
                credits.length
                  ? h(
                      'div',
                      { className: 'blackbox-preview__stack' },
                      credits.map((credit, index) =>
                        h('div', { className: 'blackbox-preview__contact-row', key: `credit-${index}` }, [
                          h('span', { className: 'blackbox-preview__meta' }, toText(credit.role)),
                          h('span', { className: 'blackbox-preview__copy' }, toText(credit.name)),
                        ]),
                      ),
                    )
                  : null,
              ]),
            ]),
          ]),
        ]);
      },
    });

    const DistroPreview = createClass({
      render() {
        const entry = this.props.entry;
        const data = toObject(entry.get('data'));
        const imageUrl = resolveAssetUrl(entry.getIn(['data', 'image']), this.props.getAsset, 'distro');

        return h('div', { className: 'blackbox-preview blackbox-preview--distro' }, [
          h('div', { className: 'blackbox-preview__shell blackbox-preview__shell--narrow' }, [
            h('article', { className: 'blackbox-preview__catalog-card' }, [
              h('div', { className: 'blackbox-preview__catalog-media' }, [
                renderImage(imageUrl, data.image_alt, 'blackbox-preview__media', toText(data.title || 'Distro image')),
              ]),
              h('div', { className: 'blackbox-preview__catalog-copy' }, [
                h('p', { className: 'blackbox-preview__eyebrow' }, toText(data.group || 'Distro')),
                h('h1', { className: 'blackbox-preview__title blackbox-preview__title--section' }, toText(data.title)),
                h('p', { className: 'blackbox-preview__meta' }, toText(data.artist_or_label)),
                data.summary ? h('p', { className: 'blackbox-preview__copy' }, toText(data.summary)) : null,
                renderPills(
                  [data.eyebrow, data.format, data.order !== undefined ? `Order ${data.order}` : ''].filter(Boolean),
                  'blackbox-preview__pill blackbox-preview__pill--outline',
                ),
                h(
                  'p',
                  { className: 'blackbox-preview__meta blackbox-preview__meta--note' },
                  'To stop selling, use protected stock or commerce-operator controls. Keep this editorial entry.',
                ),
                renderButton('View in Store', true),
              ]),
            ]),
          ]),
        ]);
      },
    });

    const NewsPreview = createClass({
      render() {
        const entry = this.props.entry;
        const data = toObject(entry.get('data'));
        const imageUrl = resolveAssetUrl(entry.getIn(['data', 'image']), this.props.getAsset, 'news');
        const date = toText(data.date).slice(0, 10);
        const body = toText(data.body).trim();

        return h('div', { className: 'blackbox-preview blackbox-preview--news' }, [
          h('div', { className: 'blackbox-preview__shell blackbox-preview__shell--narrow' }, [
            h('article', { className: 'blackbox-preview__news-card' }, [
              h('div', { className: 'blackbox-preview__news-media' }, [
                renderImage(imageUrl, data.image_alt, 'blackbox-preview__media', toText(data.title || 'News image')),
              ]),
              h('div', { className: 'blackbox-preview__news-copy' }, [
                h('p', { className: 'blackbox-preview__eyebrow' }, toText(data.section_label || 'News')),
                h(
                  'h1',
                  { className: 'blackbox-preview__title blackbox-preview__title--section' },
                  toText(data.title || 'News title'),
                ),
                renderPills([date].filter(Boolean), 'blackbox-preview__pill blackbox-preview__pill--muted'),
                h('p', { className: 'blackbox-preview__copy' }, toText(data.summary)),
                h('div', { className: 'blackbox-preview__stack' }, [
                  h('p', { className: 'blackbox-preview__meta' }, 'Article body'),
                  h(
                    'p',
                    { className: 'blackbox-preview__copy' },
                    body ? body.slice(0, 600) : 'Add article body copy before publishing.',
                  ),
                ]),
              ]),
            ]),
          ]),
        ]);
      },
    });

    CMS.registerPreviewTemplate('home', HomePreview);
    CMS.registerPreviewTemplate('home-site', HomePreview);
    CMS.registerPreviewTemplate('about', AboutPreview);
    CMS.registerPreviewTemplate('about-site', AboutPreview);
    CMS.registerPreviewTemplate('services', ServicesPreview);
    CMS.registerPreviewTemplate('services-site', ServicesPreview);
    CMS.registerPreviewTemplate('artists', ArtistPreview);
    CMS.registerPreviewTemplate('releases', ReleasePreview);
    CMS.registerPreviewTemplate('distro', DistroPreview);
    CMS.registerPreviewTemplate('news', NewsPreview);

    try {
      const initialization = window.initCMS();
      adminContext.cleanupAttempt?.();
      const cleanupPreviewController = startEntryEditorPreviewController();
      const cleanupAttempt = () => {
        cleanupPreviewController();
        if (adminContext.cleanupAttempt === cleanupAttempt) {
          delete adminContext.cleanupAttempt;
        }
      };
      adminContext.cleanupAttempt = cleanupAttempt;

      if (initialization && typeof initialization.then === 'function') {
        initialization.then(markReady, markFailed);
      } else {
        markReady();
      }
    } catch {
      markFailed();
    }
  };

  runRegisterWhenReady();
})();

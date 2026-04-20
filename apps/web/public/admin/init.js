(() => {
  const adminContext = window.__BLACKBOX_ADMIN__ || {};
  const previewStyleUrl = adminContext.previewStyleUrl;
  const previewAutoCollapseKey = 'blackbox-cms-preview-auto-collapsed';
  const previewToggleClickBoundAttribute = 'data-preview-toggle-click-bound';
  let previewCollapseInFlight = false;

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
    if (value == null) {
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
    const adminRootPath = pathname.includes('/admin/') ? pathname.slice(0, pathname.indexOf('/admin/') + '/admin/'.length) : '/admin/';
    return `${window.location.origin}${adminRootPath}media/`;
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

  const getPreviewToggleButton = () =>
    document.querySelector('button[data-blackbox-preview-toggle="true"]') ||
    Array.from(document.querySelectorAll('button')).find(
      (button) => (button.getAttribute('title') || '').trim().toLowerCase() === 'toggle preview',
    ) ||
    null;

  const enhanceListItemActionButtons = () => {
    const topBars = Array.from(document.querySelectorAll('[class*="ListItemTopBar"]'));
    topBars.forEach((topBar) => {
      if (!topBar.closest('[class*="SortableListItem"]') || topBar.querySelector('[data-blackbox-section-row-action="remove"]')) {
        return;
      }

      const topBarButtons = Array.from(topBar.querySelectorAll('button')).filter((button) =>
        button.className.includes('TopBarButton'),
      );
      if (topBarButtons.length < 2) {
        return;
      }

      const targetButton = topBarButtons[topBarButtons.length - 1];
      const targetLabel = `${targetButton.getAttribute('aria-label') || ''} ${targetButton.getAttribute('title') || ''} ${targetButton.textContent || ''}`.trim();
      if (targetLabel) {
        return;
      }

      targetButton.dataset.blackboxSectionRowAction = 'remove';
      targetButton.setAttribute('aria-label', 'Remove section');
      targetButton.setAttribute('title', 'Remove section');

      if (!targetButton.querySelector('[data-blackbox-section-row-action-label="true"]')) {
        const visibleLabel = document.createElement('span');
        visibleLabel.dataset.blackboxSectionRowActionLabel = 'true';
        visibleLabel.textContent = 'Remove';
        targetButton.append(visibleLabel);
      }
    });
  };

  const ensurePreviewToggleContent = (previewToggleButton) => {
    let previewCopy = previewToggleButton.querySelector('[data-blackbox-preview-copy="true"]');
    let previewLabel = previewToggleButton.querySelector('[data-blackbox-preview-label="true"]');
    let previewStatus = previewToggleButton.querySelector('[data-blackbox-preview-status="true"]');

    if (!previewCopy) {
      previewCopy = document.createElement('span');
      previewCopy.dataset.blackboxPreviewCopy = 'true';

      previewLabel = document.createElement('span');
      previewLabel.dataset.blackboxPreviewLabel = 'true';

      previewStatus = document.createElement('span');
      previewStatus.dataset.blackboxPreviewStatus = 'true';

      previewCopy.append(previewLabel, previewStatus);
      previewToggleButton.append(previewCopy);
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

    const previewIsVisible = isPreviewPaneVisible();
    const nextActionLabel = previewIsVisible ? 'Hide preview' : 'Open preview';
    const previewStatusLabel = previewIsVisible ? 'Preview visible' : 'Preview hidden';
    const previewStatusChipLabel = previewIsVisible ? 'Visible' : 'Hidden';
    const { previewLabel, previewStatus } = ensurePreviewToggleContent(previewToggleButton);

    previewToggleButton.dataset.blackboxPreviewToggle = 'true';
    previewToggleButton.dataset.previewState = previewIsVisible ? 'open' : 'closed';
    previewToggleButton.dataset.previewLabel = nextActionLabel;
    previewToggleButton.dataset.previewStatus = previewStatusChipLabel;
    previewToggleButton.setAttribute('aria-label', `${nextActionLabel}. ${previewStatusLabel}.`);
    previewToggleButton.setAttribute('aria-pressed', String(previewIsVisible));
    previewToggleButton.setAttribute('title', nextActionLabel);
    previewLabel.textContent = nextActionLabel;
    previewStatus.textContent = previewStatusChipLabel;

    if (!previewToggleButton.hasAttribute(previewToggleClickBoundAttribute)) {
      previewToggleButton.setAttribute(previewToggleClickBoundAttribute, 'true');
      previewToggleButton.addEventListener('click', () => {
        window.setTimeout(() => {
          syncPreviewToggleButtonState();
        }, 60);
      });
    }

    document.documentElement.dataset.blackboxCmsPreview = previewIsVisible ? 'open' : 'collapsed';
  };

  const isPreviewPaneVisible = () => {
    const previewPane =
      document.querySelector('[class*="PreviewPaneFrame"]') ||
      document.querySelector('[class*="PreviewPaneContainer"]:not([class*="ControlPaneContainer"])');

    if (!previewPane) {
      return false;
    }

    return previewPane.getBoundingClientRect().width > 120;
  };

  const schedulePreviewCollapse = () => {
    syncPreviewToggleButtonState();

    if (!isEntryEditorRoute() || hasAutoCollapsedPreview()) {
      return;
    }

    const delays = [0, 50, 140, 280, 450, 700];
    delays.forEach((delay) => {
      window.setTimeout(() => {
        if (!isEntryEditorRoute() || hasAutoCollapsedPreview() || !isPreviewPaneVisible() || previewCollapseInFlight) {
          return;
        }

        const previewToggleButton = getPreviewToggleButton();
        if (!previewToggleButton) {
          return;
        }

        previewCollapseInFlight = true;
        previewToggleButton.click();
        markPreviewAsAutoCollapsed();

        window.setTimeout(() => {
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
    });
  };

  const startEntryEditorPreviewController = () => {
    const triggerPreviewCollapse = () => {
      window.requestAnimationFrame(() => {
        syncPreviewToggleButtonState();
        enhanceListItemActionButtons();
        schedulePreviewCollapse();
      });
    };

    window.addEventListener('hashchange', triggerPreviewCollapse);

    const observer = new MutationObserver(() => {
      triggerPreviewCollapse();
    });

    if (document.body) {
      observer.observe(document.body, {
        childList: true,
        subtree: true,
      });
    }

    triggerPreviewCollapse();
  };

  const resolveAssetUrl = (value, getAsset, collectionKey) => {
    const rawValue = toText(value).trim();
    if (!rawValue) {
      return '';
    }

    const fallbackCollectionAssetUrl =
      rawValue.startsWith('./') && collectionKey
        ? `${getAdminMediaBaseUrl()}${collectionKey}/${rawValue.slice(2)}`
        : rawValue;

    if (typeof getAsset !== 'function') {
      return fallbackCollectionAssetUrl;
    }

    const resolvedAsset = getAsset(value);
    if (resolvedAsset && typeof resolvedAsset === 'string') {
      if (/^(blob:|data:|https?:\/\/)/i.test(resolvedAsset)) {
        return resolvedAsset;
      }

      if (resolvedAsset.startsWith('/') && (!collectionKey || resolvedAsset.includes('/admin/media/'))) {
        return resolvedAsset;
      }
    }

    if (resolvedAsset && typeof resolvedAsset.url === 'string') {
      if (collectionKey && resolvedAsset.url.includes('/admin/') && !resolvedAsset.url.includes('/admin/media/')) {
        return fallbackCollectionAssetUrl;
      }

      return resolvedAsset.url;
    }

    if (resolvedAsset && typeof resolvedAsset.path === 'string') {
      if (collectionKey && resolvedAsset.path.includes('/admin/') && !resolvedAsset.path.includes('/admin/media/')) {
        return fallbackCollectionAssetUrl;
      }

      return resolvedAsset.path;
    }

    if (resolvedAsset && typeof resolvedAsset.toString === 'function') {
      const serializedValue = resolvedAsset.toString();
      if (serializedValue && serializedValue !== '[object Object]' && /^(blob:|data:|https?:\/\/)/i.test(serializedValue)) {
        return serializedValue;
      }

      if (
        serializedValue &&
        serializedValue !== '[object Object]' &&
        serializedValue.startsWith('/') &&
        (!collectionKey || serializedValue.includes('/admin/media/'))
      ) {
        return serializedValue;
      }
    }

    return fallbackCollectionAssetUrl;
  };

  const createElementFactory = (h) => {
    const renderImage = (url, alt, className, fallbackLabel) =>
      url
        ? h('img', {
            className,
            src: url,
            alt: alt || '',
          })
        : h('div', { className: `${className} blackbox-preview__media-fallback` }, fallbackLabel);

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

  const registerWhenReady = () => {
    if (!window.CMS || !window.createClass || !window.h || !window.initCMS) {
      window.setTimeout(registerWhenReady, 30);
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

    document.querySelector('.blackbox-cms-boot')?.remove();

    const HomePreview = createClass({
      render() {
        const entry = this.props.entry;
        const data = toObject(entry.get('data'));
        const hero = toObject(data.hero);
        const sections = toArray(data.sections);
        const latestReleases = findSection(sections, 'latest_releases');
        const artists = findSection(sections, 'artists');
        const distro = findSection(sections, 'distro');
        const journeyIndex = sections.findIndex((section) => section?.type === 'journey');
        const journey = journeyIndex >= 0 ? toObject(sections[journeyIndex]) : null;
        const heroImageUrl = resolveAssetUrl(entry.getIn(['data', 'hero', 'image']), this.props.getAsset, 'home');
        const journeyImageUrl =
          journeyIndex >= 0
            ? resolveAssetUrl(entry.getIn(['data', 'sections', journeyIndex, 'image']), this.props.getAsset, 'home')
            : null;

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
                    [
                      toText(latestReleases?.title || 'Releases'),
                      toText(artists?.title || 'Artists'),
                      toText(distro?.title || 'Distro'),
                    ].filter(Boolean),
                    'blackbox-preview__pill blackbox-preview__pill--muted',
                  ),
                ]),
                h('div', { className: 'blackbox-preview__hero-media' }, [
                  renderImage(heroImageUrl, hero.image_alt, 'blackbox-preview__media', 'Hero image'),
                ]),
              ]),
            ]),
            h('section', { className: 'blackbox-preview__grid blackbox-preview__grid--three' }, [
                h('article', { className: 'blackbox-preview__card' }, [
                  h(
                    'p',
                    { className: 'blackbox-preview__meta' },
                  toText(latestReleases?.section_label || 'Latest Releases'),
                  ),
                  h(
                    'h2',
                    { className: 'blackbox-preview__card-title' },
                  toText(latestReleases?.title || 'Latest Releases'),
                  ),
                renderButton(toText(latestReleases?.link_text || 'View All'), true),
                ]),
              h('article', { className: 'blackbox-preview__card' }, [
                h('p', { className: 'blackbox-preview__meta' }, toText(artists?.section_label || 'Artists')),
                h('h2', { className: 'blackbox-preview__card-title' }, toText(artists?.title || 'Artists')),
                renderButton(toText(artists?.button_text || 'View Full Roster'), true),
              ]),
              h('article', { className: 'blackbox-preview__card' }, [
                h('p', { className: 'blackbox-preview__meta' }, toText(distro?.section_label || 'Distro')),
                h('h2', { className: 'blackbox-preview__card-title' }, toText(distro?.title || 'Distro')),
                renderButton(toText(distro?.link_text || 'View All Distro'), true),
              ]),
            ]),
            journey && journeyImageUrl
              ? h('section', { className: 'blackbox-preview__journey-surface' }, [
              h('div', { className: 'blackbox-preview__journey-grid' }, [
                h('div', { className: 'blackbox-preview__journey-copy' }, [
                  h('p', { className: 'blackbox-preview__eyebrow' }, toText(journey.section_label || 'About')),
                  h(
                    'h2',
                    { className: 'blackbox-preview__title blackbox-preview__title--section' },
                    toText(journey.title || 'The Journey'),
                  ),
                  h(
                    'div',
                    { className: 'blackbox-preview__copy-stack' },
                    toArray(journey.paragraphs).slice(0, 2).map((paragraph, index) =>
                      h('p', { key: `journey-${index}`, className: 'blackbox-preview__copy' }, paragraph),
                    ),
                  ),
                  renderPills(
                    toArray(journey.stats)
                      .map((item) => titleCase(item.label || item.key))
                      .filter(Boolean),
                  ),
                ]),
                h('div', { className: 'blackbox-preview__journey-media' }, [
                  renderImage(
                    journeyImageUrl,
                    journey.image_alt,
                    'blackbox-preview__media blackbox-preview__media--muted',
                    'Journey image',
                  ),
                ]),
              ]),
              ])
              : null,
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
                  h('p', { className: 'blackbox-preview__copy blackbox-preview__copy--lead' }, toText(lead?.text || '')),
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
                    ? h('article', { className: 'blackbox-preview__card blackbox-preview__card--quote', key: 'quote' }, [
                        h('p', { className: 'blackbox-preview__eyebrow' }, 'Quote'),
                        h('blockquote', { className: 'blackbox-preview__quote' }, toText(quote.text)),
                        h('p', { className: 'blackbox-preview__meta' }, toText(quote.cite)),
                      ])
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
                          h('span', { className: 'blackbox-preview__card-title blackbox-preview__card-title--small' }, toText(item.key)),
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
                        h('p', { className: 'blackbox-preview__meta' }, titleCase(service.id || `service-${index + 1}`)),
                        h('h2', { className: 'blackbox-preview__card-title' }, toText(service.title)),
                        h('p', { className: 'blackbox-preview__copy' }, toText(service.summary)),
                        renderBulletList(toArray(service.bullets)),
                        service.partner_name
                          ? renderPills([`With ${service.partner_name}`], 'blackbox-preview__pill blackbox-preview__pill--accent')
                          : null,
                        h('p', { className: 'blackbox-preview__meta blackbox-preview__meta--note' }, toText(service.contact_note)),
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
                      h('article', { className: 'blackbox-preview__card blackbox-preview__card--step', key: `step-${index}` }, [
                        h('span', { className: 'blackbox-preview__step-number' }, `0${index + 1}`),
                        h(
                          'h3',
                          { className: 'blackbox-preview__card-title blackbox-preview__card-title--small' },
                          toText(step.title),
                        ),
                        h('p', { className: 'blackbox-preview__copy' }, toText(step.body)),
                      ]),
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
                  renderPills(['Name', 'Email', 'Band / Project', 'Service', 'Message'], 'blackbox-preview__pill blackbox-preview__pill--outline'),
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
                data.upcoming_release
                  ? h('p', { className: 'blackbox-preview__meta blackbox-preview__meta--note' }, `Upcoming: ${data.upcoming_release}`)
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
                h(
                  'h1',
                  { className: 'blackbox-preview__title blackbox-preview__title--section' },
                  toText(data.title),
                ),
                h('p', { className: 'blackbox-preview__meta' }, toText(data.artist_or_label)),
                data.summary ? h('p', { className: 'blackbox-preview__copy' }, toText(data.summary)) : null,
                renderPills([data.eyebrow, data.format].filter(Boolean), 'blackbox-preview__pill blackbox-preview__pill--outline'),
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
              ]),
            ]),
          ]),
        ]);
      },
    });

    const registeredPreviewCollections = ['home-site', 'about-site', 'services-site', 'artists', 'releases', 'distro', 'news'];

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

    window.__BLACKBOX_ADMIN_READY__ = true;
    window.__BLACKBOX_ADMIN_PREVIEW_COLLECTIONS__ = registeredPreviewCollections;

    window.initCMS();
    startEntryEditorPreviewController();
  };

  registerWhenReady();
})();

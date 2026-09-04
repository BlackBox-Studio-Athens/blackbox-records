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

function resolveAssetUrl(value, getAsset) {
  if (typeof value !== 'string' || !value.trim()) return '';
  try {
    const url = getAsset(value)?.url;
    if (typeof url !== 'string') return '';
    const protocol = new URL(url, 'https://preview.invalid').protocol;
    return ['blob:', 'http:', 'https:'].includes(protocol) || url.startsWith('data:image/') ? url : '';
  } catch {
    return '';
  }
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

export function registerPreviews(CMS, createClass, h) {
  const { renderButton, renderBulletList, renderImage, renderPills } = createElementFactory(h);
  CMS.registerPreviewStyle('./preview.css');
  const HomePreview = createClass({
    render() {
      const entry = this.props.entry;
      const data = toObject(entry.get('data'));
      const hero = toObject(data.hero);
      const news = toObject(data.news);
      const artists = toObject(data.artists);
      const heroImageUrl = resolveAssetUrl(entry.getIn(['data', 'hero', 'image']), this.props.getAsset);

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
      const lead = toObject(data.lead);
      const story = toObject(data.story);
      const quote = toObject(data.quote);
      const contact = toObject(data.contact);
      const stats = toObject(data.stats);
      const hasStory = Object.keys(story).length > 0;
      const hasQuote = Object.keys(quote).length > 0;
      const hasContact = Object.keys(contact).length > 0;
      const hasStats = Object.keys(stats).length > 0;
      const heroImageUrl = resolveAssetUrl(entry.getIn(['data', 'hero', 'image']), this.props.getAsset);

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
          hasStory || hasQuote || hasContact
            ? h('section', { className: 'blackbox-preview__grid blackbox-preview__grid--two' }, [
                hasStory
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
                hasQuote
                  ? h('article', { className: 'blackbox-preview__card blackbox-preview__card--quote', key: 'quote' }, [
                      h('p', { className: 'blackbox-preview__eyebrow' }, 'Quote'),
                      h('blockquote', { className: 'blackbox-preview__quote' }, toText(quote.text)),
                      h('p', { className: 'blackbox-preview__meta' }, toText(quote.cite)),
                    ])
                  : null,
                hasContact
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
          hasStats
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
      const servicesSection = toObject(data.services);
      const process = toObject(data.process);
      const inquiry = toObject(data.inquiry);
      const hasServices = Object.keys(servicesSection).length > 0;
      const hasProcess = Object.keys(process).length > 0;
      const hasInquiry = Object.keys(inquiry).length > 0;

      return h('div', { className: 'blackbox-preview blackbox-preview--services' }, [
        h('div', { className: 'blackbox-preview__shell' }, [
          h('section', { className: 'blackbox-preview__header-strip' }, [
            h('p', { className: 'blackbox-preview__eyebrow' }, 'Services'),
            h('h1', { className: 'blackbox-preview__title' }, toText(hero.title || 'Services')),
            h('p', { className: 'blackbox-preview__copy blackbox-preview__copy--lead' }, toText(hero.intro)),
            renderButton(toText(hero.cta_text || 'Start an Inquiry'), true),
          ]),
          hasServices
            ? h(
                'section',
                { className: 'blackbox-preview__stack blackbox-preview__stack--large' },
                toArray(servicesSection.items).map((service, index) => {
                  const imageUrl = resolveAssetUrl(
                    entry.getIn(['data', 'services', 'items', index, 'image']),
                    this.props.getAsset,
                  );
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
          hasProcess
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
          hasInquiry
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
      const imageUrl = resolveAssetUrl(entry.getIn(['data', 'image']), this.props.getAsset);
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
      const coverImageUrl = resolveAssetUrl(entry.getIn(['data', 'cover_image']), this.props.getAsset);
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
                'Editorial preview only. Price, stock, checkout availability, orders, and fulfillment are managed outside the CMS.',
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
      const imageUrl = resolveAssetUrl(entry.getIn(['data', 'image']), this.props.getAsset);

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
      const imageUrl = resolveAssetUrl(entry.getIn(['data', 'image']), this.props.getAsset);
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

  CMS.registerPreviewTemplate('home-site', HomePreview);
  CMS.registerPreviewTemplate('about-site', AboutPreview);
  CMS.registerPreviewTemplate('services-site', ServicesPreview);
  CMS.registerPreviewTemplate('artists', ArtistPreview);
  CMS.registerPreviewTemplate('releases', ReleasePreview);
  CMS.registerPreviewTemplate('distro', DistroPreview);
  CMS.registerPreviewTemplate('news', NewsPreview);
}

const HEADER_ELEMENT_SELECTOR = '[data-header]'
const HEADER_NAV_TOGGLE_SELECTOR = '[data-nav-toggle]'
const MOBILE_NAV_PANEL_SELECTOR = '[data-mobile-nav]'
const FEATURED_ARTIST_GRID_SELECTOR = '[data-featured-artist-grid]'
const FEATURED_ARTISTS_DATA_ELEMENT_ID = 'homepage-featured-artists-data'
const DEFAULT_FEATURED_ARTIST_LIMIT = 5
const NAVIGATION_OPEN_STATE_CLASS_NAME = 'is-site-navigation-open'
const MUSIC_STREAMING_SERVICE_EMBEDDED_PLAYER_MODAL_SELECTOR = '[data-music-streaming-service-embedded-player-modal]'
const MUSIC_STREAMING_SERVICE_EMBEDDED_PLAYER_MODAL_CLOSE_SELECTOR = '[data-music-streaming-service-embedded-player-close]'
const MUSIC_STREAMING_SERVICE_EMBEDDED_PLAYER_MODAL_IFRAME_SELECTOR = '[data-music-streaming-service-embedded-player-iframe]'
const MUSIC_STREAMING_SERVICE_EMBEDDED_PLAYER_MODAL_PANEL_SELECTOR = '[data-music-streaming-service-embedded-player-panel]'
const MUSIC_STREAMING_SERVICE_EMBEDDED_PLAYER_SWITCHER_SELECTOR = '[data-music-streaming-service-embedded-player-switcher]'
const MUSIC_STREAMING_SERVICE_EMBEDDED_PLAYER_PROVIDER_BUTTON_SELECTOR = '[data-music-streaming-service-embedded-player-provider]'
const MUSIC_STREAMING_SERVICE_EMBEDDED_PLAYER_CARD_SELECTOR = '[data-music-streaming-service-embedded-player-card]'
const MUSIC_STREAMING_SERVICE_EMBEDDED_PLAYER_TRIGGER_SELECTOR = '[data-music-streaming-service-embedded-player-trigger]'
const MUSIC_STREAMING_SERVICE_EMBEDDED_PLAYER_MODAL_OPEN_STATE_CLASS_NAME = 'is-music-streaming-service-embedded-player-modal-open'
const MUSIC_STREAMING_SERVICE_EMBEDDED_PLAYER_PROVIDER_PRIORITY = ['bandcamp', 'tidal']
const musicStreamingServiceEmbeddedPlayerProviderSelectionByTitle = new Map()

initializeHeaderNavigation()
initializeHomepageFeaturedArtistShowcase()
initializeMusicStreamingServiceEmbeddedPlayerSwitchers()
initializeMusicStreamingServiceEmbeddedPlayerModal()

function initializeHeaderNavigation() {
  const headerElement = findHeaderElement()
  if (!headerElement) return
  initializeHeaderNavigationElements(headerElement)
}

function initializeHeaderNavigationElements(headerElement) {
  const navToggleButton = findHeaderNavToggleButton(headerElement)
  const mobileNavPanel = findHeaderMobileNavPanel(headerElement)
  if (!navToggleButton || !mobileNavPanel) return
  connectHeaderInteractions(headerElement, navToggleButton, mobileNavPanel)
}

function connectHeaderInteractions(headerElement, navToggleButton, mobileNavPanel) {
  connectNavigationToggle(headerElement, navToggleButton)
  connectNavigationAutoClose(headerElement, navToggleButton, mobileNavPanel)
}

function connectNavigationToggle(headerElement, navToggleButton) {
  navToggleButton.addEventListener('click', () => {
    const isNavigationOpen = headerElement.classList.contains(NAVIGATION_OPEN_STATE_CLASS_NAME)
    setNavigationState(headerElement, navToggleButton, !isNavigationOpen)
  })
}

function connectNavigationAutoClose(headerElement, navToggleButton, mobileNavPanel) {
  mobileNavPanel.querySelectorAll('a').forEach((linkElement) => {
    linkElement.addEventListener('click', () => setNavigationState(headerElement, navToggleButton, false))
  })
}

function setNavigationState(headerElement, navToggleButton, isOpen) {
  navToggleButton.setAttribute('aria-expanded', isOpen ? 'true' : 'false')
  headerElement.classList.toggle(NAVIGATION_OPEN_STATE_CLASS_NAME, isOpen)
}

function findHeaderElement() {
  return document.querySelector(HEADER_ELEMENT_SELECTOR)
}

function findHeaderNavToggleButton(headerElement) {
  return headerElement.querySelector(HEADER_NAV_TOGGLE_SELECTOR)
}

function findHeaderMobileNavPanel(headerElement) {
  return headerElement.querySelector(MOBILE_NAV_PANEL_SELECTOR)
}

function findFeaturedArtistGridElement() {
  return document.querySelector(FEATURED_ARTIST_GRID_SELECTOR)
}

function findFeaturedArtistsDataElement() {
  return document.getElementById(FEATURED_ARTISTS_DATA_ELEMENT_ID)
}

function findMusicStreamingServiceEmbeddedPlayerModalElement() {
  return document.querySelector(MUSIC_STREAMING_SERVICE_EMBEDDED_PLAYER_MODAL_SELECTOR)
}

function findmusicStreamingServiceEmbeddedPlayerCardElements() {
  return Array.from(document.querySelectorAll(MUSIC_STREAMING_SERVICE_EMBEDDED_PLAYER_CARD_SELECTOR))
}

function findMusicStreamingServiceEmbeddedPlayerPanels() {
  return Array.from(document.querySelectorAll(MUSIC_STREAMING_SERVICE_EMBEDDED_PLAYER_MODAL_PANEL_SELECTOR))
}

function findMusicStreamingServiceEmbeddedPlayerIframe(containerElement) {
  return containerElement.querySelector(MUSIC_STREAMING_SERVICE_EMBEDDED_PLAYER_MODAL_IFRAME_SELECTOR)
}

function findMusicStreamingServiceEmbeddedPlayerCloseButton(modalElement) {
  return modalElement.querySelector(MUSIC_STREAMING_SERVICE_EMBEDDED_PLAYER_MODAL_CLOSE_SELECTOR)
}

function findMusicStreamingServiceEmbeddedPlayerTitleElement(modalElement) {
  return modalElement.querySelector('#music-streaming-service-embedded-player-modal-title')
}

function findMusicStreamingServiceEmbeddedPlayerSwitcher(containerElement) {
  return containerElement.querySelector(MUSIC_STREAMING_SERVICE_EMBEDDED_PLAYER_SWITCHER_SELECTOR)
}

function findMusicStreamingServiceEmbeddedPlayerProviderButtons(containerElement) {
  return Array.from(containerElement.querySelectorAll(MUSIC_STREAMING_SERVICE_EMBEDDED_PLAYER_PROVIDER_BUTTON_SELECTOR))
}


function readMusicStreamingServiceEmbeddedPlayerTitleFromElement(element) {
  return element.dataset.musicStreamingServiceEmbeddedPlayerTitle || ''
}

function readMusicStreamingServiceEmbeddedPlayerProvidersFromElement(element) {
  const providers = [
    {
      id: 'bandcamp',
      label: 'Bandcamp',
      embedUrl: element.dataset.musicStreamingServiceEmbeddedPlayerBandcampEmbedUrl,
    },
    {
      id: 'tidal',
      label: 'Tidal',
      embedUrl: element.dataset.musicStreamingServiceEmbeddedPlayerTidalEmbedUrl,
    },
  ]
  return providers.filter((provider) => Boolean(provider.embedUrl))
}

function selectDefaultMusicStreamingServiceEmbeddedPlayerProvider(providers) {
  const providerById = new Map(providers.map((provider) => [provider.id, provider]))
  const preferredProviderId = MUSIC_STREAMING_SERVICE_EMBEDDED_PLAYER_PROVIDER_PRIORITY.find((id) => providerById.has(id))
  return preferredProviderId ? providerById.get(preferredProviderId) : providers[0]
}

function initializeMusicStreamingServiceEmbeddedPlayerSwitchers() {
  findMusicStreamingServiceEmbeddedPlayerPanels().forEach((containerElement) => {
    connectMusicStreamingServiceEmbeddedPlayerProviderButtons(containerElement)
    refreshMusicStreamingServiceEmbeddedPlayerPanel(containerElement)
  })
}

function initializeHomepageFeaturedArtistShowcase() {
  const artistGridElement = findFeaturedArtistGridElement()
  const artistsDataElement = findFeaturedArtistsDataElement()
  if (!artistGridElement || !artistsDataElement) return
  renderRandomArtistsFromData(artistGridElement, artistsDataElement)
}

function initializeMusicStreamingServiceEmbeddedPlayerModal() {
  const modalElement = findMusicStreamingServiceEmbeddedPlayerModalElement()
  if (!modalElement) return
  const musicStreamingServiceEmbeddedPlayerCardElements = findmusicStreamingServiceEmbeddedPlayerCardElements()
  if (musicStreamingServiceEmbeddedPlayerCardElements.length === 0) return
  const modalState = buildMusicStreamingServiceEmbeddedPlayerModalState(modalElement)
  if (!modalState) return
  connectMusicStreamingServiceEmbeddedPlayerTriggers(musicStreamingServiceEmbeddedPlayerCardElements, modalState)
  connectMusicStreamingServiceEmbeddedPlayerModalCloseInteractions(modalState)
}

function buildMusicStreamingServiceEmbeddedPlayerModalState(modalElement) {
  const containerElement = modalElement.querySelector(MUSIC_STREAMING_SERVICE_EMBEDDED_PLAYER_MODAL_PANEL_SELECTOR)
  const iframeElement = findMusicStreamingServiceEmbeddedPlayerIframe(modalElement)
  const closeButton = findMusicStreamingServiceEmbeddedPlayerCloseButton(modalElement)
  const titleElement = findMusicStreamingServiceEmbeddedPlayerTitleElement(modalElement)
  if (!iframeElement || !closeButton || !containerElement) return null
  return {
    modalElement,
    containerElement,
    iframeElement,
    closeButton,
    titleElement,
  }
}

function connectMusicStreamingServiceEmbeddedPlayerTriggers(musicStreamingServiceEmbeddedPlayerCardElements, modalState) {
  musicStreamingServiceEmbeddedPlayerCardElements.forEach((musicStreamingServiceEmbeddedPlayerCardElement) => {
    musicStreamingServiceEmbeddedPlayerCardElement.addEventListener('click', (event) => {
      if (!event.target.closest(MUSIC_STREAMING_SERVICE_EMBEDDED_PLAYER_TRIGGER_SELECTOR)) return
      const providers = readMusicStreamingServiceEmbeddedPlayerProvidersFromElement(musicStreamingServiceEmbeddedPlayerCardElement)
      if (providers.length === 0) return
      event.preventDefault()
      openMusicStreamingServiceEmbeddedPlayerModal(modalState, providers, readMusicStreamingServiceEmbeddedPlayerTitleFromElement(musicStreamingServiceEmbeddedPlayerCardElement))
    })
  })
}

function connectMusicStreamingServiceEmbeddedPlayerModalCloseInteractions(modalState) {
  modalState.closeButton.addEventListener('click', () => closeMusicStreamingServiceEmbeddedPlayerModal(modalState))
  modalState.modalElement.addEventListener('click', (event) => {
    if (event.target === modalState.modalElement) {
      closeMusicStreamingServiceEmbeddedPlayerModal(modalState)
    }
  })
  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape') return
    if (modalState.modalElement.hidden) return
    closeMusicStreamingServiceEmbeddedPlayerModal(modalState)
  })
}

function openMusicStreamingServiceEmbeddedPlayerModal(modalState, providers, releaseTitle) {
  const currentTitle = modalState.containerElement.dataset.musicStreamingServiceEmbeddedPlayerCurrentTitle || ''
  const isSameRelease = releaseTitle && currentTitle === releaseTitle
  setMusicStreamingServiceEmbeddedPlayerPanelProviderData(modalState.containerElement, providers, releaseTitle)
  refreshMusicStreamingServiceEmbeddedPlayerPanel(modalState.containerElement, releaseTitle, !isSameRelease)
  if (releaseTitle) {
    modalState.containerElement.dataset.musicStreamingServiceEmbeddedPlayerCurrentTitle = releaseTitle
  }
  if (modalState.titleElement) {
    modalState.titleElement.textContent = releaseTitle || ''
  }
  modalState.modalElement.hidden = false
  document.body.classList.add(MUSIC_STREAMING_SERVICE_EMBEDDED_PLAYER_MODAL_OPEN_STATE_CLASS_NAME)
}

function closeMusicStreamingServiceEmbeddedPlayerModal(modalState) {
  modalState.modalElement.hidden = true
  if (modalState.titleElement) {
    modalState.titleElement.textContent = ''
  }
  document.body.classList.remove(MUSIC_STREAMING_SERVICE_EMBEDDED_PLAYER_MODAL_OPEN_STATE_CLASS_NAME)
}

function setMusicStreamingServiceEmbeddedPlayerPanelProviderData(containerElement, providers, releaseTitle) {
  delete containerElement.dataset.musicStreamingServiceEmbeddedPlayerBandcampEmbedUrl
  delete containerElement.dataset.musicStreamingServiceEmbeddedPlayerTidalEmbedUrl
  providers.forEach((provider) => {
    if (provider.id === 'bandcamp') {
      containerElement.dataset.musicStreamingServiceEmbeddedPlayerBandcampEmbedUrl = provider.embedUrl
    }
    if (provider.id === 'tidal') {
      containerElement.dataset.musicStreamingServiceEmbeddedPlayerTidalEmbedUrl = provider.embedUrl
    }
  })
  if (releaseTitle) {
    containerElement.dataset.musicStreamingServiceEmbeddedPlayerTitle = releaseTitle
  }
}

function refreshMusicStreamingServiceEmbeddedPlayerPanel(containerElement, releaseTitle, forceInitialize = false) {
  const providers = readMusicStreamingServiceEmbeddedPlayerProvidersFromElement(containerElement)
  updateMusicStreamingServiceEmbeddedPlayerSwitcher(containerElement, providers)
  if (providers.length === 0) return
  if (releaseTitle) {
    updateMusicStreamingServiceEmbeddedPlayerTitle(containerElement, releaseTitle)
  }
  if (forceInitialize || !containerElement.dataset.musicStreamingServiceEmbeddedPlayerInitialized) {
    const cachedProviderId = readCachedMusicStreamingServiceEmbeddedPlayerProviderId(containerElement)
    const cachedProvider = providers.find((provider) => provider.id === cachedProviderId)
    applyMusicStreamingServiceEmbeddedPlayerProvider(containerElement, cachedProvider || selectDefaultMusicStreamingServiceEmbeddedPlayerProvider(providers))
    containerElement.dataset.musicStreamingServiceEmbeddedPlayerInitialized = 'true'
  }
}

function updateMusicStreamingServiceEmbeddedPlayerSwitcher(containerElement, providers) {
  const switcher = findMusicStreamingServiceEmbeddedPlayerSwitcher(containerElement)
  const buttons = findMusicStreamingServiceEmbeddedPlayerProviderButtons(containerElement)
  if (!switcher) return
  const providerIds = providers.map((provider) => provider.id)
  switcher.hidden = providers.length === 0
  buttons.forEach((button) => {
    const providerId = button.dataset.musicStreamingServiceEmbeddedPlayerProvider
    button.hidden = !providerIds.includes(providerId)
  })
}

function connectMusicStreamingServiceEmbeddedPlayerProviderButtons(containerElement) {
  const buttons = findMusicStreamingServiceEmbeddedPlayerProviderButtons(containerElement)
  if (buttons.length === 0) return
  buttons.forEach((button) => {
    button.addEventListener('click', () => {
      const providers = readMusicStreamingServiceEmbeddedPlayerProvidersFromElement(containerElement)
      const provider = providers.find((item) => item.id === button.dataset.musicStreamingServiceEmbeddedPlayerProvider)
      if (!provider) return
      applyMusicStreamingServiceEmbeddedPlayerProvider(containerElement, provider)
    })
  })
}

function applyMusicStreamingServiceEmbeddedPlayerProvider(containerElement, provider) {
  const iframeElement = findMusicStreamingServiceEmbeddedPlayerIframe(containerElement)
  const buttons = findMusicStreamingServiceEmbeddedPlayerProviderButtons(containerElement)
  containerElement.dataset.musicStreamingServiceEmbeddedPlayerActiveProvider = provider.id
  storeCachedMusicStreamingServiceEmbeddedPlayerProvider(containerElement, provider.id)
  if (iframeElement) {
    if (iframeElement.src !== provider.embedUrl) {
      iframeElement.src = provider.embedUrl
    }
    const releaseTitle = readMusicStreamingServiceEmbeddedPlayerTitleFromElement(containerElement)
    iframeElement.title = releaseTitle ? `${releaseTitle} player` : 'Music streaming service embedded player'
  }
  buttons.forEach((button) => {
    const isActive = button.dataset.musicStreamingServiceEmbeddedPlayerProvider === provider.id
    button.classList.toggle('is-music-streaming-service-embedded-player-provider-active', isActive)
  })
}

function updateMusicStreamingServiceEmbeddedPlayerTitle(containerElement, releaseTitle) {
  const titleElement = containerElement.querySelector('.music-streaming-service-embedded-player-modal-title-text')
  if (titleElement) {
    titleElement.textContent = releaseTitle || ''
  }
}

function readCachedMusicStreamingServiceEmbeddedPlayerProviderId(containerElement) {
  const releaseTitle = readMusicStreamingServiceEmbeddedPlayerTitleFromElement(containerElement)
  if (!releaseTitle) return ''
  return musicStreamingServiceEmbeddedPlayerProviderSelectionByTitle.get(releaseTitle) || ''
}

function storeCachedMusicStreamingServiceEmbeddedPlayerProvider(containerElement, providerId) {
  const releaseTitle = readMusicStreamingServiceEmbeddedPlayerTitleFromElement(containerElement)
  if (!releaseTitle) return
  musicStreamingServiceEmbeddedPlayerProviderSelectionByTitle.set(releaseTitle, providerId)
}

function renderRandomArtistsFromData(artistGridElement, artistsDataElement) {
  const artistItems = parseArtistsFromDataElement(artistsDataElement)
  if (artistItems.length === 0) return
  const selectedArtists = selectRandomArtists(artistItems, readFeaturedArtistSelectionLimit(artistGridElement))
  renderArtistCards(artistGridElement, selectedArtists, readBaseUrl(artistGridElement))
}

function parseArtistsFromDataElement(artistsDataElement) {
  try {
    return normalizeArtistsArray(JSON.parse(artistsDataElement.textContent || '[]'))
  } catch (error) {
    return []
  }
}

function normalizeArtistsArray(parsedArtists) {
  return Array.isArray(parsedArtists) ? parsedArtists : []
}

function readFeaturedArtistSelectionLimit(artistGridElement) {
  const rawLimit = Number.parseInt(artistGridElement.dataset.maxItems || '', 10)
  return Number.isNaN(rawLimit) ? DEFAULT_FEATURED_ARTIST_LIMIT : Math.max(1, rawLimit)
}

function readBaseUrl(artistGridElement) {
  return (artistGridElement.dataset.siteBaseUrl || '').replace(/\/$/, '')
}

function selectRandomArtists(artistItems, artistLimit) {
  const shuffledArtists = shuffleArtists(artistItems.slice())
  return shuffledArtists.slice(0, Math.min(artistLimit, shuffledArtists.length))
}

function shuffleArtists(artistsToShuffle) {
  return artistsToShuffle.sort(() => Math.random() - 0.5)
}

function renderArtistCards(artistGridElement, selectedArtists, baseUrl) {
  clearElementChildren(artistGridElement)
  selectedArtists.map((artist) => createArtistCard(artist, baseUrl)).forEach((card) => artistGridElement.appendChild(card))
}

function clearElementChildren(elementToClear) {
  elementToClear.innerHTML = ''
}

function createArtistCard(artist, baseUrl) {
  const cardElement = createArtistCardAnchor(artist, baseUrl)
  const cardChildren = buildArtistCardChildren(artist, baseUrl)
  cardChildren.forEach((child) => cardElement.appendChild(child))
  return cardElement
}

function buildArtistCardChildren(artist, baseUrl) {
  const children = [
    createArtistImage(artist, baseUrl),
    createArtistOverlay(),
    createArtistContent(artist),
    createArtistBio(artist),
  ]
  return children.filter(Boolean)
}

function createArtistCardAnchor(artist, baseUrl) {
  const cardElement = document.createElement('a')
  cardElement.className = 'artist-roster-card-link'
  cardElement.href = normalizeUrl(resolveArtistProfilePath(artist), baseUrl)
  return cardElement
}

function createArtistImage(artist, baseUrl) {
  const imageElement = document.createElement('img')
  imageElement.src = normalizeUrl(artist.image || '', baseUrl)
  imageElement.alt = artist.image_alt || resolveArtistName(artist) || ''
  return imageElement
}

function createArtistOverlay() {
  const overlayElement = document.createElement('div')
  overlayElement.className = 'artist-roster-card-overlay-layer'
  return overlayElement
}

function createArtistContent(artist) {
  const contentElement = document.createElement('div')
  contentElement.className = 'artist-roster-card-text'
  appendOptionalGenre(contentElement, artist.genre)
  contentElement.appendChild(createArtistTitle(resolveArtistName(artist)))
  return contentElement
}

function appendOptionalGenre(contentElement, genreLabel) {
  if (!genreLabel) return
  const genreElement = document.createElement('p')
  genreElement.textContent = genreLabel
  contentElement.appendChild(genreElement)
}

function createArtistTitle(artistName) {
  const titleElement = document.createElement('h3')
  titleElement.textContent = (artistName || '').toUpperCase()
  titleElement.append(' ', createArrowElement())
  return titleElement
}

function resolveArtistName(artist) {
  return artist.title || artist.name || ''
}

function createArrowElement() {
  const arrowElement = document.createElement('span')
  arrowElement.setAttribute('aria-hidden', 'true')
  arrowElement.textContent = '\u2197'
  return arrowElement
}

function createArtistBio(artist) {
  if (!artist.bio) return null
  const bioElement = document.createElement('p')
  bioElement.className = 'artist-roster-card-bio-text'
  bioElement.textContent = artist.bio
  return bioElement
}

function normalizeUrl(path, baseUrl) {
  if (!path) return baseUrl || '/'
  if (/^https?:\/\//i.test(path)) return path
  if (!baseUrl) return path
  return path.startsWith('/') ? `${baseUrl}${path}` : `${baseUrl}/${path}`
}

function resolveArtistProfilePath(artist) {
  if (artist.url) return artist.url
  if (artist.slug) return `/artists/${artist.slug}/`
  return '/artists/'
}

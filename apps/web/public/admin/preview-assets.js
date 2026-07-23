(() => {
  const supportedExtensions = new Set(['.avif', '.gif', '.jpeg', '.jpg', '.png', '.webp']);
  const defaultCollections = ['about', 'artists', 'distro', 'home', 'news', 'releases', 'services'];

  const hasControlCharacter = (value) =>
    Array.from(value).some((character) => {
      const codePoint = character.codePointAt(0) || 0;
      return codePoint <= 31 || codePoint === 127;
    });

  const collectCandidateStrings = (value) => {
    if (typeof value === 'string') return [value];
    if (!value || typeof value !== 'object') return [];

    const candidates = [];
    try {
      if (typeof value.url === 'string') candidates.push(value.url);
      if (typeof value.path === 'string') candidates.push(value.path);

      if (typeof value.toString === 'function') {
        const serialized = value.toString();
        if (serialized && serialized !== '[object Object]') candidates.push(serialized);
      }
    } catch {
      return candidates;
    }

    return candidates;
  };

  const decodeSegment = (value) => {
    try {
      const decoded = decodeURIComponent(value).normalize('NFC');
      if (
        !decoded ||
        decoded === '.' ||
        decoded === '..' ||
        decoded.includes('/') ||
        decoded.includes('\\') ||
        hasControlCharacter(decoded) ||
        /%[0-9a-f]{2}/i.test(decoded)
      ) {
        return '';
      }
      return decoded;
    } catch {
      return '';
    }
  };

  const hasSupportedExtension = (asset) => {
    const extensionIndex = asset.lastIndexOf('.');
    return extensionIndex >= 0 && supportedExtensions.has(asset.slice(extensionIndex).toLowerCase());
  };

  const buildCollectionAssetUrl = ({ asset, collection, adminMediaBaseUrl, allowedCollections }) => {
    const decodedCollection = decodeSegment(collection);
    const decodedAsset = decodeSegment(asset);
    if (!allowedCollections.has(decodedCollection) || !decodedAsset || !hasSupportedExtension(decodedAsset)) return '';

    try {
      return new URL(
        `${encodeURIComponent(decodedCollection)}/${encodeURIComponent(decodedAsset)}`,
        adminMediaBaseUrl,
      ).toString();
    } catch {
      return '';
    }
  };

  const resolveRelativeCollectionAsset = ({ value, collectionKey, adminMediaBaseUrl, allowedCollections }) => {
    const normalized = value.trim().replace(/^\.\//, '');
    if (!normalized) return '';

    if (!normalized.includes('/')) {
      return buildCollectionAssetUrl({
        asset: normalized,
        collection: collectionKey,
        adminMediaBaseUrl,
        allowedCollections,
      });
    }

    const crossCollectionMatch = value.trim().match(/^\.\.\/([^/]+)\/([^/]+)$/);
    if (!crossCollectionMatch) return '';

    return buildCollectionAssetUrl({
      asset: crossCollectionMatch[2],
      collection: crossCollectionMatch[1],
      adminMediaBaseUrl,
      allowedCollections,
    });
  };

  const resolveAdminMediaUrl = ({ value, adminMediaBaseUrl, allowedCollections }) => {
    try {
      const mediaBase = new URL(adminMediaBaseUrl);
      const candidate = new URL(value, mediaBase.origin);
      if (candidate.origin !== mediaBase.origin || !candidate.pathname.startsWith(mediaBase.pathname)) return '';

      const relativePath = candidate.pathname.slice(mediaBase.pathname.length);
      const segments = relativePath.split('/');
      if (segments.length !== 2) return '';

      return buildCollectionAssetUrl({
        asset: segments[1],
        collection: segments[0],
        adminMediaBaseUrl,
        allowedCollections,
      });
    } catch {
      return '';
    }
  };

  const resolveCandidate = ({ value, collectionKey, adminMediaBaseUrl, allowedCollections }) => {
    const candidate = value.trim();
    if (!candidate || candidate.length > 8192) return '';
    if (/^blob:/i.test(candidate) || /^data:image\//i.test(candidate)) return candidate;
    if (/^data:/i.test(candidate)) return '';

    if (/^https?:\/\//i.test(candidate) || candidate.startsWith('/')) {
      let mediaBase;
      let parsedCandidate;
      try {
        mediaBase = new URL(adminMediaBaseUrl);
        parsedCandidate = new URL(candidate, mediaBase.origin);
      } catch {
        return '';
      }

      const adminRootPath = mediaBase.pathname.slice(0, -'media/'.length);
      if (parsedCandidate.origin === mediaBase.origin && parsedCandidate.pathname.startsWith(adminRootPath)) {
        return resolveAdminMediaUrl({ value: candidate, adminMediaBaseUrl, allowedCollections });
      }

      return /^https?:\/\//i.test(candidate) ? candidate : '';
    }

    return resolveRelativeCollectionAsset({ value: candidate, collectionKey, adminMediaBaseUrl, allowedCollections });
  };

  const resolvePreviewAssetUrl = ({
    value,
    getAsset,
    collectionKey,
    adminMediaBaseUrl,
    allowedCollections = defaultCollections,
  }) => {
    const allowedCollectionSet = new Set(allowedCollections);
    const candidates = [];

    if (typeof getAsset === 'function') {
      try {
        candidates.push(...collectCandidateStrings(getAsset(value)));
      } catch {
        // Decap asset resolution can reject unsaved values; raw value remains the bounded fallback candidate.
      }
    }
    try {
      candidates.push(...collectCandidateStrings(value));
    } catch {
      // A malformed Decap asset object must degrade to the visible preview fallback.
    }

    for (const candidate of candidates) {
      const resolved = resolveCandidate({
        value: candidate,
        collectionKey,
        adminMediaBaseUrl,
        allowedCollections: allowedCollectionSet,
      });
      if (resolved) return resolved;
    }

    return '';
  };

  window.__BLACKBOX_PREVIEW_ASSETS__ = Object.freeze({
    resolvePreviewAssetUrl,
    supportedExtensions: Object.freeze([...supportedExtensions]),
  });
})();
